/**
 * ============================================
 * FlowEditor — canvas do Planner (React Flow v12)
 * ============================================
 * Editor de um flow: toolbar, biblioteca de nodes e logos, canvas com
 * seleção/navegação/visualização, painel de propriedades do node e da
 * conexão, histórico (desfazer/refazer), copiar/colar/duplicar, auto-layout,
 * miniaturas reais de páginas, etapas recolhíveis, versões, PDF e link público.
 *
 * Tudo que o usuário faz passa por `markDirty` e é salvo 2s depois.
 * ============================================
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  MousePointer2, Hand, Eye, ImagePlus, AlignHorizontalJustifyStart, AlignVerticalJustifyStart, Map, Maximize2, Save, Share2,
  Download, History, Trash2, X, Plus, Activity, ExternalLink, ArrowLeft, Undo2, Redo2, Copy, ClipboardPaste, Workflow, Network,
} from 'lucide-react'
import {
  ReactFlow, Controls, Background, MiniMap, applyNodeChanges, applyEdgeChanges, addEdge, useReactFlow, MarkerType, Panel,
  type Node, type Edge, type NodeChange, type EdgeChange, type Connection, type Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useAuth } from '@/contexts/AuthContext'
import { EmptyState } from '@/components/canonical'
import { exportFlowToPdf } from '@/lib/exportFlowPdf'
import { enrichNodesWithLiveData } from '@/lib/enrichFlowWithLiveData'
import { getClientPerformance } from '@/services/adapters/performanceAdapter'
import { captureThumbnail } from '@/lib/plannerApi'
import { updateFlow, deleteFlow, enableShare, getFlowById, listFlowVersions, rollbackToVersion, type ClientFlow, type FlowVersion } from '@/services/adapters/clientFlowsAdapter'
import NodesSidebar, { SIZE_DIMENSIONS, nodeLabelFor, type NodeSize } from './NodesSidebar'
import LogoLibrary, { type LogoAsset } from './LogoLibrary'
import NodeEditPanel from './NodeEditPanel'
import EdgeEditPanel from './EdgeEditPanel'
import { PlannerChromeContext, type NodeAction } from './NodeChrome'
import { EDITOR_NODE_TYPES, PLANNER_EDGE_TYPES, COMPACT_NODE_TYPES, compactNodeStyle, sanitizeEdges } from './plannerNodeTypes'
import {
  normalizeLogo, removeSelection, alignSelection, visibleFlow, PLANNER_STAGES, autoLayout, copySelection, pasteSelection,
  duplicateSelection, decorateEdges, thumbnailRequest, applyThumbnail, failThumbnail, requestThumbnailRefresh, cleanForSave,
  type ClipboardPayload, type PlannerEdgeData,
} from './plannerModel'
import { usePlannerHistory } from './usePlannerHistory'
import VersionsModal from './VersionsModal'
import './planner.css'

interface FlowEditorProps {
  flowId: string
  onDeleted: () => void
  onBack: () => void
  onLoaded?: (flow: ClientFlow) => void
}

export default function FlowEditor({ flowId, onDeleted, onBack, onLoaded }: FlowEditorProps) {
  const { can } = useAuth()
  const canWrite = can('planner', 'write')
  const [mode, setMode] = useState<'select' | 'pan' | 'view'>('select')
  const readOnly = !canWrite || mode === 'view'
  const chrome = useMemo(() => ({ readOnly }), [readOnly])

  const [flow, setFlow] = useState<ClientFlow | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState('')
  const [logosOpen, setLogosOpen] = useState(false)
  const [nodesSidebarOpen, setNodesSidebarOpen] = useState(false)
  const [minimap, setMinimap] = useState(false)
  const [liveDataOn, setLiveDataOn] = useState(false)
  const [hiddenStages, setHiddenStages] = useState<Set<string>>(new Set())
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [versions, setVersions] = useState<FlowVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [exporting, setExporting] = useState(false)

  const revision = useRef(0)
  const saveLock = useRef(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const clipboard = useRef<ClipboardPayload | null>(null)
  const shotsInFlight = useRef(new Set<string>())
  const abort = useRef(new AbortController())
  const nodesRef = useRef(nodes); nodesRef.current = nodes
  const edgesRef = useRef(edges); edgesRef.current = edges
  const history = usePlannerHistory()
  const { fitView, getViewport, screenToFlowPosition } = useReactFlow()

  const notify = useCallback((message: string) => { setNotice(message); window.setTimeout(() => setNotice(current => current === message ? '' : current), 2600) }, [])
  const markDirty = useCallback(() => { revision.current += 1; setDirty(true); setSaveError('') }, [])
  const snapshot = useCallback(() => ({ nodes: nodesRef.current, edges: edgesRef.current }), [])
  const commit = useCallback((options?: { coalesceMs?: number }) => history.record(snapshot(), options), [history, snapshot])

  // ---------------------------------------------------------------- carga
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController(); abort.current = controller
    ;(async () => {
      const data = await getFlowById(flowId)
      if (cancelled) return
      if (data) {
        setFlow(data)
        setNodes((data.nodes || []).map(compactNodeStyle))
        setEdges(sanitizeEdges(data.edges || []))
        if (data.share_token && data.share_enabled) setShareUrl(`${window.location.origin}/p/${data.share_token}`)
        onLoaded?.(data)
      }
      setLoading(false)
      setTimeout(() => { void fitView({ padding: 0.2, duration: 400 }) }, 150)
    })()
    return () => { cancelled = true; controller.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId])

  // ------------------------------------------------------------ derivados
  const enrichedNodes = useMemo(() => {
    if (!liveDataOn || !flow) return nodes
    return enrichNodesWithLiveData(nodes, getClientPerformance(flow.client_slug))
  }, [nodes, liveDataOn, flow])
  const visible = useMemo(() => visibleFlow(enrichedNodes, edges, hiddenStages), [enrichedNodes, edges, hiddenStages])
  const displayEdges = useMemo(() => decorateEdges(visible.edges, visible.nodes, { liveData: liveDataOn }), [visible, liveDataOn])
  const editingNode = useMemo(() => nodes.find(n => n.id === editingNodeId) ?? null, [nodes, editingNodeId])
  const editingEdge = useMemo(() => edges.find(e => e.id === editingEdgeId) ?? null, [edges, editingEdgeId])
  const selectedCount = nodes.filter(n => n.selected).length
  const hasSelection = selectedCount > 0 || edges.some(e => e.selected)

  // ------------------------------------------------------- mudanças do RF
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const allowed = readOnly ? changes.filter(change => change.type === 'select' || change.type === 'dimensions') : changes
    if (allowed.some(change => change.type === 'remove')) commit()
    setNodes(current => applyNodeChanges(allowed, current))
    if (allowed.some(change => change.type !== 'select' && change.type !== 'dimensions')) markDirty()
  }, [readOnly, markDirty, commit])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const allowed = readOnly ? changes.filter(change => change.type === 'select') : changes
    if (allowed.some(change => change.type === 'remove')) commit()
    setEdges(current => applyEdgeChanges(allowed, current))
    if (allowed.some(change => change.type !== 'select')) markDirty()
  }, [readOnly, markDirty, commit])

  const onConnect = useCallback((connection: Connection) => {
    if (readOnly) return
    commit()
    setEdges(current => addEdge({ ...connection, type: 'conversionEdge', markerEnd: { type: MarkerType.ArrowClosed }, data: {} }, current))
    markDirty()
  }, [readOnly, markDirty, commit])

  // ------------------------------------------------------------- edição
  const patchNodes = useCallback((fn: (node: Node) => Node, options: { record?: boolean; coalesceMs?: number } = { record: true }) => {
    if (options.record !== false) commit({ coalesceMs: options.coalesceMs })
    setNodes(current => current.map(fn))
    markDirty()
  }, [commit, markDirty])

  const handleNodeDataUpdate = useCallback((nodeId: string, newData: Record<string, unknown>) => {
    if (readOnly) return
    patchNodes(n => n.id === nodeId ? normalizeLogo({ ...n, data: { ...n.data, ...newData } }) : n)
    setEditingNodeId(null)
  }, [readOnly, patchNodes])

  const updateEdgeProps = useCallback((edgeId: string, patch: { label?: string; data?: Partial<PlannerEdgeData> }) => {
    if (readOnly) return
    commit({ coalesceMs: 900 })
    setEdges(current => current.map(e => e.id === edgeId ? { ...e, ...(patch.label !== undefined ? { label: patch.label } : {}), data: { ...e.data, ...patch.data } } : e))
    markDirty()
  }, [readOnly, commit, markDirty])

  const reverseEdge = useCallback((edgeId: string) => {
    if (readOnly) return
    commit()
    setEdges(current => current.map(e => e.id === edgeId ? { ...e, source: e.target, target: e.source, sourceHandle: e.targetHandle ?? undefined, targetHandle: e.sourceHandle ?? undefined } : e))
    markDirty()
  }, [readOnly, commit, markDirty])

  const removeEdge = useCallback((edgeId: string) => {
    if (readOnly) return
    commit()
    setEdges(current => current.filter(e => e.id !== edgeId))
    setEditingEdgeId(null)
    markDirty()
  }, [readOnly, commit, markDirty])

  const deleteSelected = useCallback(() => {
    if (readOnly) return
    const next = removeSelection(nodesRef.current, edgesRef.current)
    if (next.nodes.length === nodesRef.current.length && next.edges.length === edgesRef.current.length) return
    commit()
    setNodes(next.nodes); setEdges(next.edges); setEditingNodeId(null); setEditingEdgeId(null); markDirty()
  }, [readOnly, commit, markDirty])

  const undo = useCallback(() => {
    const previous = history.undo(snapshot())
    if (!previous) return
    setNodes(previous.nodes); setEdges(previous.edges); markDirty(); notify('Desfeito')
  }, [history, snapshot, markDirty, notify])

  const redo = useCallback(() => {
    const next = history.redo(snapshot())
    if (!next) return
    setNodes(next.nodes); setEdges(next.edges); markDirty(); notify('Refeito')
  }, [history, snapshot, markDirty, notify])

  const copy = useCallback(() => {
    const payload = copySelection(nodesRef.current, edgesRef.current)
    if (!payload) return
    clipboard.current = payload
    notify(`${payload.nodes.length} ${payload.nodes.length === 1 ? 'node copiado' : 'nodes copiados'}`)
  }, [notify])

  const flowCenter = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const point = pointer.current ?? (rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: 0, y: 0 })
    return screenToFlowPosition(point)
  }, [screenToFlowPosition])

  const paste = useCallback(() => {
    if (readOnly || !clipboard.current) return
    commit()
    const next = pasteSelection(nodesRef.current, edgesRef.current, clipboard.current, flowCenter())
    setNodes(next.nodes); setEdges(next.edges); markDirty()
  }, [readOnly, commit, flowCenter, markDirty])

  const duplicate = useCallback((nodeId?: string) => {
    if (readOnly) return
    const base = nodeId ? nodesRef.current.map(n => ({ ...n, selected: n.id === nodeId })) : nodesRef.current
    if (!base.some(n => n.selected)) return
    commit()
    const next = duplicateSelection(base, edgesRef.current)
    setNodes(next.nodes); setEdges(next.edges); markDirty()
  }, [readOnly, commit, markDirty])

  const layout = useCallback((direction: 'LR' | 'TB') => {
    if (readOnly || !nodesRef.current.length) return
    commit()
    setNodes(autoLayout(nodesRef.current, edgesRef.current, direction))
    markDirty()
    setTimeout(() => { void fitView({ padding: 0.2, duration: 300 }) }, 50)
  }, [readOnly, commit, markDirty, fitView])

  const addAtCenter = useCallback((type: string, size: NodeSize = 'M', data?: Record<string, unknown>) => {
    if (readOnly) return
    const position = flowCenter()
    const brand = type.startsWith('brand:') ? type.slice(6) : null
    const nodeType = brand ? 'brand' : type
    const node = compactNodeStyle({ id: `${nodeType}-${crypto.randomUUID()}`, type: nodeType, position, data: data ?? { label: nodeLabelFor(type), ...(brand ? { brand } : {}) }, style: { ...SIZE_DIMENSIONS[size] } })
    commit()
    setNodes(current => [...current.map(n => ({ ...n, selected: false })), { ...node, selected: true }])
    setNodesSidebarOpen(false); setLogosOpen(false); setEditingNodeId(node.id); markDirty()
  }, [readOnly, flowCenter, commit, markDirty])
  const addLogo = useCallback((asset: LogoAsset) => addAtCenter('clientLogo', 'M', { label: asset.name, logoUrl: asset.url, size: 'M', fit: 'contain', padding: 8, background: '#ffffff' }), [addAtCenter])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    if (readOnly) return
    const rawType = event.dataTransfer.getData('application/reactflow')
    if (!rawType) return
    let width = 220, height = 120
    try { const parsed = JSON.parse(event.dataTransfer.getData('application/nodesize') || '{}'); width = parsed.width || width; height = parsed.height || height } catch { /* defaults */ }
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const brand = rawType.startsWith('brand:') ? rawType.split(':')[1] : null
    const nodeType = brand ? 'brand' : rawType
    const data = brand ? { brand, label: nodeLabelFor(rawType) } : { label: nodeLabelFor(rawType) }
    if (COMPACT_NODE_TYPES.has(nodeType)) { width = 112; height = 112 }
    commit()
    setNodes(current => [...current, compactNodeStyle({ id: `${nodeType}-${crypto.randomUUID()}`, type: nodeType, position, data, style: { width, height } })])
    markDirty()
  }, [readOnly, screenToFlowPosition, commit, markDirty])

  // ------------------------------------------------- eventos dos nodes/edges
  useEffect(() => {
    const onNodeAction = (event: Event) => {
      const { nodeId, action } = (event as CustomEvent<{ nodeId: string; action: NodeAction }>).detail
      if (action === 'edit') { setEditingNodeId(nodeId); setEditingEdgeId(null); return }
      if (readOnly) { notify('Somente leitura neste modo'); return }
      if (action === 'duplicate') duplicate(nodeId)
      if (action === 'delete') { commit(); const next = removeSelection(nodesRef.current.map(n => ({ ...n, selected: n.id === nodeId })), edgesRef.current); setNodes(next.nodes); setEdges(next.edges); setEditingNodeId(null); markDirty() }
      if (action === 'refresh-thumbnail') patchNodes(n => n.id === nodeId ? requestThumbnailRefresh(n) : n, { record: false })
    }
    const onEdgeSelect = (event: Event) => {
      const { edgeId } = (event as CustomEvent<{ edgeId: string }>).detail
      setEdges(current => current.map(e => ({ ...e, selected: e.id === edgeId })))
      setNodes(current => current.map(n => n.selected ? { ...n, selected: false } : n))
      setEditingEdgeId(edgeId); setEditingNodeId(null)
    }
    document.addEventListener('planner:node-action', onNodeAction)
    document.addEventListener('planner:edge-select', onEdgeSelect)
    return () => { document.removeEventListener('planner:node-action', onNodeAction); document.removeEventListener('planner:edge-select', onEdgeSelect) }
  }, [readOnly, duplicate, commit, markDirty, patchNodes, notify])

  // ------------------------------------------------------------ teclado
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return
      const meta = event.ctrlKey || event.metaKey
      if (event.key === 'Escape') { setEditingNodeId(null); setEditingEdgeId(null); return }
      if (event.key === 'Backspace' || event.key === 'Delete') { deleteSelected(); return }
      if (!meta) return
      const key = event.key.toLowerCase()
      if (key === 'z' && event.shiftKey) { event.preventDefault(); redo() }
      else if (key === 'z') { event.preventDefault(); undo() }
      else if (key === 'y') { event.preventDefault(); redo() }
      else if (key === 'c') { copy() }
      else if (key === 'v') { paste() }
      else if (key === 'd') { event.preventDefault(); duplicate() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [deleteSelected, undo, redo, copy, paste, duplicate])

  // ------------------------------------------------- miniaturas de páginas
  useEffect(() => {
    if (!flow) return
    for (const node of nodes) {
      const request = thumbnailRequest(node)
      if (!request || shotsInFlight.current.has(node.id)) continue
      if (request.refresh && !canWrite) { setNodes(current => current.map(n => n.id === node.id ? { ...n, data: { ...n.data, thumbnailRefresh: undefined } } : n)); continue }
      shotsInFlight.current.add(node.id)
      setNodes(current => current.map(n => n.id === node.id ? { ...n, data: { ...n.data, thumbnailPending: true, thumbnailRefresh: undefined } } : n))
      captureThumbnail(flow.client_slug, request.url, request.refresh, abort.current.signal)
        .then(result => { setNodes(current => current.map(n => n.id === node.id ? applyThumbnail(n, request.url, result.url) : n)); if (canWrite) markDirty() })
        .catch((error: Error) => { if (error.name === 'AbortError') return; setNodes(current => current.map(n => n.id === node.id ? failThumbnail(n, request.url) : n)); notify(error.message || 'Não foi possível capturar a página.') })
        .finally(() => shotsInFlight.current.delete(node.id))
    }
  }, [nodes, flow, canWrite, markDirty, notify])

  // ------------------------------------------------------- persistência
  const handleSave = useCallback(async () => {
    if (!flow || !canWrite || saveLock.current) return
    saveLock.current = true
    const savedRevision = revision.current
    setSaving(true)
    try {
      const viewport: Viewport = getViewport()
      const updated = await updateFlow({ id: flow.id, nodes: cleanForSave(nodesRef.current), edges: edgesRef.current, viewport })
      if (updated) { setFlow(updated); if (revision.current === savedRevision) setDirty(false) }
      else setSaveError('Não foi possível salvar. Suas alterações continuam nesta tela.')
    } catch (error) {
      console.error('[FlowEditor] save failed:', error)
      setSaveError('Falha ao salvar. Tente novamente.')
    } finally { setSaving(false); saveLock.current = false }
  }, [flow, getViewport, canWrite])

  useEffect(() => {
    if (!dirty || !flow || !canWrite || saving || saveError) return
    const timer = setTimeout(() => { void handleSave() }, 2000)
    return () => clearTimeout(timer)
  }, [dirty, flow, handleSave, canWrite, saving, saveError])

  const handleShare = useCallback(async () => {
    if (!flow || !canWrite) return
    let url = shareUrl
    if (!url) { const token = await enableShare(flow.id); if (!token) { notify('Não foi possível gerar o link público.'); return } url = `${window.location.origin}/p/${token}`; setShareUrl(url) }
    try { await navigator.clipboard.writeText(url); notify('Link público copiado') } catch { window.prompt('Copie o link público do fluxo:', url) }
  }, [flow, canWrite, shareUrl, notify])

  const handleDelete = useCallback(async () => {
    if (!flow || !canWrite || !confirm(`Excluir definitivamente "${flow.name}"?`)) return
    await deleteFlow(flow.id)
    onDeleted()
  }, [flow, onDeleted, canWrite])

  const handleOpenVersions = useCallback(async () => {
    if (!flow) return
    setVersionsOpen(true); setLoadingVersions(true)
    setVersions(await listFlowVersions(flow.id))
    setLoadingVersions(false)
  }, [flow])

  const handleRollback = useCallback(async (versionId: string, versionNumber: number) => {
    if (!flow || !canWrite || saveLock.current) return
    if (!confirm(`Restaurar versão ${versionNumber}? A versão atual (v${flow.version}) será salva no histórico antes.`)) return
    const restored = await rollbackToVersion(flow.id, versionId)
    if (!restored) return
    history.reset()
    setFlow(restored); setNodes((restored.nodes || []).map(compactNodeStyle)); setEdges(sanitizeEdges(restored.edges || [])); setDirty(false); setVersionsOpen(false)
    setTimeout(() => { void fitView({ padding: 0.2, duration: 400 }) }, 150)
  }, [flow, fitView, canWrite, history])

  const handleExportPdf = useCallback(async () => {
    if (!flow) return
    setExporting(true)
    try {
      await fitView({ padding: 0.2, duration: 0 })
      await new Promise(resolve => setTimeout(resolve, 300))
      await exportFlowToPdf({ flowName: flow.name, clientName: flow.client_slug, description: flow.description || undefined, version: flow.version, nodes })
      notify('PDF exportado')
    } catch (error) { console.error('[exportPdf] failed', error); notify('Falha ao exportar PDF.') }
    finally { setExporting(false) }
  }, [flow, nodes, fitView, notify])

  const toggleLiveData = useCallback(() => {
    if (!liveDataOn && flow && !getClientPerformance(flow.client_slug)) notify('Sem métricas ao vivo para este cliente ainda')
    setLiveDataOn(v => !v)
  }, [liveDataOn, flow, notify])

  // ------------------------------------------------------------- render
  if (loading) return <div className="h-[calc(100vh-180px)] flex items-center justify-center bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
  if (!flow) return <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl"><EmptyState title="Flow não encontrado" description="Esse flow foi excluído ou não existe mais." action={<button onClick={onBack} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">Voltar</button>} /></div>

  const stagesInUse = PLANNER_STAGES.filter(stage => nodes.some(n => n.data.stage === stage))

  return (
    <PlannerChromeContext.Provider value={chrome}>
    <div className="planner-editor">
      <div className="planner-toolbar">
        <div className="planner-title"><h2>{flow.name}</h2><span>{saving ? 'Salvando...' : dirty ? 'Alterações pendentes' : 'Salvo'} · v{flow.version}</span></div>
        <div className="planner-tools">
          <button title="Voltar à lista de flows" aria-label="Voltar à lista de flows" onClick={onBack}><ArrowLeft size={16} /></button>
          {canWrite && <button title="Adicionar node" aria-label="Adicionar node" aria-pressed={nodesSidebarOpen} onClick={() => { setMode('select'); setNodesSidebarOpen(v => !v); setLogosOpen(false); setEditingNodeId(null) }}><Plus size={18} /></button>}
          {canWrite && <button title="Logos do cliente" aria-label="Logos do cliente" aria-pressed={logosOpen} onClick={() => { setMode('select'); setLogosOpen(v => !v); setNodesSidebarOpen(false); setEditingNodeId(null) }}><ImagePlus size={18} /></button>}
          <div className="planner-modes" role="group" aria-label="Modo do canvas">
            {canWrite && <button aria-label="Selecionar" title="Selecionar e editar" aria-pressed={mode === 'select'} onClick={() => setMode('select')}><MousePointer2 size={16} /></button>}
            <button aria-label="Navegar" title="Navegar (arrastar o canvas)" aria-pressed={mode === 'pan'} onClick={() => setMode('pan')}><Hand size={16} /></button>
            <button aria-label="Visualizar" title="Visualizar sem edição" aria-pressed={readOnly} onClick={() => { setMode('view'); setNodesSidebarOpen(false); setLogosOpen(false); setEditingEdgeId(null) }}><Eye size={16} /></button>
          </div>
          {canWrite && <div className="planner-group" role="group" aria-label="Histórico de edição">
            <button aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={!history.canUndo || readOnly} onClick={undo}><Undo2 size={16} /></button>
            <button aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)" disabled={!history.canRedo || readOnly} onClick={redo}><Redo2 size={16} /></button>
          </div>}
          {canWrite && <div className="planner-group" role="group" aria-label="Copiar e colar">
            <button aria-label="Duplicar seleção" title="Duplicar seleção (Ctrl+D)" disabled={readOnly || selectedCount === 0} onClick={() => duplicate()}><Copy size={16} /></button>
            <button aria-label="Colar" title="Colar (Ctrl+V)" disabled={readOnly || !clipboard.current} onClick={paste}><ClipboardPaste size={16} /></button>
          </div>}
          {canWrite && <div className="planner-group" role="group" aria-label="Organizar">
            <button aria-label="Organizar da esquerda para a direita" title="Organizar automaticamente (horizontal)" disabled={readOnly || nodes.length < 2} onClick={() => layout('LR')}><Workflow size={16} /></button>
            <button aria-label="Organizar de cima para baixo" title="Organizar automaticamente (vertical)" disabled={readOnly || nodes.length < 2} onClick={() => layout('TB')}><Network size={16} /></button>
            <button aria-label="Alinhar horizontalmente" title="Alinhar seleção horizontalmente" disabled={readOnly || selectedCount < 2} onClick={() => { commit(); setNodes(n => alignSelection(n, 'horizontal')); markDirty() }}><AlignHorizontalJustifyStart size={16} /></button>
            <button aria-label="Alinhar verticalmente" title="Alinhar seleção verticalmente" disabled={readOnly || selectedCount < 2} onClick={() => { commit(); setNodes(n => alignSelection(n, 'vertical')); markDirty() }}><AlignVerticalJustifyStart size={16} /></button>
          </div>}
          <button aria-label="Enquadrar fluxo" title="Enquadrar fluxo" onClick={() => { void fitView({ padding: 0.2, duration: 250 }) }}><Maximize2 size={16} /></button>
          <button aria-label="Minimapa" title="Minimapa" aria-pressed={minimap} onClick={() => setMinimap(v => !v)}><Map size={16} /></button>
          <button aria-label="Métricas" title="Exibir métricas ao vivo nas conexões" aria-pressed={liveDataOn} onClick={toggleLiveData}><Activity size={16} /></button>
          <button aria-label="Exportar PDF" title="Exportar PDF" disabled={exporting} onClick={handleExportPdf}><Download size={16} /></button>
          {canWrite && <button aria-label="Histórico de versões" title="Histórico de versões" onClick={handleOpenVersions}><History size={16} /></button>}
          {canWrite && <button aria-label="Compartilhar fluxo" title={shareUrl ? 'Copiar link público do fluxo' : 'Gerar link público do fluxo'} aria-pressed={!!shareUrl} onClick={handleShare}><Share2 size={16} /></button>}
          {canWrite && <button aria-label="Salvar fluxo" title="Salvar agora" disabled={!dirty || saving || readOnly} onClick={handleSave}><Save size={16} /></button>}
          {canWrite && <button aria-label="Excluir seleção" title="Excluir seleção (Delete)" disabled={readOnly || !hasSelection} onClick={deleteSelected}><Trash2 size={16} /></button>}
          {canWrite && <button className="is-danger" aria-label="Excluir fluxo" title="Excluir este fluxo" onClick={handleDelete}><Trash2 size={13} /><X size={10} /></button>}
        </div>
      </div>
      {saveError && <p className="planner-error" role="alert">{saveError}<button onClick={() => { setSaveError(''); void handleSave() }}>Tentar novamente</button></p>}
      {stagesInUse.length > 0 && <div className="planner-stages" role="group" aria-label="Etapas do fluxo">{stagesInUse.map(stage => <button key={stage} aria-pressed={!hiddenStages.has(stage)} title={hiddenStages.has(stage) ? `Expandir ${stage}` : `Recolher ${stage}`} onClick={() => setHiddenStages(current => { const next = new Set(current); if (next.has(stage)) next.delete(stage); else next.add(stage); return next })}>{stage}<span>{nodes.filter(n => n.data.stage === stage).length}</span></button>)}</div>}

      <div className="planner-canvas-row">
        {nodesSidebarOpen && !readOnly && <div className="planner-node-library"><NodesSidebar isOpen onClose={() => setNodesSidebarOpen(false)} onAdd={addAtCenter} /></div>}
        {logosOpen && !readOnly && <LogoLibrary key={flow.client_slug} slug={flow.client_slug} onAdd={addLogo} onClose={() => setLogosOpen(false)} />}
        <div ref={canvasRef} className="planner-canvas" onMouseMove={event => { pointer.current = { x: event.clientX, y: event.clientY } }} onMouseLeave={() => { pointer.current = null }}>
          <ReactFlow
            nodes={visible.nodes}
            edges={displayEdges}
            nodeTypes={EDITOR_NODE_TYPES}
            edgeTypes={PLANNER_EDGE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={() => commit()}
            onNodeClick={(_event, node) => { setEditingNodeId(node.id); setEditingEdgeId(null) }}
            onEdgeClick={(_event, edge) => { setEditingEdgeId(edge.id); setEditingNodeId(null) }}
            onPaneClick={() => { setEditingNodeId(null); setEditingEdgeId(null) }}
            onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }}
            onDrop={onDrop}
            nodesDraggable={!readOnly && mode === 'select'}
            nodesConnectable={!readOnly && mode === 'select'}
            elementsSelectable
            deleteKeyCode={null}
            selectionOnDrag={!readOnly && mode === 'select'}
            panOnDrag={mode !== 'select' || readOnly ? true : [1, 2]}
            panOnScroll
            zoomOnPinch
            minZoom={0.15}
            maxZoom={2.5}
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{ type: 'conversionEdge', markerEnd: { type: MarkerType.ArrowClosed } }}
            fitView
            fitViewOptions={{ padding: 0.08 }}
          >
            <Background gap={12} size={1} />
            <Controls position="bottom-left" showInteractive={false} />
            {minimap && <MiniMap pannable zoomable style={{ height: 90, width: 140 }} />}
            {notice && <Panel position="bottom-center"><div className="planner-notice" role="status">{notice}</div></Panel>}
          </ReactFlow>

          {editingNode && !readOnly && <NodeEditPanel key={editingNode.id} node={editingNode} onClose={() => setEditingNodeId(null)} onUpdate={handleNodeDataUpdate} />}
          {editingNode && readOnly && <aside className="planner-read-panel"><button onClick={() => setEditingNodeId(null)} aria-label="Fechar detalhes"><X size={16} /></button><h3>{String(editingNode.data.label || 'Detalhes')}</h3><p>{String(editingNode.data.notes || 'Sem anotações.')}</p>{/^https?:\/\//.test(String(editingNode.data.taskUrl ?? '')) && <a href={String(editingNode.data.taskUrl)} target="_blank" rel="noreferrer">Abrir demanda <ExternalLink size={14} /></a>}</aside>}
          {editingEdge && !readOnly && <EdgeEditPanel key={editingEdge.id} edge={editingEdge} onChange={updateEdgeProps} onReverse={reverseEdge} onDelete={removeEdge} onClose={() => setEditingEdgeId(null)} />}
        </div>
      </div>

      {versionsOpen && <VersionsModal versions={versions} loading={loadingVersions} currentVersion={flow.version} onClose={() => setVersionsOpen(false)} onRollback={handleRollback} />}
    </div>
    </PlannerChromeContext.Provider>
  )
}
