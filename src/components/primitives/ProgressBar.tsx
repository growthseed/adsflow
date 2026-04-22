export type ProgressTone = 'brand' | 'success' | 'warning' | 'error' | 'info'

interface ProgressBarProps {
  value: number // 0–100
  tone?: ProgressTone
  /** Marker opcional (0–100) — ex.: ideal pacing vs. atual */
  marker?: number
  className?: string
  ariaLabel?: string
}

const toneClasses: Record<ProgressTone, string> = {
  brand:   'bg-brand-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error:   'bg-error-500',
  info:    'bg-info-500',
}

/**
 * ProgressBar — track neutro + fill com tom semântico. Opcionalmente
 * aceita um marker vertical (pacing ideal vs atual).
 */
export function ProgressBar({
  value,
  tone = 'brand',
  marker,
  className = '',
  ariaLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const markerPos = marker != null ? Math.max(0, Math.min(100, marker)) : null

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden ${className}`}
    >
      <div
        className={`h-full ${toneClasses[tone]} rounded-full transition-[width] duration-[var(--duration-normal)] ease-out`}
        style={{ width: `${clamped}%` }}
      />
      {markerPos != null && (
        <span
          aria-hidden
          className="absolute top-[-2px] h-[10px] w-0.5 bg-neutral-700 rounded-full"
          style={{ left: `${markerPos}%` }}
        />
      )}
    </div>
  )
}
