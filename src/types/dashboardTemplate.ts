/**
 * ============================================
 * DASHBOARD TEMPLATE — AdFlow v4
 * ============================================
 * A dashboard template describes what to render on a client's
 * /c/:slug/performance page. Each template is associated with
 * a nicho (ProjectScopeId) and consists of:
 *
 *   - KPI strip (top row)
 *   - Grid of widgets, each with a row/col layout
 *
 * The template is pure configuration — no data. Data is loaded
 * from the client's performance snapshot at render time.
 *
 * The WidgetRenderer (Bloco 5) reads this shape and composes the
 * actual canonical widget components. If a client's snapshot is
 * missing data for a widget, the widget renders its empty state.
 * ============================================
 */

import type { ProjectScopeId } from '@/types/metrics'

// =============================================================
// WIDGET DEFINITIONS
// =============================================================

export type WidgetType =
  | 'kpi_strip'
  | 'line_chart'
  | 'area_chart'
  | 'bar_chart'
  | 'donut_chart'
  | 'funnel_chart'
  | 'gauge'
  | 'table'

export interface BaseWidget {
  id: string
  type: WidgetType
  title: string
  subtitle?: string
  /** Grid span on desktop (1-12). Default: 6 (half width). */
  colSpan?: number
  /** Grid span on mobile (1-2). Default: 2 (full). */
  mobileSpan?: 1 | 2
  /** Minimum tier needed to see this widget. Default: basic. */
  minTier?: 'basic' | 'pro' | 'black' | 'enterprise'
}

export interface KpiStripWidget extends BaseWidget {
  type: 'kpi_strip'
  /** Keys from the client's snapshot `kpis` dict */
  kpiKeys: string[]
  /** Highlight the first KPI as a hero card */
  hero?: boolean
}

export interface LineChartWidget extends BaseWidget {
  type: 'line_chart'
  /** Snapshot path to the data array (e.g. 'timeseries.daily') */
  dataPath: string
  xKey: string
  series: Array<{ key: string; label: string; color: string }>
}

export interface AreaChartWidget extends BaseWidget {
  type: 'area_chart'
  dataPath: string
  xKey: string
  series: Array<{ key: string; label: string; color: string }>
  stacked?: boolean
}

export interface BarChartWidget extends BaseWidget {
  type: 'bar_chart'
  dataPath: string
  categoryKey: string
  series: Array<{ key: string; label: string; color: string }>
  horizontal?: boolean
  rainbow?: boolean
}

export interface DonutChartWidget extends BaseWidget {
  type: 'donut_chart'
  /** Path to DonutSegment[] in snapshot */
  dataPath: string
  centerLabel?: string
  /** Path to the center value in the snapshot */
  centerValuePath?: string
}

export interface FunnelChartWidget extends BaseWidget {
  type: 'funnel_chart'
  /** Path to FunnelStage[] in snapshot */
  dataPath: string
}

export interface GaugeWidget extends BaseWidget {
  type: 'gauge'
  /** Path to current value in snapshot */
  valuePath: string
  /** Path to goal in snapshot */
  goalPath: string
  higherIsBetter?: boolean
}

export interface TableWidget extends BaseWidget {
  type: 'table'
  dataPath: string
  columns: Array<{
    key: string
    label: string
    align?: 'left' | 'right' | 'center'
    format?: 'currency' | 'number' | 'percent' | 'ratio' | 'text'
    width?: string
  }>
  defaultSortKey?: string
  defaultSortDir?: 'asc' | 'desc'
}

export type Widget =
  | KpiStripWidget
  | LineChartWidget
  | AreaChartWidget
  | BarChartWidget
  | DonutChartWidget
  | FunnelChartWidget
  | GaugeWidget
  | TableWidget

// =============================================================
// TEMPLATE
// =============================================================

export interface DashboardTemplate {
  id: string
  name: string
  scope: ProjectScopeId
  description: string
  widgets: Widget[]
}
