/**
 * ============================================
 * Client Planner Page — AdFlow v4 Sprint 5
 * ============================================
 * Módulo "Planner" — mapa visual de estratégia por cliente.
 *
 * 3 estados:
 *   1. List view — flows salvos + botão "Novo Flow"
 *   2. Template picker — quando clica "Novo" mostra 5 templates
 *   3. Editor — ReactFlow canvas com save/share
 *
 * Rota: /c/:clientSlug/planner
 * ============================================
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import type { Node, Edge, NodeChange, EdgeChange, Connection, Viewport } from 'reactflow'
import 'reactflow/dist/style.css'

import { PageHeader, EmptyState } from '@/components/canonical'
import { exportFlowToPdf } from '@/lib/exportFlowPdf'
import { enrichNodesWithLiveData } from '@/lib/enrichFlowWithLiveData'
import { LiveMetricsBadge } from '@/components/canonical/LiveMetricsBadge'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import { getClientPerformance } from '@/services/adapters/performanceAdapter'
import {
  listClientFlows,
  createFlow,
  updateFlow,
  deleteFlow,
  enableShare,
  getFlowById,
  listFlowVersions,
  rollbackToVersion,
  type ClientFlow,
  type FlowVersion,
} from '@/services/adapters/clientFlowsAdapter'
import {
  PLANNER_TEMPLATES,
  filterTemplates,
  type PlannerTemplate,
  type TemplateFilter,
} from '@/data/plannerTemplates'

// Reuse the same node types as the legacy FlowEditorPage
import TrafficSourceNode from '@/components/Nodes/TrafficSourceNode'
import CampaignNode from '@/components/Nodes/CampaignNode'
import AdSetNode from '@/components/Nodes/AdSetNode'
import AdNode from '@/components/Nodes/AdNode'
import AudienceNode from '@/components/Nodes/AudienceNode'
import ResultNode from '@/components/Nodes/ResultNode'
import LandingPageNode from '@/components/Nodes/LandingPageNode'
import PostitNode from '@/components/Nodes/PostitNode'
import AdvancedTextNode from '@/components/Nodes/AdvancedTextNode'
// Restored visual/circular nodes from legacy
import BrandNode from '@/components/Nodes/BrandNode'
import VisualCampaignNode from '@/components/Nodes/VisualCampaignNode'
import VisualAudienceNode from '@/components/Nodes/VisualAudienceNode'
import VisualCreativeNode from '@/components/Nodes/VisualCreativeNode'
import ChannelNode from '@/components/Nodes/ChannelNode'
import IconNode from '@/components/Nodes/IconNode'
import {
  SourceNode as FunnelSourceNode,
  PageNode as FunnelPageNode,
  ActionNode as FunnelActionNode,
} from '@/components/Nodes/Funnelytics'
import GoalNode from '@/components/Nodes/GoalNode'
import LeadJourneyNode from '@/components/Nodes/LeadJourneyNode'
import NodesSidebar from '@/components/Planner/NodesSidebar'
import NodeEditPanel from '@/components/Planner/NodeEditPanel'

/**
 * Wraps any ReactFlow node component so that when `data.liveMetrics`
 * is present, a floating LiveMetricsBadge is rendered above it.
 * The wrapped component receives the original props untouched.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withLiveOverlay(Component: React.ComponentType<any>): React.ComponentType<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Wrapped = (props: any) => {
    const liveMetrics = (
      props?.data as
        | { liveMetrics?: import('@/lib/enrichFlowWithLiveData').LiveMetrics }
        | undefined
    )?.liveMetrics
    return (
      <div className="relative">
        {liveMetrics && <LiveMetricsBadge metrics={liveMetrics} />}
        <Component {...props} />
      </div>
    )
  }
  Wrapped.displayName = `WithLiveOverlay(${Component.displayName || Component.name || 'Node'})`
  return Wrapped
}

const nodeTypes = {
  // Core ads nodes (retangulares com métricas)
  trafficSource: withLiveOverlay(TrafficSourceNode),
  traffic_source: withLiveOverlay(TrafficSourceNode),
  campaign: withLiveOverlay(CampaignNode),
  adSet: withLiveOverlay(AdSetNode),
  ad_set: withLiveOverlay(AdSetNode),
  ad: withLiveOverlay(AdNode),
  audience: withLiveOverlay(AudienceNode),
  result: withLiveOverlay(ResultNode),
  landingPage: withLiveOverlay(LandingPageNode),

  // Visual / circular nodes (restored from legacy)
  brand: BrandNode,
  visualCampaign: VisualCampaignNode,
  visualAudience: VisualAudienceNode,
  visualCreative: VisualCreativeNode,
  channel: ChannelNode,
  icon: IconNode,

  // Funnelytics nodes
  funnelSource: withLiveOverlay(FunnelSourceNode),
  funnelPage: withLiveOverlay(FunnelPageNode),
  funnelAction: withLiveOverlay(FunnelActionNode),

  // Annotation nodes
  postit: PostitNode,
  advancedText: AdvancedTextNode,

  // Goal tracking
  goal: GoalNode,
  leadJourney: LeadJourneyNode,
}

type ViewState =
  | { mode: 'list' }
  | { mode: 'picker' }
  | { mode: 'editor'; flowId: string }

export default function ClientPlannerPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const client = useMemo(
    () => (clientSlug ? getClientBySlug(clientSlug) : undefined),
    [clientSlug],
  )

  const [view, setView] = useState<ViewState>({ mode: 'list' })
  const [flows, setFlows] = useState<ClientFlow[]>([])
  const [loading, setLoading] = useState(true)

  const loadFlows = useCallback(async () => {
    if (!clientSlug) return
    const data = await listClientFlows(clientSlug)
    setFlows(data)
    setLoading(false)
  }, [clientSlug])

  // Load flows on mount / when client changes. Classic fetch-and-set;
  // proper fix is @tanstack/react-query (already a project dep) but
  // migrating this component is out of scope for the lint cleanup pass.
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    loadFlows().catch((err) => {
      if (!cancelled) console.error('[ClientPlannerPage] loadFlows failed:', err)
    })
    return () => {
      cancelled = true
    }
  }, [loadFlows])

  if (!client) return <Navigate to="/_v4/operations" replace />

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <PageHeader
        title="Planner"
        subtitle={`${client.name} · ${flows.length} ${flows.length === 1 ? 'flow' : 'flows'}`}
        breadcrumbs={[
          { label: 'Operações', href: '/_v4/operations' },
          { label: client.name, href: `/c/${client.slug}/overview` },
          { label: 'Planner' },
        ]}
        leading={<ClientAvatar gradient={client.avatar_gradient} name={client.short_name} />}
        actions={
          view.mode === 'list' && flows.length > 0 ? (
            <button
              onClick={() => setView({ mode: 'picker' })}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Novo Flow
            </button>
          ) : view.mode !== 'list' ? (
            <button
              onClick={() => setView({ mode: 'list' })}
              className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              ← Voltar
            </button>
          ) : null
        }
      />

      <main className="max-w-layout mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {view.mode === 'list' && (
          <FlowsList
            flows={flows}
            loading={loading}
            onCreateNew={() => setView({ mode: 'picker' })}
            onOpen={(id) => setView({ mode: 'editor', flowId: id })}
            onDelete={async (id) => {
              await deleteFlow(id)
              loadFlows()
            }}
          />
        )}

        {view.mode === 'picker' && clientSlug && (
          <TemplatePicker
            onBlankFlow={async () => {
              const flow = await createFlow({
                client_slug: clientSlug,
                name: 'Novo Flow em branco',
                nodes: [],
                edges: [],
              })
              if (flow) setView({ mode: 'editor', flowId: flow.id })
            }}
            onTemplateSelected={async (template) => {
              const flow = await createFlow({
                client_slug: clientSlug,
                name: `${template.name} — ${client.short_name}`,
                description: template.description,
                template_id: template.id,
                nodes: JSON.parse(JSON.stringify(template.nodes)),
                edges: JSON.parse(JSON.stringify(template.edges)),
              })
              if (flow) setView({ mode: 'editor', flowId: flow.id })
            }}
          />
        )}

        {view.mode === 'editor' && (
          <ReactFlowProvider>
            <FlowEditor
              flowId={view.flowId}
              onDeleted={() => {
                setView({ mode: 'list' })
                loadFlows()
              }}
            />
          </ReactFlowProvider>
        )}
      </main>
    </div>
  )
}

// =============================================================
// FLOWS LIST
// =============================================================

function FlowsList({
  flows,
  loading,
  onCreateNew,
  onOpen,
  onDelete,
}: {
  flows: ClientFlow[]
  loading: boolean
  onCreateNew: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (flows.length === 0) {
    return (
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl">
        <EmptyState
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          }
          title="Nenhum flow criado ainda"
          description="Comece escolhendo um template pré-pronto ou um canvas em branco."
          action={
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Criar primeiro flow
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {flows.map((flow) => (
        <FlowCard key={flow.id} flow={flow} onOpen={() => onOpen(flow.id)} onDelete={() => onDelete(flow.id)} />
      ))}
    </div>
  )
}

function FlowCard({
  flow,
  onOpen,
  onDelete,
}: {
  flow: ClientFlow
  onOpen: () => void
  onDelete: () => void
}) {
  const updated = new Date(flow.updated_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen() }}
      className="group cursor-pointer bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-brand-300 hover:shadow-md transition-all duration-normal"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-neutral-900 truncate">{flow.name}</h3>
          {flow.description && (
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{flow.description}</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Excluir "${flow.name}"?`)) onDelete()
          }}
          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-error-600 transition-all p-1 -mr-1"
          aria-label="Excluir flow"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3 text-2xs text-neutral-500 mb-4">
        <span className="inline-flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <circle cx="5" cy="5" r="2" />
            <circle cx="19" cy="19" r="2" />
          </svg>
          {flow.nodes.length} nós · {flow.edges.length} conexões
        </span>
        <span>v{flow.version}</span>
        {flow.share_enabled && (
          <span className="inline-flex items-center gap-1 text-success-700">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10 13a5 5 0 007 0l4-4a5 5 0 00-7-7L12 4" />
              <path d="M14 11a5 5 0 00-7 0l-4 4a5 5 0 007 7l1-1" />
            </svg>
            Compartilhado
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-2xs text-neutral-400">{updated}</span>
        <button
          onClick={onOpen}
          className="text-xs font-medium text-brand-700 hover:text-brand-900 inline-flex items-center gap-1"
        >
          Abrir
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// =============================================================
// TEMPLATE PICKER
// =============================================================

function TemplatePicker({
  onBlankFlow,
  onTemplateSelected,
}: {
  onBlankFlow: () => void
  onTemplateSelected: (t: PlannerTemplate) => void
}) {
  const [filter, setFilter] = useState<TemplateFilter>({ category: 'all', vertical: 'all', query: '' })

  const filtered = useMemo(() => filterTemplates(filter), [filter])

  return (
    <div className="space-y-6">
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar template..."
            value={filter.query || ''}
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-[var(--surface-card)] border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
          />
        </div>
        <button
          onClick={onBlankFlow}
          className="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Canvas em branco
        </button>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'briefing', 'funnel', 'launch', 'remarketing'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter((f) => ({ ...f, category: cat }))}
            className={`
              px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-fast flex-shrink-0
              ${filter.category === cat
                ? 'bg-neutral-900 border-neutral-900 text-white'
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }
            `}
          >
            {cat === 'all' ? 'Todos' : cat === 'briefing' ? 'Briefing' : cat === 'funnel' ? 'Funis' : cat === 'launch' ? 'Lançamentos' : 'Remarketing'}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl">
          <EmptyState
            compact
            title="Nenhum template encontrado"
            description="Tente ajustar o filtro ou a busca."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} onSelect={() => onTemplateSelected(t)} />
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: PlannerTemplate
  onSelect: () => void
}) {
  const colors = {
    violet: 'from-violet-50 to-violet-100 border-violet-200 hover:border-violet-400',
    blue: 'from-blue-50 to-blue-100 border-[var(--color-brand-200)] hover:border-blue-400',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 hover:border-emerald-400',
    amber: 'from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400',
    pink: 'from-pink-50 to-pink-100 border-pink-200 hover:border-pink-400',
    slate: 'from-slate-50 to-slate-100 border-slate-200 hover:border-slate-400',
  }[template.color]

  return (
    <button
      onClick={onSelect}
      className={`
        text-left p-5 rounded-xl border bg-gradient-to-br
        ${colors}
        transition-all duration-normal
        hover:shadow-lg hover:-translate-y-0.5
        group
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-4xl">{template.icon}</div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-2xs uppercase tracking-wider text-neutral-600 font-semibold bg-white/60 px-2 py-0.5 rounded-full">
            {template.category}
          </span>
          {template.vertical !== 'any' && (
            <span className="text-2xs text-neutral-500">{template.vertical}</span>
          )}
        </div>
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">{template.name}</h3>
      <p className="text-xs text-neutral-600 leading-relaxed mb-4 line-clamp-3">
        {template.description}
      </p>
      <div className="flex items-center gap-3 text-2xs text-neutral-500">
        <span>{template.node_count} nós</span>
        <span>·</span>
        <span>{template.edge_count} conexões</span>
        <span>·</span>
        <span>~{template.estimated_setup_minutes} min</span>
      </div>
    </button>
  )
}

// =============================================================
// FLOW EDITOR (simplified — no legacy coupling)
// =============================================================

function FlowEditor({
  flowId,
  onDeleted,
}: {
  flowId: string
  onDeleted: () => void
}) {
  const [flow, setFlow] = useState<ClientFlow | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [nodesSidebarOpen, setNodesSidebarOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<Node | null>(null)
  const [versions, setVersions] = useState<FlowVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [liveDataOn, setLiveDataOn] = useState(false)
  const { fitView, getViewport } = useReactFlow()

  // When live data is toggled on, fetch the client's performance
  // snapshot and enrich nodes with real metrics.
  const displayNodes = useMemo(() => {
    if (!liveDataOn || !flow) return nodes
    const perf = getClientPerformance(flow.client_slug)
    return enrichNodesWithLiveData(nodes, perf)
  }, [nodes, liveDataOn, flow])

  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await getFlowById(flowId)
      if (cancelled) return
      if (data) {
        setFlow(data)
        setNodes(data.nodes || [])
        setEdges(data.edges || [])
        if (data.share_token && data.share_enabled) {
          setShareUrl(`${window.location.origin}/p/${data.share_token}`)
        }
      }
      setLoading(false)
      // Fit after load
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 150)
    })()
    return () => {
      cancelled = true
    }
  }, [flowId, fitView])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
      setDirty(true)
    },
    [],
  )

  // Delete selected nodes/edges with Backspace or Delete key
  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => eds.filter((e) => !e.selected))
    setDirty(true)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // Don't delete if user is typing in an input/textarea
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        deleteSelected()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [deleteSelected])

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds))
      setDirty(true)
    },
    [],
  )

  const onConnect = useCallback(
    (conn: Connection) => {
      setEdges((eds) => addEdge({ ...conn, type: 'smoothstep' }, eds))
      setDirty(true)
    },
    [],
  )

  // --- Node click → open edit panel ---
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, clickedNode: Node) => {
      setEditingNode(clickedNode)
    },
    [],
  )

  const handleNodeDataUpdate = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n,
        ),
      )
      setDirty(true)
      setEditingNode(null)
    },
    [],
  )

  // --- Drag & Drop from NodesSidebar ---
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const reactFlowInstance = useReactFlow()

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const rawType = e.dataTransfer.getData('application/reactflow')
      if (!rawType) return

      // Parse optional size from drag data
      let width = 220
      let height = 120
      try {
        const sizeData = e.dataTransfer.getData('application/nodesize')
        if (sizeData) {
          const parsed = JSON.parse(sizeData)
          width = parsed.width || width
          height = parsed.height || height
        }
      } catch { /* use defaults */ }

      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      // Brand nodes use format "brand:whatsapp" — split into type + data.brand
      let nodeType = rawType
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let nodeData: Record<string, any> = {
        label: rawType.replace(/([A-Z])/g, ' $1').trim(),
      }

      if (rawType.startsWith('brand:')) {
        const brandKey = rawType.split(':')[1]
        nodeType = 'brand'
        nodeData = {
          brand: brandKey,
          label: brandKey.charAt(0).toUpperCase() + brandKey.slice(1),
        }
      }

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: nodeData,
        style: { width, height },
      }

      setNodes((nds) => [...nds, newNode])
      setDirty(true)
    },
    [reactFlowInstance],
  )

  const handleSave = useCallback(async () => {
    if (!flow) return
    setSaving(true)
    try {
      const viewport: Viewport = getViewport()
      const updated = await updateFlow({
        id: flow.id,
        nodes,
        edges,
        viewport,
      })
      if (updated) {
        setFlow(updated)
        setDirty(false)
      } else {
        console.error('[FlowEditor] Save returned null — RLS may be blocking the update')
      }
    } catch (err) {
      console.error('[FlowEditor] Save threw:', err)
    } finally {
      setSaving(false)
    }
  }, [flow, nodes, edges, getViewport])

  // Auto-save: persist positions 2s after the user stops dragging
  useEffect(() => {
    if (!dirty || !flow) return
    const timer = setTimeout(() => {
      handleSave()
    }, 2000)
    return () => clearTimeout(timer)
  }, [dirty, flow, handleSave])

  const handleShare = useCallback(async () => {
    if (!flow) return
    const token = await enableShare(flow.id)
    if (token) {
      const url = `${window.location.origin}/p/${token}`
      setShareUrl(url)
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        // Clipboard might not be available; user can copy manually from the input
      }
    }
  }, [flow])

  const handleDelete = useCallback(async () => {
    if (!flow) return
    if (!confirm(`Excluir definitivamente "${flow.name}"?`)) return
    await deleteFlow(flow.id)
    onDeleted()
  }, [flow, onDeleted])

  const handleOpenVersions = useCallback(async () => {
    if (!flow) return
    setVersionsOpen(true)
    setLoadingVersions(true)
    const list = await listFlowVersions(flow.id)
    setVersions(list)
    setLoadingVersions(false)
  }, [flow])

  const handleRollback = useCallback(
    async (versionId: string, versionNumber: number) => {
      if (!flow) return
      if (
        !confirm(
          `Restaurar versão ${versionNumber}? A versão atual (v${flow.version}) será salva no histórico antes.`,
        )
      )
        return
      const restored = await rollbackToVersion(flow.id, versionId)
      if (restored) {
        setFlow(restored)
        setNodes(restored.nodes || [])
        setEdges(restored.edges || [])
        setDirty(false)
        setVersionsOpen(false)
        setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 150)
      }
    },
    [flow, fitView],
  )

  const [exporting, setExporting] = useState(false)
  const handleExportPdf = useCallback(async () => {
    if (!flow) return
    setExporting(true)
    try {
      // Ensure viewport shows everything before capture
      fitView({ padding: 0.2, duration: 0 })
      await new Promise((r) => setTimeout(r, 300))
      await exportFlowToPdf({
        flowName: flow.name,
        clientName: flow.client_slug,
        description: flow.description || undefined,
        version: flow.version,
        nodes,
      })
    } catch (err) {
      console.error('[exportPdf] failed', err)
      alert('Falha ao exportar PDF. Veja o console.')
    } finally {
      setExporting(false)
    }
  }, [flow, nodes, fitView])

  if (loading) {
    return (
      <div className="h-[calc(100vh-180px)] flex items-center justify-center bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl">
        <EmptyState
          title="Flow não encontrado"
          description="Esse flow foi excluído ou não existe mais."
          action={
            <button
              onClick={onDeleted}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium"
            >
              Voltar
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 p-3 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-neutral-900 truncate">{flow.name}</h2>
          <span className="text-2xs text-neutral-500 flex-shrink-0">v{flow.version}</span>
          {dirty && (
            <span className="text-2xs text-warning-700 bg-warning-50 px-2 py-0.5 rounded-full border border-warning-100 flex-shrink-0">
              não salvo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setNodesSidebarOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
              nodesSidebarOpen
                ? 'bg-[var(--color-brand-50)] border-[var(--color-brand-200)] text-[var(--color-brand-700)]'
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
            title="Painel de nodes"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Nodes
          </button>
          <button
            onClick={() => setLiveDataOn((v) => !v)}
            className={`
              hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border
              ${
                liveDataOn
                  ? 'bg-success-50 border-success-200 text-success-700 hover:bg-success-100'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }
            `}
            title={liveDataOn ? 'Desligar métricas ao vivo' : 'Ligar métricas ao vivo (Meta + Google)'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                liveDataOn ? 'bg-success-500 animate-pulse' : 'bg-neutral-400'
              }`}
            />
            Live Data
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            title="Exportar como PDF"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? 'Gerando...' : 'PDF'}
          </button>
          <button
            onClick={handleOpenVersions}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            title="Ver histórico de versões"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Histórico
          </button>
          {shareUrl ? (
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl).catch(() => null)
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-success-700 bg-success-50 border border-success-100 rounded-lg hover:bg-success-100 transition-colors"
              title={shareUrl}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007 0l4-4a5 5 0 00-7-7L12 4" />
                <path d="M14 11a5 5 0 00-7 0l-4 4a5 5 0 007 7l1-1" />
              </svg>
              Link copiado
            </button>
          ) : (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Compartilhar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${dirty && !saving
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }
            `}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => navigate(`/c/${flow.client_slug}/overview`)}
            className="text-xs text-neutral-500 hover:text-neutral-900 px-2 py-1"
          >
            ✕
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-neutral-400 hover:text-error-600 px-2 py-1"
            title="Excluir flow"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas + sidebar layout */}
      <div className="flex gap-3 h-[calc(100vh-240px)]">
        {/* Nodes sidebar — OUTSIDE the flow, left side */}
        {nodesSidebarOpen && (
          <div className="w-64 flex-shrink-0">
            <NodesSidebar
              isOpen={nodesSidebarOpen}
              onClose={() => setNodesSidebarOpen(false)}
            />
          </div>
        )}

        <div className="relative flex-1 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background gap={16} size={1} />
          <Controls position="bottom-left" showInteractive={false} />
          <MiniMap pannable zoomable style={{ height: 100 }} />
        </ReactFlow>

        {/* Node edit panel — slides in from right on node click */}
        {editingNode && (
          <NodeEditPanel
            node={editingNode}
            onClose={() => setEditingNode(null)}
            onUpdate={handleNodeDataUpdate}
          />
        )}
        </div>
      </div>

      {/* Version history modal */}
      {versionsOpen && (
        <VersionsModal
          versions={versions}
          loading={loadingVersions}
          currentVersion={flow.version}
          onClose={() => setVersionsOpen(false)}
          onRollback={handleRollback}
        />
      )}
    </div>
  )
}

