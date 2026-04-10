/**
 * ============================================
 * <WidgetRenderer> — template-driven dashboard engine
 * ============================================
 * Reads a DashboardTemplate + ClientDashboardSnapshot and renders
 * the right canonical widget for each template entry. Handles:
 *
 *   - Grid layout (colSpan 1-12, responsive)
 *   - dataPath resolution (e.g. 'timeseries.daily' → snapshot.timeseries.daily)
 *   - Empty state when data is missing
 *   - Value formatting per KPI unit
 *
 * Usage:
 *   <WidgetRenderer template={tpl} snapshot={snap} />
 * ============================================
 */

import type { ReactNode } from 'react'
import type {
  DashboardTemplate,
  Widget,
  KpiStripWidget,
  LineChartWidget as LineChartSpec,
  AreaChartWidget as AreaChartSpec,
  BarChartWidget as BarChartSpec,
  DonutChartWidget as DonutChartSpec,
  FunnelChartWidget as FunnelChartSpec,
  GaugeWidget as GaugeSpec,
  TableWidget as TableSpec,
} from '@/types/dashboardTemplate'
import type { ClientDashboardSnapshot, SnapshotKPI } from '@/types/clientDashboardSnapshot'
import type { KPI } from '@/types/metrics'

import { KPICard } from '../KPICard'
import {
  LineChartWidget,
  AreaChartWidget,
  BarChartWidget,
  DonutChartWidget,
  FunnelChartWidget,
  GaugeWidget,
  TableWidget,
} from './'
import { ChartCard } from '../ChartCard'

// =============================================================
// HELPERS
// =============================================================

/** Resolve a dot-separated dataPath against an object, returns undefined if missing */
function resolvePath(obj: unknown, path: string): unknown {
  if (!path) return obj
  const parts = path.split('.')
  let cursor: unknown = obj
  for (const p of parts) {
    if (cursor == null) return undefined
    cursor = (cursor as Record<string, unknown>)[p]
  }
  return cursor
}

