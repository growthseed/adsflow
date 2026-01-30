import { useCallback, useState, useEffect, useRef } from 'react'
import type { DragEvent } from 'react'
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  MiniMap,
  Panel,
} from 'reactflow'
import type { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Save, Download, AlertCircle, Home,
  Layers, Hand,
  MousePointer,
  School
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'

// Templates
import { createIsaacNewtonTemplate } from '@/components/IsaacNewtonTemplate'

// Componentes
import TrafficSourceNode from '@/components/Nodes/TrafficSourceNode'
import CampaignNode from '@/components/Nodes/CampaignNode'
import AdSetNode from '@/components/Nodes/AdSetNode'
import AdNode from '@/components/Nodes/AdNode'
import AudienceNode from '@/components/Nodes/AudienceNode'
import ResultNode from '@/components/Nodes/ResultNode'
import IconNode from '@/components/Nodes/IconNode'
import BrandNode from '@/components/Nodes/BrandNode'
import VisualCampaignNode from '@/components/Nodes/VisualCampaignNode'
import VisualAudienceNode from '@/components/Nodes/VisualAudienceNode'
import VisualCreativeNode from '@/components/Nodes/VisualCreativeNode'
import ShapeNode from '@/components/Nodes/ShapeNode'
import TextboxNode from '@/components/Nodes/TextboxNode'
import PostitNode from '@/components/Nodes/PostitNode'
import LandingPageNode from '@/components/Nodes/LandingPageNode'
import AdvancedTextNode from '@/components/Nodes/AdvancedTextNode'
import ChannelNode from '@/components/Nodes/ChannelNode'
import NodesSidebar from '@/components/NodesSidebar'

// Funnelytics Nodes (NEW!)
import {
  SourceNode as FunnelSourceNode,
  PageNode as FunnelPageNode,
  ActionNode as FunnelActionNode,
  UTMTrackerNode,
  FunnelNode as FunnelVisualizationNode,
} from '@/components/Nodes/Funnelytics'

// Custom Edges
import { ConversionEdge } from '@/components/Edges'

// Formulários
import TrafficSourceForm from '@/components/Forms/TrafficSourceForm'
import CampaignForm from '@/components/Forms/CampaignForm'
import NodeEditForm from '@/components/Forms/NodeEditForm'

// Hooks
import { useFlows } from '@/hooks/useFlows'

// Node types
const nodeTypes = {
  trafficSource: TrafficSourceNode,
  campaign: CampaignNode,
  adSet: AdSetNode,
  ad: AdNode,
  audience: AudienceNode,
  result: ResultNode,
  icon: IconNode,
  brand: BrandNode,
  channel: ChannelNode,
  visualCampaign: VisualCampaignNode,
  visualAudience: VisualAudienceNode,
  visualCreative: VisualCreativeNode,
  shape: ShapeNode,
  textbox: TextboxNode,
  postit: PostitNode,
  landingPage: LandingPageNode,
  advancedText: AdvancedTextNode,
  // Aliases para compatibilidade com flows antigos (snake_case)
  traffic_source: TrafficSourceNode,
  ad_set: AdSetNode,
  // Funnelytics Nodes (NEW!)
  funnelSource: FunnelSourceNode,
  funnelPage: FunnelPageNode,
  funnelAction: FunnelActionNode,
  utmTracker: UTMTrackerNode,
  funnelVisualization: FunnelVisualizationNode,
}

// Edge types
const edgeTypes = {
  conversion: ConversionEdge,
}

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  animated: true,
  style: { stroke: '#94a3b8', strokeWidth: 2 }
}