// =============================================================
// VERSIONS MODAL
// =============================================================

function VersionsModal({
  versions,
  loading,
  currentVersion,
  onClose,
  onRollback,
}: {
  versions: FlowVersion[]
  loading: boolean
  currentVersion: number
  onClose: () => void
  onRollback: (versionId: string, versionNumber: number) => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Histórico de versões</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Versão atual: <strong>v{currentVersion}</strong> · Clique em qualquer snapshot pra restaurar
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 p-1"
            aria-label="Fechar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
            </div>
          ) : versions.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              Nenhuma versão anterior salva.
              <br />
              <span className="text-2xs text-neutral-400">
                O histórico começa a gravar a partir da próxima edição.
              </span>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {versions.map((v) => {
                const date = new Date(v.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <button
                    key={v.id}
                    onClick={() => onRollback(v.id, v.version)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-3 text-left hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-2xs font-semibold border border-brand-100">
                          v{v.version}
                        </span>
                        <span className="text-2xs uppercase tracking-wider text-neutral-400 font-medium">
                          {v.snapshot_reason}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-neutral-900 truncate">{v.name || 'Sem nome'}</p>
                      <p className="text-2xs text-neutral-500 mt-0.5">
                        {date} · {v.nodes.length} nós · {v.edges.length} conexões
                      </p>
                    </div>
                    <span className="text-xs font-medium text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      Restaurar →
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================
// SMALL PIECES
// =============================================================

function ClientAvatar({ gradient, name }: { gradient: string; name: string }) {
  return (
    <div
      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0`}
      aria-hidden="true"
    >
      {name}
    </div>
  )
}

// Prevent unused-warning for template registry
void PLANNER_TEMPLATES