function formatValueByUnit(
  unit: SnapshotKPI['unit'],
  value: number,
  currency = 'BRL',
): string {
  switch (unit) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${(value * 100).toFixed(1).replace('.', ',')}%`
    case 'ratio':
      return `${value.toFixed(2).replace('.', ',')}x`
    case 'number':
    default:
      return value.toLocaleString('pt-BR')
  }
}

function formatCell(
  value: unknown,
  format: 'currency' | 'number' | 'percent' | 'ratio' | 'text' = 'text',
): ReactNode {
  if (value == null || value === '') return '—'
  if (format === 'text') return String(value)
  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return String(value)
  return formatValueByUnit(format as SnapshotKPI['unit'], n)
}

/**
 * Convert a SnapshotKPI into the KPI shape the canonical KPICard expects.
 * The fields line up almost 1:1 but canonical KPI also wants `description`
 * and a specific improvement_direction enum.
 */
function toKpiCardShape(s: SnapshotKPI): KPI {
  return {
    key: s.key,
    label: s.label,
    value: s.value,
    previous_value: s.previous_value,
    delta_percent: s.delta_percent,
    trend: s.trend ?? 'flat',
    improvement_direction: s.improvement_direction ?? 'higher_better',
    unit: s.unit,
    currency: s.currency,
    goal: s.goal,
    sparkline: s.sparkline,
    source: 'blended',
    description: s.description,
  }
}

// =============================================================
// GRID MAP
// =============================================================
// Tailwind needs static class names to purge correctly. Pre-enumerate
// the colSpan → className mapping.

const COL_SPAN_CLASS: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
}

// =============================================================
// INDIVIDUAL WIDGET RENDERERS
// =============================================================

function renderKpiStrip(spec: KpiStripWidget, snapshot: ClientDashboardSnapshot) {
  const kpis = spec.kpiKeys.map((k) => snapshot.kpis[k]).filter(Boolean)
  if (kpis.length === 0) {
    return (
      <ChartCard title={spec.title} height={100} empty emptyMessage="Sem KPIs disponíveis" />
    )
  }

  return (
    <div className="space-y-3">
      {spec.title && (
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {spec.title}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <KPICard
            key={k.key}
            kpi={toKpiCardShape(k)}
            size={spec.hero && i === 0 ? 'lg' : 'md'}
            showSparkline
            showGoal
          />
        ))}
      </div>
    </div>
  )
}

function renderLineChart(spec: LineChartSpec, snapshot: ClientDashboardSnapshot) {
  const data = resolvePath(snapshot, spec.dataPath) as LineChartSpec['series'] | undefined
  return (
    <LineChartWidget
      title={spec.title}
      subtitle={spec.subtitle}
      data={(data as unknown as Array<Record<string, number | string>>) ?? []}
      xKey={spec.xKey}
      series={spec.series}
      formatY={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
    />
  )
}

function renderAreaChart(spec: AreaChartSpec, snapshot: ClientDashboardSnapshot) {
  const data = resolvePath(snapshot, spec.dataPath)
  return (
    <AreaChartWidget
      title={spec.title}
      subtitle={spec.subtitle}
      data={(data as Array<Record<string, number | string>>) ?? []}
      xKey={spec.xKey}
      series={spec.series}
      stacked={spec.stacked}
      formatY={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
    />
  )
}

function renderBarChart(spec: BarChartSpec, snapshot: ClientDashboardSnapshot) {
  const data = resolvePath(snapshot, spec.dataPath)
  return (
    <BarChartWidget
      title={spec.title}
      subtitle={spec.subtitle}
      data={(data as Array<Record<string, number | string>>) ?? []}
      categoryKey={spec.categoryKey}
      series={spec.series}
      horizontal={spec.horizontal}
      rainbow={spec.rainbow}
      formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
    />
  )
}

function renderDonutChart(spec: DonutChartSpec, snapshot: ClientDashboardSnapshot) {
  const data = resolvePath(snapshot, spec.dataPath)
  const centerValue = spec.centerValuePath
    ? (resolvePath(snapshot, spec.centerValuePath) as string | undefined)
    : undefined
  return (
    <DonutChartWidget
      title={spec.title}
      subtitle={spec.subtitle}
      data={
        (data as Array<{ label: string; value: number; color: string }>) ?? []
      }
      centerLabel={spec.centerLabel}
      centerValue={centerValue}
    />
  )
}

function renderFunnelChart(spec: FunnelChartSpec, snapshot: ClientDashboardSnapshot) {
  const stages = resolvePath(snapshot, spec.dataPath)
  return (
    <FunnelChartWidget
      title={spec.title}
      subtitle={spec.subtitle}
      stages={
        (stages as Array<{ label: string; value: number; color?: string }>) ?? []
      }
    />
  )
}

function renderGauge(spec: GaugeSpec, snapshot: ClientDashboardSnapshot) {
  const value = (resolvePath(snapshot, spec.valuePath) as number) ?? 0
  const goal = (resolvePath(snapshot, spec.goalPath) as number) ?? 0
  return (
    <GaugeWidget
      title={spec.title}
      subtitle={spec.subtitle}
      value={value}
      goal={goal}
      valueLabel={value >= 10 ? value.toFixed(1) : value.toFixed(2)}
      goalLabel={goal >= 10 ? goal.toFixed(0) : goal.toFixed(1)}
      higherIsBetter={spec.higherIsBetter ?? true}
    />
  )
}

function renderTable(spec: TableSpec, snapshot: ClientDashboardSnapshot) {
  const rows = resolvePath(snapshot, spec.dataPath)
  const columns = spec.columns.map((c) => ({
    key: c.key,
    label: c.label,
    align: c.align,
    width: c.width,
    render: (row: Record<string, unknown>) => formatCell(row[c.key], c.format),
  }))
  return (
    <TableWidget
      title={spec.title}
      subtitle={spec.subtitle}
      columns={columns}
      rows={(rows as Array<Record<string, unknown>>) ?? []}
      defaultSortKey={spec.defaultSortKey}
      defaultSortDir={spec.defaultSortDir}
    />
  )
}

// =============================================================
// MAIN RENDERER
// =============================================================

interface WidgetRendererProps {
  template: DashboardTemplate
  snapshot: ClientDashboardSnapshot
}

export default function WidgetRenderer({ template, snapshot }: WidgetRendererProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {template.widgets.map((widget) => (
        <div
          key={widget.id}
          className={`col-span-1 ${COL_SPAN_CLASS[widget.colSpan ?? 6] ?? 'lg:col-span-6'}`}
        >
          {renderWidget(widget, snapshot)}
        </div>
      ))}
    </div>
  )
}

function renderWidget(widget: Widget, snapshot: ClientDashboardSnapshot): ReactNode {
  switch (widget.type) {
    case 'kpi_strip':
      return renderKpiStrip(widget, snapshot)
    case 'line_chart':
      return renderLineChart(widget, snapshot)
    case 'area_chart':
      return renderAreaChart(widget, snapshot)
    case 'bar_chart':
      return renderBarChart(widget, snapshot)
    case 'donut_chart':
      return renderDonutChart(widget, snapshot)
    case 'funnel_chart':
      return renderFunnelChart(widget, snapshot)
    case 'gauge':
      return renderGauge(widget, snapshot)
    case 'table':
      return renderTable(widget, snapshot)
    default:
      return null
  }
}
