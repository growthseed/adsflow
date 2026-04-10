/**
 * ============================================
 * <KPICard> — AdFlow v4 canonical component
 * ============================================
 * Single-metric scorecard with value, delta, goal, sparkline.
 * This is THE unit of the Performance module. Every KPI rendered
 * anywhere in the app must use this component — never custom.
 *
 * Usage:
 *   <KPICard kpi={kpi} />
 *   <KPICard kpi={kpi} size="lg" showSparkline />
 *   <KPICard kpi={kpi} onClick={() => drilldown()} />
 * ============================================
 */

import { useState } from 'react'
import type { KPI } from '@/types/metrics'
import { isGoodTrend } from '@/types/metrics'
import { formatMetric, formatDelta } from '@/lib/formatMetric'
import { BrandLogo } from './BrandLogo'

export interface KPICardProps {
  kpi: KPI
  /** Size variant affects typography and padding */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Show sparkline below value (if sparkline data is present) */
  showSparkline?: boolean
  /** Show goal progress bar */
  showGoal?: boolean
  /** Show brand logo of the source */
  showSource?: boolean
  /** Click handler — card becomes clickable (cursor pointer + hover) */
  onClick?: () => void
  /** Additional className */
  className?: string
  /** Compact number formatting (1.2K instead of 1,200) */
  compact?: boolean
  /** Loading state */
  loading?: boolean
  /** Editable goal mode — when provided, shows an editable goal field below the value */
  editableGoal?: {
    /** Current goal value from the DB (undefined = no goal set yet) */
    value: number | undefined
    /** 'meta' = hard target, 'expectativa' = soft benchmark */
    type: 'meta' | 'expectativa'
    /** Called when the user saves a new goal value */
    onSave: (newValue: number) => void
  }
}

const SIZE_CLASSES = {
  sm: {
    wrapper: 'p-3',
    label: 'text-xs',
    value: 'text-xl',
    delta: 'text-xs',
    sparkHeight: 24,
  },
  md: {
    wrapper: 'p-4',
    label: 'text-sm',
    value: 'text-2xl',
    delta: 'text-sm',
    sparkHeight: 32,
  },
  lg: {
    wrapper: 'p-5',
    label: 'text-sm',
    value: 'text-3xl',
    delta: 'text-sm',
    sparkHeight: 40,
  },
  xl: {
    wrapper: 'p-6',
    label: 'text-base',
    value: 'text-4xl',
    delta: 'text-base',
    sparkHeight: 48,
  },
} as const

