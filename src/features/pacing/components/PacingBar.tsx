interface Props {
  /** Spend percentage 0-100 */
  actualPct: number
  /** Ideal linear percentage (today / total days) 0-100 */
  idealPct: number
  /** Cor semântica da barra atual */
  tone: 'success' | 'warning' | 'error'
  className?: string
}

const fillTone = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
}

/**
 * PacingBar — barra com fill do gasto atual + marker vertical do
 * ideal linear. Handoff V2: "actual + ideal marker".
 */
export function PacingBar({ actualPct, idealPct, tone, className = '' }: Props) {
  const actual = Math.max(0, Math.min(100, actualPct))
  const ideal = Math.max(0, Math.min(100, idealPct))
  return (
    <div
      className={`relative h-2 w-full bg-neutral-100 rounded-full overflow-visible ${className}`}
    >
      <div
        className={`h-full rounded-full ${fillTone[tone]} transition-[width]`}
        style={{ width: `${actual}%` }}
      />
      <span
        aria-hidden
        className="absolute -top-1 h-4 w-0.5 bg-neutral-700 rounded-full"
        style={{ left: `${ideal}%` }}
      />
    </div>
  )
}
