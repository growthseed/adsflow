import type { Node, Edge } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import dagre from '@dagrejs/dagre'

// ---------------------------------------------------------------------------
// Logos do cliente
// ---------------------------------------------------------------------------
export const LOGO_SIZES = { S: 64, M: 88, L: 112 } as const
export const PLANNER_STAGES = ['Aquisição', 'Página', 'Relacionamento', 'Venda', 'Pós-venda']
export function logoSize(value: unknown) { return LOGO_SIZES[value as keyof typeof LOGO_SIZES] ?? LOGO_SIZES.M }
export function normalizeLogo(node: Node): Node {
  if (node.type !== 'clientLogo') return node
  const size = logoSize(node.data.size)
  return { ...node, width: size, height: size, style: { ...node.style, width: size, height: size } }
}

// ---------------------------------------------------------------------------
// Seleção, alinhamento e etapas
// ---------------------------------------------------------------------------
export function nodeWidth(node: Node) { return node.measured?.width ?? node.width ?? (Number(node.style?.width) || 220) }
export function nodeHeight(node: Node) { return node.measured?.height ?? node.height ?? (Number(node.style?.height) || 120) }

export function removeSelection(nodes: Node[], edges: Edge[]) {
  const ids = new Set(nodes.filter(n => n.selected).map(n => n.id))
  return { nodes: nodes.filter(n => !ids.has(n.id)), edges: edges.filter(e => !e.selected && !ids.has(e.source) && !ids.has(e.target)) }
}
export function alignSelection(nodes: Node[], axis: 'horizontal' | 'vertical') {
  const selected = nodes.filter(n => n.selected && !n.parentId)
  if (selected.length < 2) return nodes
  const horizontal = axis === 'horizontal'
  const ordered = [...selected].sort((a, b) => horizontal ? a.position.x - b.position.x : a.position.y - b.position.y)
  const cross = Math.min(...ordered.map(n => horizontal ? n.position.y : n.position.x))
  let cursor = Math.min(...ordered.map(n => horizontal ? n.position.x : n.position.y))
  const positions = new Map<string, { x: number; y: number }>()
  for (const node of ordered) {
    positions.set(node.id, horizontal ? { x: cursor, y: cross } : { x: cross, y: cursor })
    cursor += (horizontal ? node.width ?? 112 : node.height ?? 112) + 64
  }
  return nodes.map(n => positions.has(n.id) ? { ...n, position: positions.get(n.id)! } : n)
}
export function visibleFlow(nodes: Node[], edges: Edge[], hiddenStages: Set<string>) {
  const visibleNodes = nodes.filter(n => !hiddenStages.has(String(n.data.stage ?? '')))
  const ids = new Set(visibleNodes.map(n => n.id))
  return { nodes: visibleNodes, edges: edges.filter(e => ids.has(e.source) && ids.has(e.target)) }
}

// ---------------------------------------------------------------------------
// Auto-layout (dagre) — organiza o fluxo da esquerda pra direita ou de cima pra baixo
// ---------------------------------------------------------------------------
export function autoLayout(nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' = 'LR'): Node[] {
  if (!nodes.length) return nodes
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: direction, nodesep: 56, ranksep: 120, marginx: 24, marginy: 24 })
  const roots = nodes.filter(n => !n.parentId)
  const ids = new Set(roots.map(n => n.id))
  for (const node of roots) graph.setNode(node.id, { width: nodeWidth(node), height: nodeHeight(node) + (node.type === 'clientLogo' ? 28 : 0) })
  for (const edge of edges) if (ids.has(edge.source) && ids.has(edge.target)) graph.setEdge(edge.source, edge.target)
  dagre.layout(graph)
  return nodes.map(node => {
    if (!ids.has(node.id)) return node
    const placed = graph.node(node.id)
    const x = Math.round((placed.x - nodeWidth(node) / 2) / 16) * 16
    const y = Math.round((placed.y - nodeHeight(node) / 2) / 16) * 16
    return { ...node, position: { x, y } }
  })
}

// ---------------------------------------------------------------------------
// Copiar / colar / duplicar
// ---------------------------------------------------------------------------
export interface ClipboardPayload { nodes: Node[]; edges: Edge[] }
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export function copySelection(nodes: Node[], edges: Edge[]): ClipboardPayload | null {
  const selected = nodes.filter(n => n.selected)
  if (!selected.length) return null
  const ids = new Set(selected.map(n => n.id))
  const minX = Math.min(...selected.map(n => n.position.x))
  const minY = Math.min(...selected.map(n => n.position.y))
  return {
    nodes: selected.map(n => ({ ...n, selected: false, position: { x: n.position.x - minX, y: n.position.y - minY } })),
    edges: edges.filter(e => ids.has(e.source) && ids.has(e.target)).map(e => ({ ...e, selected: false })),
  }
}
export function pasteSelection(nodes: Node[], edges: Edge[], payload: ClipboardPayload, origin: { x: number; y: number }) {
  const idMap = new Map(payload.nodes.map(n => [n.id, `${n.type ?? 'node'}-${newId()}`]))
  const pasted = payload.nodes.map(n => ({ ...n, id: idMap.get(n.id)!, selected: true, data: { ...n.data }, position: { x: origin.x + n.position.x, y: origin.y + n.position.y }, ...(n.parentId && idMap.has(n.parentId) ? { parentId: idMap.get(n.parentId) } : {}) }))
  const pastedEdges = payload.edges.map(e => ({ ...e, id: `edge-${newId()}`, source: idMap.get(e.source)!, target: idMap.get(e.target)!, selected: false, data: { ...e.data } }))
  return { nodes: [...nodes.map(n => ({ ...n, selected: false })), ...pasted], edges: [...edges.map(e => ({ ...e, selected: false })), ...pastedEdges] }
}
export function duplicateSelection(nodes: Node[], edges: Edge[], offset = 48) {
  const payload = copySelection(nodes, edges)
  if (!payload) return { nodes, edges }
  const selected = nodes.filter(n => n.selected)
  const origin = { x: Math.min(...selected.map(n => n.position.x)) + offset, y: Math.min(...selected.map(n => n.position.y)) + offset }
  return pasteSelection(nodes, edges, payload, origin)
}

