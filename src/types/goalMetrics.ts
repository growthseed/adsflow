/**
 * ============================================
 * Goal Metrics Types — AdFlow Sprint B.1
 * ============================================
 * Extensible metric system: pre-defined registry + custom per client.
 * Objective-aware, quarter-based, formula-capable (B.2).
 */

import type { MetricUnit, ImprovementDirection, KPISource } from './metrics'

// ── Campaign Objectives ──────────────────────────────

export type CampaignObjective =
  | 'awareness'
  | 'reach'
  | 'engagement'
  | 'lead_gen'
  | 'lead_qualification'
  | 'sales_direct'
  | 'sales_complex'
  | 'retention'
  | 'local_traffic'

export const OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  awareness: 'Reconhecimento de Marca',
  reach: 'Alcance',
  engagement: 'Engajamento',
  lead_gen: 'Geração de Leads',
  lead_qualification: 'Qualificação de Leads',
  sales_direct: 'Vendas Diretas (E-com)',
  sales_complex: 'Vendas Complexas (Ciclo Longo)',
  retention: 'Retenção / LTV',
  local_traffic: 'Tráfego Local / PDV',
}

// ── Metric Definition (registry entry) ───────────────

export interface MetricDefinition {
  key: string
  label: string
  description: string
  unit: MetricUnit
  format: string
  direction: ImprovementDirection
  /** Which objectives this metric is relevant for */
  objectives: CampaignObjective[]
  /** Possible auto-sources (empty = manual only) */
  auto_sources: KPISource[]
  /** Formula referencing other metric keys (Sprint B.2) */
  formula?: string
  /** If true, only admin can create/edit */
  is_system: boolean
  /** Category for grouping in the picker UI */
  category: MetricCategory
}

export type MetricCategory =
  | 'acquisition'
  | 'conversion'
  | 'revenue'
  | 'engagement'
  | 'branding'
  | 'quality'
  | 'funnel'
  | 'custom'

export const METRIC_CATEGORY_LABELS: Record<MetricCategory, string> = {
  acquisition: 'Aquisição',
  conversion: 'Conversão',
  revenue: 'Receita & ROI',
  engagement: 'Engajamento',
  branding: 'Marca & Awareness',
  quality: 'Qualidade',
  funnel: 'Funil de Vendas',
  custom: 'Personalizada',
}

// ── Quarter / Period ─────────────────────────────────

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom'

export interface QuarterTarget {
  range: string
  target: number
  reason?: string
}

// ── Goal Node Data (ReactFlow node.data) ─────────────

export interface GoalNodeData {
  label: string
  /** Which metric from the registry */
  metric_key: string
  /** Resolved metric definition (for display) */
  metric?: MetricDefinition
  /** Campaign objective that determines suggested metrics */
  objective: CampaignObjective
  /** Period granularity */
  period: GoalPeriod
  /** Targets per quarter (or single target if period != quarterly) */
  targets: QuarterTarget[]
  /** Active quarter/period for current display */
  active_range?: string
  /** Data source for realized value */
  data_source: KPISource | 'manual'
  /** Reference to external account (Google CID, Meta act_id, etc.) */
  account_ref?: string

  // ── Computed (filled by backend or manually) ──
  realized?: number
  attainment_pct?: number
  forecast_end_of_period?: number
  status?: GoalStatus

  // ── UI callbacks ──
  onEdit?: () => void
  onRefresh?: () => void
}

export type GoalStatus = 'on_track' | 'at_risk' | 'off_track' | 'exceeded' | 'no_data'

export function computeGoalStatus(pct: number | undefined): GoalStatus {
  if (pct == null) return 'no_data'
  if (pct >= 100) return 'exceeded'
  if (pct >= 70) return 'on_track'
  if (pct >= 40) return 'at_risk'
  return 'off_track'
}

export const GOAL_STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bg: string }> = {
  exceeded: { label: 'Superado', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  on_track: { label: 'No caminho', color: 'text-blue-700', bg: 'bg-blue-50' },
  at_risk: { label: 'Em risco', color: 'text-amber-700', bg: 'bg-amber-50' },
  off_track: { label: 'Fora da meta', color: 'text-red-700', bg: 'bg-red-50' },
  no_data: { label: 'Sem dados', color: 'text-slate-500', bg: 'bg-slate-50' },
}
