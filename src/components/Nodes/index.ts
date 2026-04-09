/**
 * Barrel export dos nodes do Planner (v4).
 * Apenas nodes realmente usados pelas páginas do Planner e templates.
 */

export { default as TrafficSourceNode } from './TrafficSourceNode'
export { default as CampaignNode } from './CampaignNode'
export { default as AdSetNode } from './AdSetNode'
export { default as AdNode } from './AdNode'
export { default as AudienceNode } from './AudienceNode'
export { default as ResultNode } from './ResultNode'
export { default as LandingPageNode } from './LandingPageNode'
export { default as PostitNode } from './PostitNode'
export { default as AdvancedTextNode } from './AdvancedTextNode'
export { default as ShapeNode } from './ShapeNode'
export { default as TextboxNode } from './TextboxNode'

export type { TrafficSourceData } from './TrafficSourceNode'
export type { CampaignData } from './CampaignNode'
export type { AdSetData } from './AdSetNode'
export type { AdData } from './AdNode'
export type { AudienceData } from './AudienceNode'
export type { ResultData } from './ResultNode'