// ---------------------------------------------------------------------------
// Conexões — ícone, rótulo, animação e cor
// ---------------------------------------------------------------------------
export const EDGE_ICONS = [
  { key: 'click', label: 'Clique' },
  { key: 'message', label: 'Mensagem' },
  { key: 'lead', label: 'Lead' },
  { key: 'call', label: 'Ligação' },
  { key: 'mail', label: 'E-mail' },
  { key: 'form', label: 'Formulário' },
  { key: 'calendar', label: 'Agendamento' },
  { key: 'cart', label: 'Carrinho' },
  { key: 'payment', label: 'Pagamento' },
  { key: 'view', label: 'Visualização' },
  { key: 'video', label: 'Vídeo' },
  { key: 'download', label: 'Download' },
  { key: 'retarget', label: 'Remarketing' },
  { key: 'automation', label: 'Automação' },
] as const
export type EdgeIconKey = typeof EDGE_ICONS[number]['key']
export const EDGE_COLORS = ['#94a3b8', '#347a61', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0f172a'] as const

export type PlannerEdgeData = {
  label?: string
  icon?: EdgeIconKey | ''
  animated?: boolean
  dashed?: boolean
  color?: string
  conversionRate?: number
  conversions?: number
  dropoffs?: number
  hideMetrics?: boolean
  active?: boolean
}
export type PlannerEdge = Edge<PlannerEdgeData>

export function edgeColor(data: PlannerEdgeData | undefined, opts: { selected?: boolean; active?: boolean } = {}) {
  if (data?.color && data.color !== EDGE_COLORS[0]) return data.color
  if (opts.selected) return '#347a61'
  if (data?.conversionRate != null && !data.hideMetrics) {
    if (data.conversionRate >= 50) return '#22c55e'
    if (data.conversionRate >= 20) return '#3b82f6'
    if (data.conversionRate >= 10) return '#f59e0b'
    return '#ef4444'
  }
  return opts.active ? '#5b7f72' : '#94a3b8'
}

/**
 * Prepara as conexões para exibição: anima as que estão marcadas como animadas,
 * as selecionadas e as ligadas a um node selecionado; oculta métricas quando os
 * dados ao vivo estão desligados; colore a seta de acordo com a conexão.
 */
export function decorateEdges(edges: Edge[], nodes: Node[], options: { liveData: boolean; animateAll?: boolean }): PlannerEdge[] {
  const selectedNodes = new Set(nodes.filter(n => n.selected).map(n => n.id))
  return edges.map(edge => {
    const data = (edge.data ?? {}) as PlannerEdgeData
    const active = !!edge.selected || selectedNodes.has(edge.source) || selectedNodes.has(edge.target)
    const animated = !!options.animateAll || !!data.animated || active
    const color = edgeColor(data, { selected: !!edge.selected, active })
    return { ...edge, type: 'conversionEdge', animated, markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 }, data: { ...data, hideMetrics: !options.liveData, active } }
  })
}

// ---------------------------------------------------------------------------
// Miniaturas reais de páginas (screenshot)
// ---------------------------------------------------------------------------
export const THUMBNAIL_NODE_TYPES = new Set(['landingPage', 'funnelPage'])
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try { const parsed = new URL(value); return parsed.protocol === 'http:' || parsed.protocol === 'https:' } catch { return false }
}
/** Retorna a URL que precisa de captura, ou null quando o node já tem miniatura para a URL atual. */
export function thumbnailRequest(node: Node): { url: string; refresh: boolean } | null {
  if (!THUMBNAIL_NODE_TYPES.has(node.type ?? '')) return null
  const url = String(node.data.url ?? '').trim()
  if (!isHttpUrl(url)) return null
  if (node.data.thumbnailRefresh) return { url, refresh: true }
  if (node.data.thumbnailFor === url && isHttpUrl(node.data.thumbnail)) return null
  if (node.data.thumbnailFailedFor === url) return null
  return { url, refresh: false }
}
export function applyThumbnail(node: Node, url: string, thumbnail: string): Node {
  return { ...node, data: { ...node.data, thumbnail, thumbnailFor: url, thumbnailFailedFor: undefined, thumbnailRefresh: undefined, thumbnailPending: undefined, thumbnailAt: new Date().toISOString() } }
}
export function failThumbnail(node: Node, url: string): Node {
  return { ...node, data: { ...node.data, thumbnailFailedFor: url, thumbnailRefresh: undefined, thumbnailPending: undefined } }
}
export function requestThumbnailRefresh(node: Node): Node {
  return { ...node, data: { ...node.data, thumbnailRefresh: true, thumbnailFailedFor: undefined } }
}
/** Remove campos transitórios antes de persistir. */
export function cleanForSave(nodes: Node[]): Node[] {
  return nodes.map(n => {
    if (!('thumbnailPending' in n.data) && !('thumbnailRefresh' in n.data)) return n
    const data = { ...n.data }; delete data.thumbnailPending; delete data.thumbnailRefresh
    return { ...n, data }
  })
}
