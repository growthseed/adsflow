/**
 * ============================================
 * <ChartCard> — AdFlow v4 canonical component
 * ============================================
 * Consistent wrapper around any chart. Provides title, subtitle,
 * action slot, loading/empty states, and a standard card chrome.
 *
 * The actual chart goes in `children` — use recharts, visx, or any
 * library, but wrap it in this card for visual consistency.
 *
 * Usage:
 *   <ChartCard title="Evolução das métricas" subtitle="últimos 30 dias">
 *     <ResponsiveContainer><LineChart ... /></ResponsiveContainer>
 *   </ChartCard>
 * ============================================
 */

import type { ReactNode } from 'react'

export interface ChartCardProps {
  title: string
  subtitle?: string
  /** Right-aligned actions (buttons, filters, etc) */
  actions?: ReactNode
  /** Footer note / disclaimer */
  footnote?: ReactNode
  /** Loading state */
  loading?: boolean
  /** Empty state when no data */
  empty?: boolean
  emptyMessage?: string
  /** Card contents — typically a chart. Optional when loading or empty. */
  children?: ReactNode
  /** Height for the chart area (px) */
  height?: number
  className?: string
}

export function ChartCard({
  title,
  subtitle,
  actions,
  footnote,
  loading = false,
  empty = false,
  emptyMessage = 'Sem dados no período selecionado',
  children,
  height = 280,
  className = '',
}: ChartCardProps) {
  return (
    <div
      className={`
        bg-[var(--surface-card)]
        border border-[var(--border-subtle)]
        rounded-xl overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-[var(--border-subtle)]">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-neutral-900 leading-snug truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>

      {/* Body — explicit width:100% prevents ResponsiveContainer from computing
          -1 during the first paint when flex children don't have resolved widths */}
      <div className="p-4">
        {loading ? (
          <div
            className="w-full flex items-center justify-center animate-pulse"
            style={{ height }}
          >
            <div className="w-full h-full bg-neutral-100 rounded-lg" />
          </div>
        ) : empty ? (
          <div
            className="w-full flex flex-col items-center justify-center text-neutral-400"
            style={{ height }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-2 opacity-60"
            >
              <path d="M3 3v18h18" />
              <path d="M7 14l4-4 4 4 6-6" />
            </svg>
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div style={{ width: '100%', height, minWidth: 0 }}>{children}</div>
        )}
      </div>

      {/* Footer note */}
      {footnote && (
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
          <p className="text-xs text-neutral-500">{footnote}</p>
        </div>
      )}
    </div>
  )
}
