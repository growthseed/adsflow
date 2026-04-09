/**
 * ============================================
 * UNIVERSAL METRIC TYPES — AdFlow v4
 * ============================================
 * Shapes that every data adapter (meta, google_ads, ga4, kommo, etc)
 * normalizes its output into. If a component consumes one of these
 * types, it works with ANY data source without adaptation.
 *
 * The rule: services talk to their own APIs and return these types.
 * Components never see raw API data — only KPI, TimeSeries, EntityTable.
 * ============================================
 */

// =============================================================
// PRIMITIVES
// =============================================================

export type MetricUnit =
  | 'currency'   // R$, $, € — formatted with locale + symbol
  | 'percent'    // 12.4% — 2 decimals by default
  | 'number'     // 1,234 — integer or decimal, thousands separator
  | 'duration'   // "2m 34s" — seconds converted to human readable
  | 'ratio'      // 3.2x — generic ratio with "x" suffix
  | 'score'      // 7/10 — quality scores, NPS, etc

export type TrendDirection = 'up' | 'down' | 'flat'

/**
 * Direction of improvement for a metric.
 * - "higher_better": ROAS, conversões, revenue — ↑ is good
 * - "lower_better":  CPL, CPA, bounce rate — ↓ is good
 * - "neutral":       impressões, cliques — direção não indica sucesso
 */
export type ImprovementDirection = 'higher_better' | 'lower_better' | 'neutral'

// =============================================================
// KPI — single-metric scorecard
// =============================================================

export interface KPI {
  /** Stable key for this metric (e.g., "google_ads.cpl") */
  key: string

  /** Display label — what appears above the number */
  label: string

  /** Optional tooltip explaining what this metric means */
  description?: string

  /** Current period value */
  value: number

  /** Unit for formatting */
  unit: MetricUnit

  /** Optional: previous period value — used to compute delta */
  previous_value?: number

  /** Optional: pre-computed delta as percent (e.g., 0.08 = +8%) */
  delta_percent?: number

  /** Optional: absolute delta (e.g., +500) */
  delta_absolute?: number

  /** Direction indicator (green/red colors depend on improvement_direction) */
  trend?: TrendDirection

  /** Whether up or down is "good" for this metric */
  improvement_direction?: ImprovementDirection

  /** Optional: goal/target value */
  goal?: number

  /** Optional: sparkline data points (last N periods) */
  sparkline?: number[]

  /** Source platform that produced this metric */
  source?: KPISource

  /** Optional: currency code (BRL, USD) — when unit='currency' */
  currency?: string
}

export type KPISource =
  | 'meta_ads'
  | 'instagram'
  | 'google_ads'
  | 'ga4'
  | 'gsc'
  | 'youtube'
  | 'gmb'
  | 'kommo'
  | 'clickup'
  | 'linkedin_ads'
  | 'tiktok_ads'
  | 'ecommerce'
  | 'shopify'
  | 'woocommerce'
  | 'mailchimp'
  | 'brevo'
  | 'hotmart'
  | 'manual'
  | 'blended'        // cross-source calculated metric

// =============================================================
// TIME SERIES — chart-ready data
// =============================================================

export interface TimeSeriesPoint {
  /** ISO date string (YYYY-MM-DD) */
  date: string
  /** Value at that date */
  value: number
  /** Optional: secondary value for comparison (previous period) */
  comparison_value?: number
}

export interface TimeSeries {
  /** Unique key */
  key: string
  /** Display label */
  label: string
  /** Unit for formatting axis + tooltip */
  unit: MetricUnit
  /** Data points, sorted ascending by date */
  points: TimeSeriesPoint[]
  /** Source platform */
  source?: KPISource
  /** Granularity of the series */
  granularity?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  /** Optional: color hint (hex or token name) */
  color?: string
}

/**
 * Multiple time series rendered on the same chart
 * (e.g., "Conversões por canal" with Meta + Google Ads + GA4 lines)
 */
export interface MultiTimeSeries {
  key: string
  label: string
  unit: MetricUnit
  series: TimeSeries[]
}

// =============================================================
// ENTITY TABLE — generic tabular data
// =============================================================

export type EntityType =
  | 'campaign'
  | 'ad_group'
  | 'ad'
  | 'keyword'
  | 'search_term'
  | 'audience'
  | 'placement'
  | 'page'
  | 'query'
  | 'lead'
  | 'opportunity'
  | 'task'

export type ColumnFormat = MetricUnit | 'text' | 'date' | 'datetime' | 'status' | 'badge'

