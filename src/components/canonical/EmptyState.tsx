/**
 * ============================================
 * <EmptyState> — AdFlow v4 canonical component
 * ============================================
 * Beautiful empty state for "nenhum dado ainda" situations.
 * Always prefer this over a blank section or "Sem dados" text.
 *
 * Usage:
 *   <EmptyState
 *     icon={<Inbox size={32} />}
 *     title="Nenhum relatório ainda"
 *     description="Crie seu primeiro relatório para este cliente"
 *     action={<Button>Criar relatório</Button>}
 *   />
 * ============================================
 */

import type { ReactNode } from 'react'

export interface EmptyStateProps {
  /** Icon — typically from lucide-react */
  icon?: ReactNode
  title: string
  description?: string
  /** CTA button */
  action?: ReactNode
  /** Compact variant for smaller containers */
  compact?: boolean
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${compact ? 'py-8 px-4' : 'py-16 px-6'}
        ${className}
      `}
      role="status"
    >
      {icon && (
        <div
          className={`
            flex items-center justify-center
            ${compact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'}
            rounded-full bg-neutral-100 text-neutral-400
          `}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3
        className={`
          ${compact ? 'text-base' : 'text-lg'}
          font-semibold text-neutral-900
        `}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`
            ${compact ? 'text-xs mt-1' : 'text-sm mt-2'}
            text-neutral-500 max-w-md
          `}
        >
          {description}
        </p>
      )}
      {action && <div className={compact ? 'mt-3' : 'mt-5'}>{action}</div>}
    </div>
  )
}
