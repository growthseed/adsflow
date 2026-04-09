interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'bordered' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

interface CardHeaderProps {
  icon?: React.ReactNode
  iconColor?: string
  iconBg?: string
  title: string
  subtitle?: string
  badge?: React.ReactNode
  action?: React.ReactNode
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-white border border-slate-200 rounded-xl',
  elevated: 'bg-white rounded-xl shadow-md',
  bordered: 'bg-white border-2 border-slate-200 rounded-xl',
  interactive:
    'bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-slate-300 transition-all cursor-pointer',
}

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

function Card({ children, variant = 'default', padding = 'md', className = '' }: CardProps) {
  return (
    <div
      className={[variantStyles[variant], paddingStyles[padding], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

function CardHeader({
  icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  title,
  subtitle,
  badge,
  action,
}: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div
            className={[
              'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
              iconBg,
              iconColor,
            ].join(' ')}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={[
        'flex items-center gap-3 pt-4 mt-4 border-t border-slate-100',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardFooter }
export type { CardProps, CardHeaderProps, CardFooterProps }