export interface EntityColumn {
  /** Key in the row object */
  key: string
  /** Display label */
  label: string
  /** Format hint for renderer */
  format: ColumnFormat
  /** Whether column is sortable */
  sortable?: boolean
  /** Whether column is visible by default */
  visible?: boolean
  /** Horizontal alignment */
  align?: 'left' | 'center' | 'right'
  /** Tooltip */
  description?: string
}

export interface EntityTable {
  /** What kind of entity this table holds */
  entity_type: EntityType
  /** Source platform */
  source?: KPISource
  /** Column definitions */
  columns: EntityColumn[]
  /** Row data — each row is a flat record */
  rows: Record<string, unknown>[]
  /** Total row count (may be > rows.length if paginated) */
  total_count?: number
  /** Pagination info */
  page?: number
  page_size?: number
}

// =============================================================
// DATE RANGE — used by every data fetch
// =============================================================

export interface DateRange {
  /** Start date (ISO YYYY-MM-DD) */
  from: string
  /** End date (ISO YYYY-MM-DD, inclusive) */
  to: string
}

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_14_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_week'
  | 'this_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom'

export type ComparisonMode =
  | 'none'
  | 'previous_period'   // compara últimos 30d vs 30d anteriores
  | 'previous_year'     // compara com mesmo período ano anterior
  | 'custom'            // gestor escolhe

// =============================================================
// PROJECT SCOPE — métricas de sucesso por tipo de projeto
// =============================================================

export type ProjectScopeId =
  | 'branding'
  | 'social'
  | 'performance'
  | 'lead_gen'
  | 'ecommerce'
  | 'hibrido'
  | 'educacao'        // vertical custom
  | 'custom'

export interface ProjectScopeMetric {
  /** Metric key (matches KPI.key) */
  key: string
  /** Display label */
  label: string
  /** Source that provides this metric */
  source: KPISource
  /** Unit */
  unit: MetricUnit
  /** Direction of improvement */
  improvement_direction: ImprovementDirection
  /** Optional: goal/target */
  goal?: number
}

export interface ProjectScope {
  /** Scope identifier */
  id: ProjectScopeId
  /** Display name */
  name: string
  /** Short description (1 sentence) */
  description: string
  /** Icon name (lucide-react) */
  icon: string
  /** Success metrics (max 4 for the hero strip) */
  success_metrics: ProjectScopeMetric[]
}

// =============================================================
// CLIENT SERVICE TIER — nível do contrato Efeito Digital × cliente
// =============================================================

export type ClientServiceTier = 'basic' | 'pro' | 'black' | 'enterprise'

export interface ClientServiceTierConfig {
  tier: ClientServiceTier
  name: string
  /** Max channels visible in Performance module */
  max_channels: number
  /** Which channels are unlocked */
  channels_allowed: KPISource[]
  /** Planner features */
  planner: {
    max_flows: number
    templates: boolean
    client_comments: boolean
    versioning: boolean
  }
  /** Projeto (ClickUp) features */
  projeto: {
    enabled: boolean
    read_only: boolean
    client_comments: boolean
    custom_workflows: boolean
  }
  /** AI features */
  ai: {
    insights_frequency: 'never' | 'monthly' | 'weekly' | 'daily'
    mcp_local: boolean
    custom_skills: boolean
  }
  /** History retention in days (null = unlimited) */
  history_days: number | null
  /** Report automation */
  reports: {
    pdf_branded: boolean
    white_label: boolean
    frequency: 'monthly' | 'weekly' | 'daily' | 'on_demand'
    alerts_channels: Array<'email' | 'telegram' | 'slack' | 'webhook'>
  }
}

// =============================================================
// HELPERS
// =============================================================

/**
 * Compute delta between current and previous values.
 * Returns percent as decimal (e.g., 0.08 = +8%)
 */
export function computeDelta(
  current: number,
  previous: number | undefined,
): { delta_percent: number; delta_absolute: number; trend: TrendDirection } | null {
  if (previous === undefined || previous === null) return null
  if (previous === 0) {
    return {
      delta_percent: current === 0 ? 0 : 1,
      delta_absolute: current,
      trend: current === 0 ? 'flat' : 'up',
    }
  }
  const delta_absolute = current - previous
  const delta_percent = delta_absolute / Math.abs(previous)
  const trend: TrendDirection =
    Math.abs(delta_percent) < 0.005 ? 'flat' : delta_percent > 0 ? 'up' : 'down'
  return { delta_percent, delta_absolute, trend }
}

/**
 * Determine if a trend should be rendered in "good" (green) or
 * "bad" (red) color based on the metric's improvement direction.
 */
export function isGoodTrend(
  trend: TrendDirection,
  direction: ImprovementDirection = 'higher_better',
): boolean | null {
  if (trend === 'flat') return null
  if (direction === 'neutral') return null
  if (direction === 'higher_better') return trend === 'up'
  return trend === 'down'
}
