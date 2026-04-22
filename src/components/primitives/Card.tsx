import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'article' | 'section' | 'div'
  /** Aumenta shadow em hover (usar só em cards clicáveis) */
  interactive?: boolean
}

/**
 * Card V2 — borda subtle, shadow-soft em repouso, shadow-elegant em
 * hover quando interactive. Use <CardHead> e <CardBody> para compor.
 */
export function Card({ children, className = '', as = 'article', interactive = false }: CardProps) {
  const Tag = as
  return (
    <Tag
      className={[
        'bg-white border border-neutral-200 rounded-xl shadow-[var(--shadow-soft)]',
        interactive
          ? 'transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)] cursor-pointer'
          : '',
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  )
}

interface CardHeadProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}

export function CardHead({ title, subtitle, actions, className = '' }: CardHeadProps) {
  return (
    <header
      className={[
        'flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-neutral-100',
        className,
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-neutral-900 truncate">{title}</div>
        {subtitle && (
          <div className="text-[11px] text-neutral-500 mt-0.5">{subtitle}</div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}

export function CardBody({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={['p-4', className].join(' ')}>{children}</div>
}
