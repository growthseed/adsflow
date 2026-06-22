/**
 * <GoalRingWidget> — Anel circular (Apple Watch style).
 * Mostra o atingimento de uma meta como anel preenchido,
 * com valor no centro e legenda abaixo.
 */

export interface GoalRingProps {
  label: string
  current: number
  target: number
  /** Função pra formatar o valor central (ex: (v) => `R$ ${v.toFixed(0)}`) */
  format?: (v: number) => string
  /** Cor base do anel (vai escurecer/clarear conforme % atingida) */
  color?: string
  /** Tamanho em px (default 140) */
  size?: number
  /** Spessura do anel (default 12) */
  thickness?: number
  /** Higher is better. Default true. Para CPL/CAC, passar false. */
  higherIsBetter?: boolean
  /** Subtexto abaixo da legenda (ex: "Meta: R$ 100k") */
  subText?: string
}

export default function GoalRingWidget({
  label,
  current,
  target,
  format,
  color,
  size = 140,
  thickness = 12,
  higherIsBetter = true,
  subText,
}: GoalRingProps) {
  const ratio = target > 0 ? current / target : 0
  const clamped = Math.min(Math.max(ratio, 0), 1.5)
  const pctDisplay = Math.round(ratio * 100)

  // Cor dinâmica
  const status: 'green' | 'yellow' | 'orange' | 'red' = (() => {
    if (higherIsBetter) {
      if (ratio >= 1) return 'green'
      if (ratio >= 0.8) return 'yellow'
      if (ratio >= 0.5) return 'orange'
      return 'red'
    } else {
      if (ratio <= 1) return 'green'
      if (ratio <= 1.2) return 'yellow'
      if (ratio <= 1.5) return 'orange'
      return 'red'
    }
  })()

  const colorMap = {
    green: '#10b981',
    yellow: '#f59e0b',
    orange: '#f97316',
    red: '#ef4444',
  }
  const ringColor = color || colorMap[status]

  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(clamped, 1))
  const center = size / 2

  const formatted = format ? format(current) : current.toLocaleString('pt-BR')

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={thickness}
          />
          {/* Progress */}
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
          />
          {/* Overflow indicator (>100%) */}
          {clamped > 1 && (
            <circle
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke={ringColor}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - (clamped - 1))}
              opacity={0.35}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{pctDisplay}%</span>
          <span className="text-[11px] text-slate-500 mt-0.5">atingido</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 tabular-nums">{formatted}</p>
        {subText && <p className="text-[10px] text-slate-400 mt-0.5">{subText}</p>}
      </div>
    </div>
  )
}
