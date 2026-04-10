/**
 * ============================================
 * NODES SIDEBAR — draggable palette for the Planner canvas
 * ============================================
 * Shows all available node types grouped by category. Each node
 * is draggable into the ReactFlow canvas. The node type is passed
 * via the HTML5 drag event dataTransfer.
 *
 * Also includes size presets (S/M/L) that the user can select
 * BEFORE dragging a node — the size is stored in the drag event
 * data and read by the canvas onDrop handler.
 * ============================================
 */

import { useState } from 'react'
import {
  Globe,
  Megaphone,
  Layers,
  FileImage,
  Users,
  Target,
  ExternalLink,
  StickyNote,
  Type,
  Circle,
  MapPin,
  Zap,
  ChevronDown,
} from 'lucide-react'

// =============================================================
// NODE CATALOG
// =============================================================

interface NodeDef {
  type: string
  label: string
  icon: React.ReactNode
  color: string
  description: string
}

interface NodeGroup {
  title: string
  nodes: NodeDef[]
}

// Brand nodes — each brand becomes its own draggable item with
// data.brand pre-set so the BrandNode renders the right logo/color.
const BRAND_NODES: NodeDef[] = [
  { type: 'brand:whatsapp', label: 'WhatsApp', icon: <Circle className="w-4 h-4" />, color: '#25D366', description: 'Logo oficial circular' },
  { type: 'brand:meta', label: 'Meta Ads', icon: <Circle className="w-4 h-4" />, color: '#0081FB', description: 'Logo oficial circular' },
  { type: 'brand:facebook', label: 'Facebook', icon: <Circle className="w-4 h-4" />, color: '#1877F2', description: 'Logo oficial circular' },
  { type: 'brand:instagram', label: 'Instagram', icon: <Circle className="w-4 h-4" />, color: '#E1306C', description: 'Logo oficial circular' },
  { type: 'brand:google', label: 'Google Ads', icon: <Circle className="w-4 h-4" />, color: '#4285F4', description: 'Logo oficial circular' },
  { type: 'brand:youtube', label: 'YouTube', icon: <Circle className="w-4 h-4" />, color: '#FF0000', description: 'Logo oficial circular' },
  { type: 'brand:linkedin', label: 'LinkedIn', icon: <Circle className="w-4 h-4" />, color: '#0A66C2', description: 'Logo oficial circular' },
  { type: 'brand:tiktok', label: 'TikTok', icon: <Circle className="w-4 h-4" />, color: '#000000', description: 'Logo oficial circular' },
  { type: 'brand:twitter', label: 'X (Twitter)', icon: <Circle className="w-4 h-4" />, color: '#000000', description: 'Logo oficial circular' },
  { type: 'brand:telegram', label: 'Telegram', icon: <Circle className="w-4 h-4" />, color: '#26A5E4', description: 'Logo oficial circular' },
  { type: 'brand:email', label: 'Email', icon: <Circle className="w-4 h-4" />, color: '#0072C6', description: 'Email marketing' },
  { type: 'brand:messenger', label: 'Messenger', icon: <Circle className="w-4 h-4" />, color: '#0084FF', description: 'Logo oficial circular' },
  { type: 'brand:shopify', label: 'Shopify', icon: <Circle className="w-4 h-4" />, color: '#96BF48', description: 'Logo oficial circular' },
  { type: 'brand:wordpress', label: 'WordPress', icon: <Circle className="w-4 h-4" />, color: '#21759B', description: 'Logo oficial circular' },
  { type: 'brand:hubspot', label: 'HubSpot', icon: <Circle className="w-4 h-4" />, color: '#FF7A59', description: 'Logo oficial circular' },
  { type: 'brand:mailchimp', label: 'Mailchimp', icon: <Circle className="w-4 h-4" />, color: '#FFE01B', description: 'Logo oficial circular' },
  { type: 'brand:slack', label: 'Slack', icon: <Circle className="w-4 h-4" />, color: '#4A154B', description: 'Logo oficial circular' },
  { type: 'brand:stripe', label: 'Stripe', icon: <Circle className="w-4 h-4" />, color: '#635BFF', description: 'Logo oficial circular' },
  { type: 'brand:zapier', label: 'Zapier', icon: <Circle className="w-4 h-4" />, color: '#FF4A00', description: 'Logo oficial circular' },
  { type: 'brand:spotify', label: 'Spotify', icon: <Circle className="w-4 h-4" />, color: '#1DB954', description: 'Logo oficial circular' },
  { type: 'brand:pinterest', label: 'Pinterest', icon: <Circle className="w-4 h-4" />, color: '#E60023', description: 'Logo oficial circular' },
  { type: 'brand:discord', label: 'Discord', icon: <Circle className="w-4 h-4" />, color: '#5865F2', description: 'Logo oficial circular' },
  { type: 'brand:notion', label: 'Notion', icon: <Circle className="w-4 h-4" />, color: '#FFFFFF', description: 'Logo oficial circular' },
  { type: 'brand:paypal', label: 'PayPal', icon: <Circle className="w-4 h-4" />, color: '#00457C', description: 'Logo oficial circular' },
  { type: 'brand:woocommerce', label: 'WooCommerce', icon: <Circle className="w-4 h-4" />, color: '#96588A', description: 'Logo oficial circular' },
  { type: 'brand:reddit', label: 'Reddit', icon: <Circle className="w-4 h-4" />, color: '#FF4500', description: 'Logo oficial circular' },
]

