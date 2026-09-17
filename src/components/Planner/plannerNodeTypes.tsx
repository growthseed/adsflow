/**
 * Registro único dos tipos de node/edge do Planner. O editor usa a versão
 * "com chrome" (toolbar flutuante + métricas ao vivo); a página pública usa
 * os componentes crus. Antes cada página mantinha sua própria lista e elas
 * divergiam (nodes salvos quebravam na visão pública).
 */
import type { Node, Edge, NodeTypes, EdgeTypes } from '@xyflow/react'

import TrafficSourceNode from '@/components/Nodes/TrafficSourceNode'
import CampaignNode from '@/components/Nodes/CampaignNode'
import AdSetNode from '@/components/Nodes/AdSetNode'
import AdNode from '@/components/Nodes/AdNode'
import AudienceNode from '@/components/Nodes/AudienceNode'
import ResultNode from '@/components/Nodes/ResultNode'
import LandingPageNode from '@/components/Nodes/LandingPageNode'
import PostitNode from '@/components/Nodes/PostitNode'
import AdvancedTextNode from '@/components/Nodes/AdvancedTextNode'
import ShapeNode from '@/components/Nodes/ShapeNode'
import TextboxNode from '@/components/Nodes/TextboxNode'
import BrandNode from '@/components/Nodes/BrandNode'
import VisualCampaignNode from '@/components/Nodes/VisualCampaignNode'
import VisualAudienceNode from '@/components/Nodes/VisualAudienceNode'
import VisualCreativeNode from '@/components/Nodes/VisualCreativeNode'
import ChannelNode from '@/components/Nodes/ChannelNode'
import IconNode from '@/components/Nodes/IconNode'
import { SourceNode as FunnelSourceNode, PageNode as FunnelPageNode, ActionNode as FunnelActionNode } from '@/components/Nodes/Funnelytics'
import GoalNode from '@/components/Nodes/GoalNode'
import LeadJourneyNode from '@/components/Nodes/LeadJourneyNode'
import ClientLogoNode from '@/components/Nodes/ClientLogoNode'
import ConversionEdge from '@/components/Edges/ConversionEdge'
import { withPlannerChrome } from './NodeChrome'
import { normalizeLogo, THUMBNAIL_NODE_TYPES } from './plannerModel'

export const PLANNER_NODE_TYPES: NodeTypes = {
  clientLogo: ClientLogoNode,
  trafficSource: TrafficSourceNode,
  traffic_source: TrafficSourceNode,
  campaign: CampaignNode,
  adSet: AdSetNode,
  ad_set: AdSetNode,
  ad: AdNode,
  audience: AudienceNode,
  result: ResultNode,
  landingPage: LandingPageNode,
  brand: BrandNode,
  visualCampaign: VisualCampaignNode,
  visualAudience: VisualAudienceNode,
  visualCreative: VisualCreativeNode,
  channel: ChannelNode,
  icon: IconNode,
  funnelSource: FunnelSourceNode,
  funnelPage: FunnelPageNode,
  funnelAction: FunnelActionNode,
  postit: PostitNode,
  advancedText: AdvancedTextNode,
  shape: ShapeNode,
  textbox: TextboxNode,
  goal: GoalNode,
  leadJourney: LeadJourneyNode,
}

export const EDITOR_NODE_TYPES: NodeTypes = Object.fromEntries(
  Object.entries(PLANNER_NODE_TYPES).map(([type, component]) => [type, withPlannerChrome(component)]),
)

export const PLANNER_EDGE_TYPES: EdgeTypes = { conversionEdge: ConversionEdge }

export const COMPACT_NODE_TYPES = new Set(['brand', 'visualCampaign', 'visualAudience', 'visualCreative', 'channel', 'icon'])

/**
 * Nodes circulares antigos foram salvos com 440x240; sem isso a caixa de
 * seleção fica enorme em volta de um badge pequeno. Logos ganham lado fixo
 * pelo preset S/M/L.
 */
export function compactNodeStyle(node: Node): Node {
  if (THUMBNAIL_NODE_TYPES.has(node.type || '')) {
    // Nodes de página crescem com a miniatura: só a largura é fixada, a altura
    // é a do conteúdo (senão o node mede 120px e o auto-layout sobrepõe vizinhos).
    const { height: _h, ...style } = node.style ?? {}
    const { height: _nh, ...rest } = node
    void _h; void _nh
    return { ...rest, style: { ...style, width: Math.max(280, Number(style.width) || 0) } }
  }
  if (!COMPACT_NODE_TYPES.has(node.type || '')) return normalizeLogo(node)
  return { ...node, width: 112, height: 112, style: { ...node.style, width: 112, height: 112 } }
}

/**
 * Remove `sourceHandle`/`targetHandle` vazios ou "undefined" salvos por
 * versões antigas — React Flow tenta achar um handle com esse id e loga
 * warning em loop.
 */
export function sanitizeEdges(raw: Edge[]): Edge[] {
  return raw.map(edge => {
    const cleaned = { ...edge }
    const bad = (v: unknown) => v === undefined || v === null || v === 'undefined' || v === ''
    if (bad(cleaned.sourceHandle)) delete (cleaned as { sourceHandle?: unknown }).sourceHandle
    if (bad(cleaned.targetHandle)) delete (cleaned as { targetHandle?: unknown }).targetHandle
    return cleaned
  })
}
