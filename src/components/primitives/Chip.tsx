import type { ReactNode } from 'react'

type Tone = 'default' | 'active' | 'urgent' | 'warning' | 'success'

interface ChipProps {
  tone?: Tone
  leading?: ReactNode
  onClick?: () => void
  children: ReactNode
  className?: string
}

const toneClasses: Record<Tone, string> = {
  default: 'bg-white border-neutral-200 text-neutral-700 hover:border-brand-500 hover:text-brand-700',
  active:  'bg-brand-50 border-brand-100 text-brand-700',
  urgent:  'bg-error-50 border-error-100 text-error-700',
  warning: 'bg-warning-50 border-warning-100 text-warning-700',
  success: 'bg-success-50 border-success-100 text-success-700',
}

/**
 * Chip — filtro/tag clicável. Cores semânticas para destaque de estado
 * (urgent, warning) ou seleção (active).
 */
export function Chip({ tone = 'default', leading, onClick, children, className = '' }: ChipProps) {
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors',
        toneClasses[tone],
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {leading}
      {children}
    </Tag>
  )
}