const NODE_GROUPS: NodeGroup[] = [
  {
    title: 'Marcas (Circulares)',
    nodes: BRAND_NODES,
  },
  {
    title: 'Mídia Paga',
    nodes: [
      { type: 'trafficSource', label: 'Fonte de tráfego', icon: <Globe className="w-4 h-4" />, color: '#3b82f6', description: 'Meta, Google, LinkedIn, etc' },
      { type: 'campaign', label: 'Campanha', icon: <Megaphone className="w-4 h-4" />, color: '#8b5cf6', description: 'Nome, objetivo, budget, status' },
      { type: 'adSet', label: 'Conjunto de anúncios', icon: <Layers className="w-4 h-4" />, color: '#6366f1', description: 'Targeting, budget, schedule' },
      { type: 'ad', label: 'Anúncio', icon: <FileImage className="w-4 h-4" />, color: '#ec4899', description: 'Criativo, formato, métricas' },
    ],
  },
  {
    title: 'Público & Resultado',
    nodes: [
      { type: 'audience', label: 'Audiência', icon: <Users className="w-4 h-4" />, color: '#10b981', description: 'Segmento, tamanho, tipo' },
      { type: 'result', label: 'Resultado', icon: <Target className="w-4 h-4" />, color: '#f59e0b', description: 'Meta, valor alcançado, %' },
      { type: 'landingPage', label: 'Landing Page', icon: <ExternalLink className="w-4 h-4" />, color: '#06b6d4', description: 'URL, WhatsApp, formulário' },
    ],
  },
  {
    title: 'Visual (Circulares)',
    nodes: [
      { type: 'visualCampaign', label: 'Campanha (visual)', icon: <Megaphone className="w-4 h-4" />, color: '#7c3aed', description: 'Campanha circular compacta' },
      { type: 'visualAudience', label: 'Público (visual)', icon: <Users className="w-4 h-4" />, color: '#059669', description: 'Público circular compacto' },
      { type: 'visualCreative', label: 'Criativo (visual)', icon: <FileImage className="w-4 h-4" />, color: '#db2777', description: 'Imagem/vídeo circular' },
      { type: 'channel', label: 'Canal', icon: <Globe className="w-4 h-4" />, color: '#0284c7', description: 'Canal de mídia com ícone' },
      { type: 'icon', label: 'Ícone', icon: <Circle className="w-4 h-4" />, color: '#64748b', description: 'Ícone genérico circular' },
    ],
  },
  {
    title: 'Funnelytics',
    nodes: [
      { type: 'funnelSource', label: 'Fonte (Funil)', icon: <Globe className="w-4 h-4" />, color: '#0ea5e9', description: 'Ponto de entrada do funil' },
      { type: 'funnelPage', label: 'Página (Funil)', icon: <MapPin className="w-4 h-4" />, color: '#22c55e', description: 'Página no funil de conversão' },
      { type: 'funnelAction', label: 'Ação (Funil)', icon: <Zap className="w-4 h-4" />, color: '#f97316', description: 'Evento ou conversão no funil' },
    ],
  },
  {
    title: 'Anotação',
    nodes: [
      { type: 'postit', label: 'Post-it', icon: <StickyNote className="w-4 h-4" />, color: '#fbbf24', description: 'Nota adesiva colorida' },
      { type: 'advancedText', label: 'Texto rico', icon: <Type className="w-4 h-4" />, color: '#64748b', description: 'Texto com formatação avançada' },
      { type: 'shape', label: 'Forma', icon: <Circle className="w-4 h-4" />, color: '#94a3b8', description: 'Círculo, retângulo, diamante' },
    ],
  },
]

// =============================================================
// SIZE PRESETS
// =============================================================

type NodeSize = 'S' | 'M' | 'L'

const SIZE_DIMENSIONS: Record<NodeSize, { width: number; height: number }> = {
  S: { width: 160, height: 80 },
  M: { width: 220, height: 120 },
  L: { width: 300, height: 160 },
}

// =============================================================
// COMPONENT
// =============================================================

interface NodesSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function NodesSidebar({ isOpen, onClose }: NodesSidebarProps) {
  const [activeSize, setActiveSize] = useState<NodeSize>('M')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(NODE_GROUPS.map((g) => g.title)),
  )

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const onDragStart = (
    e: React.DragEvent,
    nodeType: string,
  ) => {
    const dims = SIZE_DIMENSIONS[activeSize]
    e.dataTransfer.setData('application/reactflow', nodeType)
    e.dataTransfer.setData('application/nodesize', JSON.stringify(dims))
    e.dataTransfer.effectAllowed = 'move'
  }

  if (!isOpen) return null

  return (
    <div className="h-full w-full bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Adicionar Node</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Size selector */}
      <div className="px-4 py-2 border-b border-slate-100">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Tamanho do node
        </div>
        <div className="flex gap-1">
          {(['S', 'M', 'L'] as NodeSize[]).map((size) => (
            <button
              key={size}
              onClick={() => setActiveSize(size)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSize === size
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {size}
              <span className="hidden sm:inline text-[10px] ml-0.5 opacity-70">
                ({SIZE_DIMENSIONS[size].width}px)
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Node groups */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {NODE_GROUPS.map((group) => {
          const isExpanded = expandedGroups.has(group.title)
          return (
            <div key={group.title}>
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700"
              >
                {group.title}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                />
              </button>

              {isExpanded && (
                <div className="space-y-1 mb-2">
                  {group.nodes.map((node) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 cursor-grab active:cursor-grabbing transition-colors group"
                      title={`Arraste para o canvas — ${node.description}`}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: node.color }}
                      >
                        {node.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-slate-800 truncate">
                          {node.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {node.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Arraste e solte no canvas. Clique duplo num node para editar. Use as
          alças para redimensionar.
        </p>
      </div>
    </div>
  )
}

export { NODE_GROUPS, SIZE_DIMENSIONS }
export type { NodeSize, NodeDef }