export function KPICard({
  kpi,
  size = 'md',
  showSparkline = true,
  showGoal = true,
  showSource = false,
  onClick,
  className = '',
  compact = false,
  editableGoal,
  loading = false,
}: KPICardProps) {
  const sizes = SIZE_CLASSES[size]
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  // Effective goal: editableGoal overrides kpi.goal
  const effectiveGoal = editableGoal?.value ?? kpi.goal

  if (loading) {
    return (
      <div
        className={`
          bg-[var(--surface-card)]
          border border-[var(--border-subtle)]
          rounded-xl ${sizes.wrapper}
          animate-pulse
          ${className}
        `}
      >
        <div className="h-3 bg-neutral-200 rounded w-20 mb-3" />
        <div className="h-8 bg-neutral-200 rounded w-24 mb-2" />
        <div className="h-3 bg-neutral-200 rounded w-16" />
      </div>
    )
  }

  const good = isGoodTrend(kpi.trend || 'flat', kpi.improvement_direction)
  const deltaColor =
    good === null
      ? 'text-neutral-500'
      : good
        ? 'text-success-600'
        : 'text-error-600'

  const goalProgress =
    effectiveGoal && effectiveGoal > 0 ? Math.min(1.5, kpi.value / effectiveGoal) : null

  return (
    <div
      className={`
        bg-[var(--surface-card)]
        border border-[var(--border-subtle)]
        rounded-xl ${sizes.wrapper}
        transition-all duration-fast
        ${onClick ? 'cursor-pointer hover:border-brand-300 hover:shadow-md' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header: label + optional source logo */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p
            className={`
              ${sizes.label}
              font-medium text-neutral-600 truncate
            `}
            title={kpi.description || kpi.label}
          >
            {kpi.label}
          </p>
        </div>
        {showSource && kpi.source && kpi.source !== 'manual' && kpi.source !== 'blended' && (
          <BrandLogo brand={kpi.source} size={16} className="flex-shrink-0 opacity-60" />
        )}
      </div>

      {/* Primary value */}
      <p
        className={`
          ${sizes.value}
          font-semibold text-neutral-900 tabular-nums leading-tight
        `}
      >
        {formatMetric(kpi.value, kpi.unit, {
          currency: kpi.currency,
          compact,
        })}
      </p>

      {/* Delta */}
      {kpi.delta_percent !== undefined && (
        <p className={`${sizes.delta} ${deltaColor} font-medium mt-1 tabular-nums`}>
          {formatDelta(kpi.delta_percent)}
          {kpi.previous_value !== undefined && (
            <span className="text-neutral-400 font-normal ml-1">
              vs{' '}
              {formatMetric(kpi.previous_value, kpi.unit, {
                currency: kpi.currency,
                compact,
              })}
            </span>
          )}
        </p>
      )}

      {/* Goal progress — shows editable goal when editableGoal prop is passed */}
      {showGoal && (goalProgress !== null || editableGoal) && (
        <div className="mt-3">
          {/* Progress bar */}
          {goalProgress !== null && (
            <div className="mb-2">
              <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full transition-all duration-normal
                    ${goalProgress >= 1 ? 'bg-success-500' : goalProgress >= 0.7 ? 'bg-brand-500' : 'bg-warning-500'}
                  `}
                  style={{ width: `${Math.min(goalProgress, 1) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Goal label + value (editable when editableGoal is provided) */}
          <div className="flex justify-between items-center text-2xs">
            <span className="text-neutral-500">
              {editableGoal?.type === 'expectativa' ? 'Expectativa' : 'Meta'}
            </span>

            {editableGoal ? (
              editingGoal ? (
                <form
                  className="flex items-center gap-1"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const num = Number(goalInput.replace(',', '.'))
                    if (!isNaN(num) && num > 0) {
                      editableGoal.onSave(num)
                    }
                    setEditingGoal(false)
                  }}
                >
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    autoFocus
                    onBlur={() => setEditingGoal(false)}
                    className="w-16 px-1.5 py-0.5 text-2xs tabular-nums border border-brand-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="0"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setGoalInput(String(editableGoal.value ?? ''))
                    setEditingGoal(true)
                  }}
                  className="tabular-nums text-neutral-600 hover:text-brand-700 hover:bg-brand-50 px-1.5 py-0.5 -mr-1.5 rounded transition-colors cursor-pointer"
                  title="Clique para editar a meta"
                >
                  {editableGoal.value != null
                    ? formatMetric(editableGoal.value, kpi.unit, { currency: kpi.currency, compact })
                    : 'Definir'}
                  <span className="ml-1 text-neutral-400">✎</span>
                </button>
              )
            ) : effectiveGoal ? (
              <span className="tabular-nums text-neutral-500">
                {formatMetric(effectiveGoal, kpi.unit, { currency: kpi.currency, compact })}
              </span>
            ) : null}
          </div>

          {/* Achievement label */}
          {goalProgress !== null && (
            <div className={`text-2xs mt-1 font-medium ${
              goalProgress >= 1 ? 'text-success-600' : goalProgress >= 0.7 ? 'text-brand-600' : 'text-warning-600'
            }`}>
              {goalProgress >= 1
                ? `Meta atingida (${Math.round(goalProgress * 100)}%)`
                : `${Math.round(goalProgress * 100)}% da meta`}
            </div>
          )}
        </div>
      )}

      {/* Sparkline */}
      {showSparkline && kpi.sparkline && kpi.sparkline.length > 1 && (
        <div className="mt-3 -mx-1">
          <Sparkline
            data={kpi.sparkline}
            height={sizes.sparkHeight}
            positive={good !== false}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Minimal SVG sparkline — no external library.
 * Smoothed with cubic bezier, subtle gradient fill.
 */
function Sparkline({
  data,
  height,
  positive,
}: {
  data: number[]
  height: number
  positive: boolean
}) {
  if (data.length < 2) return null

  const width = 100 // use viewBox units, scale to container
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return { x, y }
  })

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = points[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
  }, '')

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`

  const strokeColor = positive ? 'var(--color-success-600)' : 'var(--color-error-600)'
  const fillColor = positive
    ? 'var(--color-success-100)'
    : 'var(--color-error-100)'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className="overflow-visible"
      aria-hidden="true"
    >
      <path d={areaD} fill={fillColor} opacity={0.4} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
