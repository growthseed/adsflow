import type { ReactNode } from 'react'

export type PillTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

interface PillProps {
  tone?: PillTone
  children: ReactNode
  className?: string
  dot?: boolean
}

const toneClasses: Record<PillTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  brand:   'bg-brand-50 text-brand-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  error:   'bg-error-100 text-error-700',
  info:    'bg-info-100 text-info-700',
}

/**
 * Pill — label compacto sem borda, com tom semântico.
 * Handoff V2: 11px, font-weight 600, radius 999px. Borderless
 * (Badge legado é bordered; use Pill para tudo V2+).
 */
export function Pill({ tone = 'neutral', children, className = '', dot = false }: PillProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
