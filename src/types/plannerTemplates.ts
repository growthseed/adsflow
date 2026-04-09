/**
 * ============================================
 * Planner Template Types — AdFlow v4 Sprint 5
 * ============================================
 * Shape of pre-built flows that can be cloned into a client's
 * planner canvas. Each template is a valid ReactFlow graph
 * (nodes + edges) with rich metadata for the picker UI.
 *
 * Templates live in src/data/plannerTemplates/*.ts and are
 * registered via the barrel export. Adding a new template
 * = one new file + one line in the registry.
 * ============================================
 */

import type { Node, Edge } from 'reactflow'

/** Category badges shown on the picker cards */
export type TemplateCategory =
  | 'briefing'
  | 'strategy'
  | 'funnel'
  | 'launch'
  | 'remarketing'
  | 'seasonal'
  | 'audit'

export type TemplateVertical =
  | 'any'
  | 'education'
  | 'health'
  | 'ecommerce'
  | 'services'
  | 'b2b'
  | 'local'

export interface PlannerTemplate {
  /** Stable identifier used in URLs and persistence */
  id: string
  /** Display name shown on the card */
  name: string
  /** One-line description */
  description: string
  /** Longer paragraph shown on hover or detail preview */
  long_description?: string
  /** Primary category for filtering */
  category: TemplateCategory
  /** Vertical hint — 'any' means it's generic */
  vertical: TemplateVertical
  /** Emoji/icon representation on the card */
  icon: string
  /** Accent color gradient for the card */
  color: 'violet' | 'blue' | 'emerald' | 'amber' | 'pink' | 'slate'
  /** Number of nodes — shown as metadata */
  node_count: number
  /** Number of edges — shown as metadata */
  edge_count: number
  /** Estimated setup time in minutes */
  estimated_setup_minutes: number
  /** Tags for search + filtering */
  tags: string[]
  /** ReactFlow nodes (deep cloned before use) */
  nodes: Node[]
  /** ReactFlow edges (deep cloned before use) */
  edges: Edge[]
}

/** Preset filter state for the picker UI */
export interface TemplateFilter {
  category?: TemplateCategory | 'all'
  vertical?: TemplateVertical | 'all'
  query?: string
}
