/**
 * ============================================
 * METRIC FORMATTING — AdFlow v4
 * ============================================
 * Consistent display formatting for every metric across the app.
 * Always route values through formatMetric() — never hand-format
 * currency/percent/etc in components.
 * ============================================
 */

import type { MetricUnit } from '@/types/metrics'

const locale = 'pt-BR'

/**
 * Format a numeric value for display using the given unit.
 * Handles edge cases: null/undefined, infinity, NaN.
 */
export function formatMetric(
  value: number | null | undefined,
  unit: MetricUnit,
  options: {
    currency?: string
    compact?: boolean
    decimals?: number
  } = {},
): string {
  if (value === null || value === undefined) return '—'
  if (Number.isNaN(value)) return '—'
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞'

  const { currency = 'BRL', compact = false, decimals } = options

  switch (unit) {
    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals ?? 2,
        maximumFractionDigits: decimals ?? 2,
        notation: compact ? 'compact' : 'standard',
      }).format(value)

    case 'percent':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals ?? 1,
        maximumFractionDigits: decimals ?? 2,
      }).format(value > 1 ? value / 100 : value)

    case 'number':
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals ?? 0,
        notation: compact ? 'compact' : 'standard',
      }).format(value)

    case 'duration': {
      const totalSeconds = Math.round(value)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      if (hours > 0) return `${hours}h ${minutes}m`
      if (minutes > 0) return `${minutes}m ${seconds}s`
      return `${seconds}s`
    }

    case 'ratio':
      return `${value.toFixed(decimals ?? 2)}x`

    case 'score':
      return `${value.toFixed(decimals ?? 1)}`

    default:
      return String(value)
  }
}

/**
 * Format a delta percent for display (e.g., 0.08 → "+8,0%").
 * Returns signed string with arrow indicator.
 */
export function formatDelta(
  deltaPercent: number | null | undefined,
  options: { showSign?: boolean; showArrow?: boolean } = {},
): string {
  if (deltaPercent === null || deltaPercent === undefined) return '—'
  if (Number.isNaN(deltaPercent)) return '—'

  const { showSign = true, showArrow = true } = options

  const abs = Math.abs(deltaPercent)
  const formatted = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(abs)

  const sign = showSign ? (deltaPercent > 0 ? '+' : deltaPercent < 0 ? '-' : '') : ''
  const arrow = showArrow ? (deltaPercent > 0 ? '↑' : deltaPercent < 0 ? '↓' : '→') : ''

  return showArrow ? `${arrow} ${sign}${formatted}` : `${sign}${formatted}`
}
