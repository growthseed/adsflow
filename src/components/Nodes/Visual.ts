// Visual Nodes - Minimal versions for flow visualization
export { default as CampaignVisualNode } from './VisualCampaignNode'
export { default as AdSetVisualNode } from './VisualAudienceNode'
export { default as AdVisualNode } from './VisualCreativeNode'

// Types for visual nodes
export interface CampaignVisualData {
  label?: string
}

export interface AdSetVisualData {
  label?: string
}

export interface AdVisualData {
  label?: string
}
