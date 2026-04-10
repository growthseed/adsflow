/**
 * Barrel export dos nodes do Planner (v4).
 * Todos os node types disponíveis para o canvas.
 */

// Core ads nodes (retangulares com métricas)
export { default as TrafficSourceNode } from './TrafficSourceNode'
export { default as CampaignNode } from './CampaignNode'
export { default as AdSetNode } from './AdSetNode'
export { default as AdNode } from './AdNode'
export { default as AudienceNode } from './AudienceNode'
export { default as ResultNode } from './ResultNode'
export { default as LandingPageNode } from './LandingPageNode'

// Visual nodes (circulares / compactos — estilo Funnelytics)
export { default as BrandNode } from './BrandNode'
export { default as VisualCampaignNode } from './VisualCampaignNode'
export { default as VisualAudienceNode } from './VisualAudienceNode'
export { default as VisualCreativeNode } from './VisualCreativeNode'
export { default as ChannelNode } from './ChannelNode'
export { default as IconNode } from './IconNode'

// Annotation nodes
export { default as PostitNode } from './PostitNode'
export { default as AdvancedTextNode } from './AdvancedTextNode'
export { default as ShapeNode } from './ShapeNode'
export { default as TextboxNode } from './TextboxNode'

// Types
export type { TrafficSourceData } from './TrafficSourceNode'
export type { CampaignData } from './CampaignNode'
export type { AdSetData } from './AdSetNode'
export type { AdData } from './AdNode'
export type { AudienceData } from './AudienceNode'
export type { ResultData } from './ResultNode'
export type { BrandNodeData } from './BrandNode'
