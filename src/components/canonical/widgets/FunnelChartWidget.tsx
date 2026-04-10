/**
 * <FunnelChartWidget> — Sales/conversion funnel.
 * Pure CSS implementation (no Recharts funnel — their version is ugly).
 * Each stage is a horizontal bar whose width shrinks based on the
 * previous stage count; conversion rate is shown between stages.
 *
 * This is the centerpiece widget for Leads/B2B and Sales nichos.
 */

import { ChartCard } from '../ChartCard'

export interface FunnelStage {
  label: string
  value: number
  color?: string
}

export interface FunnelChartWidgetProps {
  title: string
  subtitle?: string
  stages: FunnelStage[]
  height?: number
  /** How to format each stage's numeric value */
  formatValue?: (value: number) => string
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
]

export default function FunnelChartWidget({
  title,
  subtitle,
  stages,
  height = 320,
  formatValue,
}: FunnelChartWidgetProps) {
  const isEmpty = !stages || stages.length === 0
  const maxValue = isEmpty ? 0 : Math.max(...stages.map((s) => s.value))
  const fmt = formatValue || ((v: number) => v.toLocaleString('pt-BR'))

  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={isEmpty}>
      {!isEmpty && (
        <div className="h-full flex flex-col justify-center gap-1">
          {stages.map((stage, i) => {
            const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
            const color = stage.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
            const prev = i > 0 ? stages[i - 1].value : null
            const conversionRate =
              prev && prev > 0 ? (stage.value / prev) * 100 : null

            return (
              <div key={stage.label} className="relative">
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-medium text-slate-700">{stage.label}</span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {fmt(stage.value)}
                  </span>
                </div>
                <div className="relative h-7 bg-slate-50 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${width}%`,
                      backgroundColor: color,
                      opacity: 0.85,
                    }}
                  >
                    {width > 25 && (
                      <span className="text-[10px] text-white font-semibold">
                        {Math.round(width)}%
                      </span>
                    )}
                  </div>
                </div>
                {conversionRate !== null && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 pl-2">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    {conversionRate.toFixed(1)}% de conversão da etapa anterior
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </ChartCard>
  )
}
