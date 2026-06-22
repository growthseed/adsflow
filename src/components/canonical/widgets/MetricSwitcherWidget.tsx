/**
 * <MetricSwitcherWidget> — KPI card grande com dropdown pra trocar a métrica.
 *
 * Inspirado no padrão "Métricas Principais" / "Métricas Secundárias" do
 * Power BI Mídia Hub V4, onde uma calc table com SWITCH troca a medida
 * exibida no card hero.
 *
 * Recebe lista de métricas disponíveis (cada uma referencia uma kpi do
 * snapshot.kpis dict). Estado interno controla qual está selecionada.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { KPICard } from '../KPICard'
import type { ClientDashboardSnapshot, SnapshotKPI } from '@/types/clientDashboardSnapshot'
import type { KPI } from '@/types/metrics'

export interface MetricSwitcherWidgetProps {
  title?: string
  snapshot: ClientDashboardSnapshot
  availableMetrics: Array<{
    key: string
    label: string
    icon?: string
  }>
  defaultMetricKey: string
  variant?: 'hero' | 'compact'
}

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

export default function MetricSwitcherWidget({
  title,
  snapshot,
  availableMetrics,
  defaultMetricKey,
  variant = 'hero',
}: MetricSwitcherWidgetProps) {
  const [selectedKey, setSelectedKey] = useState(defaultMetricKey)
  const [open, setOpen] = useState(false)

  const selectedMeta = availableMetrics.find((m) => m.key === selectedKey) ?? availableMetrics[0]
  const kpi = snapshot.kpis?.[selectedKey]

  return (
    <div className="relative">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            {title}
          </span>
        </div>
      )}
      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-alt)] rounded-md hover:bg-[var(--surface-hover)] mb-2"
      >
        {selectedMeta?.icon && <span>{selectedMeta.icon}</span>}
        <span>{selectedMeta?.label ?? selectedKey}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-12 z-20 bg-white rounded-lg shadow-lg border border-[var(--border-subtle)] py-1 min-w-[180px]">
          {availableMetrics.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setSelectedKey(m.key)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--surface-alt)] ${
                m.key === selectedKey ? 'font-semibold text-[var(--primary)]' : ''
              }`}
            >
              {m.icon && <span className="mr-2">{m.icon}</span>}
              {m.label}
            </button>
          ))}
        </div>
      )}
      {/* KPI Card */}
      {kpi ? (
        <KPICard
          kpi={toKpiCardShape(kpi)}
          size={variant === 'hero' ? 'lg' : 'md'}
          variant={variant === 'hero' ? 'primary' : 'default'}
          showSparkline
          showGoal
        />
      ) : (
        <div className="p-4 text-center text-xs text-[var(--text-tertiary)] border border-dashed border-[var(--border-subtle)] rounded-lg">
          Métrica "{selectedMeta?.label}" não disponível no snapshot
        </div>
      )}
    </div>
  )
}