// Helper function para formatar tempo
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'agora'
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)}min`
  return `há ${Math.floor(seconds / 3600)}h`
}

function FlowEditor() {
  const { id: flowId } = useParams()
  const navigate = useNavigate()
  const { flows, createNewFlow, updateExistingFlow } = useFlows()

  // Helper function to get flow by id
  const getFlow = async (id: string) => {
    return flows.find(f => f.id === id) || null
  }
  
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [clipboard, setClipboard] = useState<{nodes: Node[], edges: Edge[]} | null>(null)
  const [editingNode, setEditingNode] = useState<{ id: string; type: string; data: any } | null>(null)
  const [flowName, setFlowName] = useState('Novo Flow')
  const [flowDescription, setFlowDescription] = useState('')
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(flowId || null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [panOnDrag, setPanOnDrag] = useState(false)
  
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (flowId) {
      loadFlow(flowId)
    }
  }, [flowId])

  const loadFlow = async (id: string) => {
    console.log('📂 Carregando flow:', id)
    const flow = await getFlow(id)
    if (flow) {
      console.log('✅ Flow carregado:', { nodes: flow.nodes.length, edges: flow.edges.length })
      setNodes(flow.nodes.map((node: Node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: () => handleEditNode(node.id, node.type || '', node.data)
        }
      })))
      setEdges(flow.edges)
      setFlowName(flow.name)
      setFlowDescription(flow.description || '')
      setCurrentFlowId(flow.id)
      setLastSaved(new Date(flow.updated_at))
    }
  }

  // ✅ CARREGAR TEMPLATE ISAAC NEWTON
  const loadIsaacNewtonTemplate = () => {
    const template = createIsaacNewtonTemplate(handleEditNode)
    setNodes(template.nodes)
    setEdges(template.edges)
    setFlowName(template.name)
    setFlowDescription(template.description)
    setCurrentFlowId(null) // Novo flow
    console.log('🏫 Template Isaac Newton carregado com', template.nodes.length, 'nós')
  }

  // Auto-save
  useEffect(() => {
    if (!currentFlowId || (nodes.length === 0 && edges.length === 0)) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave()
    }, 3000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [nodes, edges, flowName, flowDescription])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveError(null)
      
      console.log('💾 Iniciando salvamento...')
      console.log('📊 Dados:', {
        nodes: nodes.length,
        edges: edges.length,
        flowId: currentFlowId
      })

      const flowData = {
        name: flowName,
        description: flowDescription,
        nodes,
        edges,
      }

      let savedFlow
      if (currentFlowId) {
        savedFlow = await updateExistingFlow(currentFlowId, flowData)
        console.log('✅ Flow atualizado:', currentFlowId)
      } else {
        savedFlow = await createNewFlow(flowData)
        if (savedFlow) {
          setCurrentFlowId(savedFlow.id)
          navigate(`/editor/${savedFlow.id}`, { replace: true })
          console.log('✅ Flow criado:', savedFlow.id)
        }
      }

      setLastSaved(new Date())
      console.log('💾 Salvamento concluído às', new Date().toLocaleTimeString())
      
      return savedFlow
    } catch (error) {
      console.error('❌ Erro ao salvar:', error)
      setSaveError(error instanceof Error ? error.message : 'Erro desconhecido')
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // 🆕 DUPLICAR NÓS (Ctrl+D)
  const handleDuplicate = useCallback(() => {
    if (selectedNodes.length === 0) return

    const nodesToDuplicate = nodes.filter(n => selectedNodes.includes(n.id))
    const timestamp = Date.now()
    
    const newNodes = nodesToDuplicate.map(node => ({
      ...node,
      id: `${node.id}-copy-${timestamp}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      selected: true,
      data: {
        ...node.data,
        onEdit: () => handleEditNode(`${node.id}-copy-${timestamp}`, node.type || '', node.data)
      }
    }))

    setNodes(prev => [...prev.map(n => ({ ...n, selected: false })), ...newNodes])
    setSelectedNodes(newNodes.map(n => n.id))
    
    console.log(`✅ ${newNodes.length} nó(s) duplicado(s)`)
  }, [nodes, selectedNodes])

  // 🆕 COPIAR NÓS (Ctrl+C)
  const handleCopy = useCallback(() => {
    if (selectedNodes.length === 0) return

    const nodesToCopy = nodes.filter(n => selectedNodes.includes(n.id))
    const connectedEdges = edges.filter(e => 
      selectedNodes.includes(e.source) && selectedNodes.includes(e.target)
    )

    setClipboard({
      nodes: nodesToCopy,
      edges: connectedEdges
    })
    
    console.log(`📋 ${nodesToCopy.length} nó(s) copiado(s), ${connectedEdges.length} conexão(ões)`)
  }, [nodes, edges, selectedNodes])

  // 🆕 COLAR NÓS (Ctrl+V)
  const handlePaste = useCallback(() => {
    if (!clipboard) return

    const pasteOffset = 100
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    
    const newNodes = clipboard.nodes.map(node => {
      const newId = `${node.id}-paste-${timestamp}-${randomId}`
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + pasteOffset,
          y: node.position.y + pasteOffset,
        },
        selected: true,
        data: {
          ...node.data,
          onEdit: () => handleEditNode(newId, node.type || '', node.data)
        }
      }
    })

    // Mapear IDs antigos para novos
    const idMap = new Map(
      clipboard.nodes.map((oldNode, idx) => [oldNode.id, newNodes[idx].id])
    )

    // Recriar edges com novos IDs
    const newEdges = clipboard.edges.map(edge => ({
      ...edge,
      id: `${edge.id}-paste-${timestamp}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
    }))

    setNodes(prev => [...prev.map(n => ({ ...n, selected: false })), ...newNodes])
    setEdges(prev => [...prev, ...newEdges])
    setSelectedNodes(newNodes.map(n => n.id))
    
    console.log(`✅ ${newNodes.length} nó(s) colado(s), ${newEdges.length} conexão(ões)`)
  }, [clipboard])

  // 🆕 ATALHOS DE TECLADO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver em input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // Delete - Remover nós
      if (e.key === 'Delete' && selectedNodes.length > 0) {
        setNodes((nds) => nds.filter((node) => !selectedNodes.includes(node.id)))
        setEdges((eds) =>
          eds.filter(
            (edge) =>
              !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target)
          )
        )
        setSelectedNodes([])
        console.log('🗑️ Nós deletados')
      }

      // Ctrl/Cmd+D - Duplicar
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        handleDuplicate()
      }

      // Ctrl/Cmd+C - Copiar
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNodes.length > 0) {
        e.preventDefault()
        handleCopy()
      }

      // Ctrl/Cmd+V - Colar
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault()
        handlePaste()
      }

      // Ctrl/Cmd+S - Salvar manualmente
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }

      // V - Modo Seleção
      if (e.key === 'v' || e.key === 'V') {
        setPanOnDrag(false)
      }
      
      // H - Modo Mão
      if (e.key === 'h' || e.key === 'H') {
        setPanOnDrag(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodes, clipboard, handleDuplicate, handleCopy, handlePaste])

  const handleEditNode = useCallback((nodeId: string, nodeType: string, nodeData: any) => {
    setEditingNode({ id: nodeId, type: nodeType, data: nodeData })
  }, [])

  const handleSaveNode = useCallback((updatedData: any) => {
    if (!editingNode) return

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === editingNode.id) {
          return {
            ...node,
            data: {
              ...updatedData,
              onEdit: () => handleEditNode(node.id, node.type || '', node.data)
            }
          }
        }
        return node
      })
    )
    setEditingNode(null)
  }, [editingNode, handleEditNode])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
      
      changes.forEach((change) => {
        if (change.type === 'select' && change.selected) {
          setSelectedNodes((prev) => [...new Set([...prev, change.id])])
        } else if (change.type === 'select' && !change.selected) {
          setSelectedNodes((prev) => prev.filter((id) => id !== change.id))
        }
      })
    },
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({
      ...connection,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 }
    }, eds)),
    []
  )

  const { screenToFlowPosition } = useReactFlow()

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      const dataTransfer = event.dataTransfer.getData('application/reactflow')
      
      if (!dataTransfer) return

      let nodeConfig: { type: string; data: any }
      
      try {
        nodeConfig = JSON.parse(dataTransfer)
      } catch (e) {
        console.error('Error parsing drop data:', e)
        return
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNodeId = `${nodeConfig.type}_${Date.now()}`

      const newNode: Node = {
        id: newNodeId,
        type: nodeConfig.type,
        position,
        data: {
          ...nodeConfig.data,
          onEdit: () => handleEditNode(newNodeId, nodeConfig.type, nodeConfig.data)
        },
      }

      setNodes((nds) => nds.concat(newNode))
      console.log('➕ Nó adicionado:', nodeConfig.type)
    },
    [screenToFlowPosition, handleEditNode]
  )

  const handleExportPNG = async () => {
    alert('Exportação PNG em desenvolvimento')
  }

  // ✅ TEMPLATE DVD NATAL (disponível para uso futuro)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _loadDVDNatalTemplate = () => {
    const templateNodes: Node[] = [
      {
        id: 'meta-ads',
        type: 'brand',
        position: { x: 50, y: 300 },
        data: { brand: 'meta', label: 'Meta Ads', isActive: true, onEdit: () => handleEditNode('meta-ads', 'brand', { brand: 'meta' }) }
      },
      {
        id: 'campaign-dvd',
        type: 'campaign',
        position: { x: 350, y: 250 },
        data: {
          label: 'DVD Natal 2024',
          objective: 'Visualizações de Vídeo',
          status: 'active',
          budgetType: 'daily',
          budget: 1500,
          spent: 1245.50,
          impressions: 125000,
          reach: 87000,
          clicks: 12450,
          conversions: 45230,
          costPerResult: 0.028,
          isActive: true,
          onEdit: () => handleEditNode('campaign-dvd', 'campaign', {})
        }
      },
      {
        id: 'audience-gospel',
        type: 'visualAudience',
        position: { x: 750, y: 300 },
        data: { onEdit: () => handleEditNode('audience-gospel', 'visualAudience', {}) }
      },
      { id: 'creative-img-1', type: 'visualCreative', position: { x: 1000, y: 50 }, data: { format: 'image', onEdit: () => {} } },
      { id: 'creative-img-2', type: 'visualCreative', position: { x: 1000, y: 150 }, data: { format: 'image', onEdit: () => {} } },
      { id: 'creative-img-3', type: 'visualCreative', position: { x: 1000, y: 250 }, data: { format: 'image', onEdit: () => {} } },
      { id: 'creative-img-4', type: 'visualCreative', position: { x: 1000, y: 350 }, data: { format: 'image', onEdit: () => {} } },
      { id: 'creative-img-5', type: 'visualCreative', position: { x: 1000, y: 450 }, data: { format: 'image', onEdit: () => {} } },
      { id: 'creative-vid-1', type: 'visualCreative', position: { x: 1150, y: 50 }, data: { format: 'video', onEdit: () => {} } },
      { id: 'creative-vid-2', type: 'visualCreative', position: { x: 1150, y: 150 }, data: { format: 'video', onEdit: () => {} } },
      { id: 'creative-vid-3', type: 'visualCreative', position: { x: 1150, y: 250 }, data: { format: 'video', onEdit: () => {} } },
      { id: 'creative-vid-4', type: 'visualCreative', position: { x: 1150, y: 350 }, data: { format: 'video', onEdit: () => {} } },
      { id: 'creative-vid-5', type: 'visualCreative', position: { x: 1150, y: 450 }, data: { format: 'video', onEdit: () => {} } },
      { id: 'creative-car-1', type: 'visualCreative', position: { x: 1000, y: 550 }, data: { format: 'carousel', onEdit: () => {} } },
      { id: 'creative-car-2', type: 'visualCreative', position: { x: 1000, y: 650 }, data: { format: 'carousel', onEdit: () => {} } },
      { id: 'creative-car-3', type: 'visualCreative', position: { x: 1150, y: 550 }, data: { format: 'carousel', onEdit: () => {} } },
      { id: 'creative-car-4', type: 'visualCreative', position: { x: 1150, y: 650 }, data: { format: 'carousel', onEdit: () => {} } },
      { id: 'creative-car-5', type: 'visualCreative', position: { x: 1075, y: 750 }, data: { format: 'carousel', onEdit: () => {} } },
      {
        id: 'youtube-dest',
        type: 'brand',
        position: { x: 1400, y: 220 },
        data: { brand: 'youtube', label: 'YouTube', isActive: true, onEdit: () => {} }
      },
      {
        id: 'instagram-dest',
        type: 'brand',
        position: { x: 1400, y: 380 },
        data: { brand: 'instagram', label: 'Instagram', isActive: true, onEdit: () => {} }
      },
      {
        id: 'result-views',
        type: 'result',
        position: { x: 1700, y: 280 },
        data: { label: 'Visualizações', metric: 'ThruPlay', target: '50000', achieved: '45230', percentage: '90' }
      }
    ]

    const templateEdges: Edge[] = [
      { id: 'e1', source: 'meta-ads', target: 'campaign-dvd', animated: true, style: { stroke: '#0081FB', strokeWidth: 2 } },
      { id: 'e2', source: 'campaign-dvd', target: 'audience-gospel', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
      ...Array.from({ length: 5 }, (_, i) => ({ id: `e${3+i}`, source: 'audience-gospel', target: `creative-img-${i+1}`, animated: true, style: { stroke: '#ec4899', strokeWidth: 1.5 } })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `e${8+i}`, source: 'audience-gospel', target: `creative-vid-${i+1}`, animated: true, style: { stroke: '#ef4444', strokeWidth: 1.5 } })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `e${13+i}`, source: 'audience-gospel', target: `creative-car-${i+1}`, animated: true, style: { stroke: '#3b82f6', strokeWidth: 1.5 } })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `e${18+i}`, source: `creative-img-${i+1}`, target: 'youtube-dest', animated: true, style: { stroke: '#f97316', strokeWidth: 1 } })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `e${23+i}`, source: `creative-vid-${i+1}`, target: 'youtube-dest', animated: true, style: { stroke: '#f97316', strokeWidth: 1 } })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `e${28+i}`, source: `creative-car-${i+1}`, target: 'youtube-dest', animated: true, style: { stroke: '#f97316', strokeWidth: 1 } })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `e${33+i}`, source: `creative-img-${i+1}`, target: 'instagram-dest', animated: true, style: { stroke: '#f59e0b', strokeWidth: 1 } })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `e${38+i}`, source: `creative-vid-${i+1}`, target: 'instagram-dest', animated: true, style: { stroke: '#f59e0b', strokeWidth: 1 } })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `e${43+i}`, source: `creative-car-${i+1}`, target: 'instagram-dest', animated: true, style: { stroke: '#f59e0b', strokeWidth: 1 } })),
      { id: 'e48', source: 'youtube-dest', target: 'result-views', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 3 } },
      { id: 'e49', source: 'instagram-dest', target: 'result-views', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 3 } }
    ]

    setNodes(templateNodes)
    setEdges(templateEdges)
    setFlowName('🎄 DVD Natal 2024')
    setFlowDescription('Campanha de visualizações para bombar o DVD no YouTube e Instagram')
    console.log('🎄 Template DVD Natal carregado')
  }

  // Prevent unused variable warning - template available for future use
  void _loadDVDNatalTemplate

  return (
    <div className="h-screen flex bg-gray-50">
      {showSidebar && <NodesSidebar />}

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Voltar"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1 max-w-2xl">
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-0 w-full"
                placeholder="Nome do Flow"
              />
              <input
                type="text"
                value={flowDescription}
                onChange={(e) => setFlowDescription(e.target.value)}
                className="text-sm text-gray-500 bg-transparent border-none focus:outline-none focus:ring-0 px-0 mt-0.5 w-full"
                placeholder="Adicione uma descrição..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ✨ Botão Isaac Newton Template */}
            <button
              onClick={loadIsaacNewtonTemplate}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm font-medium"
              title="Carregar Template Isaac Newton Schools"
            >
              <School className="w-4 h-4" />
              Isaac Newton
            </button>

            {/* Status de Salvamento */}
            <div className="flex items-center gap-2 text-xs min-w-[120px]">
              {isSaving ? (
                <span className="text-blue-600 flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </span>
              ) : saveError ? (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Erro ao salvar
                </span>
              ) : lastSaved ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Save className="w-3 h-3" />
                  Salvo {formatTimeAgo(lastSaved)}
                </span>
              ) : null}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium shadow-sm"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>

            <button
              onClick={handleExportPNG}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </header>

        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            panOnDrag={panOnDrag}
            selectionOnDrag={!panOnDrag}
            panOnScroll={panOnDrag}
            zoomOnScroll={!panOnDrag}
            fitView
            minZoom={0.2}
            maxZoom={4}
          >
            <Background color="#e5e7eb" gap={16} size={1} />
            <Controls showInteractive={false} />
            
            <Panel position="top-left" className="flex gap-2">
              <button
                onClick={() => setPanOnDrag(false)}
                className={`p-3 rounded-lg border-2 shadow-lg transition-all ${!panOnDrag ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                title="Modo Seleção (V)"
              >
                <MousePointer className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setPanOnDrag(true)}
                className={`p-3 rounded-lg border-2 shadow-lg transition-all ${panOnDrag ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                title="Modo Mão (H)"
              >
                <Hand className="w-5 h-5" />
              </button>
            </Panel>
            <MiniMap 
              nodeColor={(node) => {
                const colors: Record<string, string> = {
                  trafficSource: '#3b82f6',
                  campaign: '#10b981',
                  adSet: '#8b5cf6',
                  ad: '#f97316',
                  audience: '#6366f1',
                  result: '#ec4899',
                  icon: '#6b7280',
                }
                return colors[node.type || ''] || '#6b7280'
              }}
              maskColor="rgba(0, 0, 0, 0.05)"
              style={{
                backgroundColor: '#f9fafb',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
          </ReactFlow>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="absolute left-4 bottom-4 p-3 bg-white border-2 border-gray-300 rounded-lg shadow-lg hover:bg-gray-50 transition-all z-10"
            title={showSidebar ? 'Ocultar painel' : 'Mostrar painel'}
          >
            <Layers className={`w-5 h-5 text-gray-700 ${showSidebar ? '' : 'scale-110'}`} />
          </button>

          {selectedNodes.length > 0 && (
            <div className="absolute left-4 top-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-10 flex flex-col gap-1">
              <div className="text-sm font-medium">
                {selectedNodes.length} elemento{selectedNodes.length > 1 ? 's' : ''} selecionado{selectedNodes.length > 1 ? 's' : ''}
              </div>
              <div className="text-xs opacity-90">
                Ctrl+D duplicar • Ctrl+C copiar • Ctrl+V colar • Del remover
              </div>
            </div>
          )}
        </div>
      </div>

      {editingNode && editingNode.type === 'trafficSource' && (
        <TrafficSourceForm
          data={editingNode.data}
          onUpdate={handleSaveNode}
          onClose={() => setEditingNode(null)}
        />
      )}

      {editingNode && editingNode.type === 'campaign' && (
        <CampaignForm
          data={editingNode.data}
          onUpdate={handleSaveNode}
          onClose={() => setEditingNode(null)}
        />
      )}

      {editingNode && ['adSet', 'ad', 'audience', 'result'].includes(editingNode.type) && (
        <NodeEditForm
          data={editingNode.data}
          onUpdate={handleSaveNode}
          onClose={() => setEditingNode(null)}
          nodeType={editingNode.type}
        />
      )}
    </div>
  )
}

export default function FlowEditorPage() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  )
}
