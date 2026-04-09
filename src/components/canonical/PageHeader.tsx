/**
 * ============================================
 * <PageHeader> — AdFlow v4 canonical component
 * ============================================
 * Consistent top section for every page. Title + subtitle +
 * breadcrumbs + action slot. Use on every route to enforce
 * the same visual rhythm across the app.
 *
 * Usage:
 *   <PageHeader
 *     title="Visão Geral"
 *     subtitle="Escola Pequeno Aprendiz"
 *     breadcrumbs={[
 *       { label: 'Clientes', href: '/clientes' },
 *       { label: 'Escola Pequeno Aprendiz' },
 *     ]}
 *     actions={<Button>Ação</Button>}
 *   />
 * ============================================
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface Breadcrumb {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  /** Right-aligned actions */
  actions?: ReactNode
  /** Optional avatar/icon to the left of the title */
  leading?: ReactNode
  /** Render without border-bottom */
  borderless?: boolean
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  leading,
  borderless = false,
  className = '',
}: PageHeaderProps) {
  return (
    <header
      className={`
        ${borderless ? '' : 'border-b border-[var(--border-subtle)]'}
        bg-[var(--surface-card)]
        px-4 sm:px-6 py-4
        ${className}
      `}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1.5 text-xs text-neutral-500">
            {breadcrumbs.map((bc, i) => {
              const isLast = i === breadcrumbs.length - 1
              return (
                <li key={`${bc.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-50"
                      aria-hidden="true"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                  {bc.href && !isLast ? (
                    <Link
                      to={bc.href}
                      className="hover:text-brand-600 transition-colors"
                    >
                      {bc.label}
                    </Link>
                  ) : (
                    <span
                      className={isLast ? 'text-neutral-900 font-medium' : ''}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {bc.label}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-center gap-3 sm:gap-4">
        {leading && <div className="flex-shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-neutral-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
