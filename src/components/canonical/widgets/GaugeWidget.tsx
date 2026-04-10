/**
 * <GaugeWidget> — Half-circle gauge showing progress to goal.
 * Used for "ROAS atual vs meta", "Orçamento consumido", etc.
 */

import { ChartCard } from '../ChartCard'

export interface GaugeWidgetProps {
  title: string
  subtitle?: string
  value: number
  goal: number
  /** Displayed in center — human-formatted */
  valueLabel: string
  goalLabel: string
  /** Higher is better. If false, lower is better (reverses color logic). */
  higherIsBetter?: boolean
  height?: number
}

export default function GaugeWidget({
  title,
  subtitle,
  value,
  goal,
  valueLabel,
  goalLabel,
  higherIsBetter = true,
  height = 240,
}: GaugeWidgetProps) {
  const ratio = goal > 0 ? Math.min(value / goal, 1.5) : 0
  const clamped = Math.min(ratio, 1)
  const angle = clamped * 180 // half circle 0-180

  // Color logic
  const onTrack = higherIsBetter ? ratio >= 1 : ratio <= 1
  const almostThere = higherIsBetter ? ratio >= 0.7 : ratio <= 1.3
  const color = onTrack
    ? '#10b981'
    : almostThere
      ? '#f59e0b'
      : '#ef4444'

  // Derive arc path
  const r = 80
  const cx = 110
  const cy = 100
  const rad = (angle * Math.PI) / 180
  const endX = cx - r * Math.cos(rad)
  const endY = cy - r * Math.sin(rad)
  const largeArc = angle > 180 ? 1 : 0

  const arcPath =
    ratio <= 0
      ? ''
      : `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`

  return (
    <ChartCard title={title} subtitle={subtitle} height={height}>
      <div className="h-full flex flex-col items-center justify-center">
        <svg viewBox="0 0 220 130" className="w-full max-w-xs">
          {/* Background arc */}
          <path
            d={`M 30 100 A 80 80 0 0 1 190 100`}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Value arc */}
          {arcPath && (
            <path
              d={arcPath}
              fill="none"
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
            />
          )}
          {/* Center text */}
          <text
            x="110"
            y="90"
            textAnchor="middle"
            className="fill-slate-900"
            style={{ fontSize: 26, fontWeight: 700 }}
          >
            {valueLabel}
          </text>
          <text
            x="110"
            y="112"
            textAnchor="middle"
            className="fill-slate-500"
            style={{ fontSize: 11 }}
          >
            Meta {goalLabel}
          </text>
        </svg>

        <div className="flex items-center gap-2 mt-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-slate-600">
            {onTrack
              ? 'Meta atingida'
              : almostThere
                ? `${Math.round(ratio * 100)}% da meta`
                : `${Math.round(ratio * 100)}% da meta`}
          </span>
        </div>
      </div>
    </ChartCard>
  )
}
