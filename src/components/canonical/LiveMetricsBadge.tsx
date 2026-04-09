/**
 * ============================================
 * <LiveMetricsBadge> — overlay metric pill for ReactFlow nodes
 * ============================================
 * A small floating badge showing real metrics from the performance
 * snapshot. Meant to be rendered inside custom node components as
 * the last child, positioned absolutely above the node body.
 *
 * Usage inside a node:
 *   {data.liveMetrics && <LiveMetricsBadge metrics={data.liveMetrics} />}
 * ============================================
 */

import type { LiveMetrics } from '@/lib/enrichFlowWithLiveData'
import { formatMetric } from '@/lib/formatMetric'

interface LiveMetricsBadgeProps {
  metrics: LiveMetrics
  compact?: boolean
}

export function LiveMetricsBadge({ metrics, compact = false }: LiveMetricsBadgeProps) {
  const { label, spend, impressions, clicks, conversions, cpa, currency = 'BRL' } = metrics

  return (
    <div
      className="
        absolute -top-11 left-1/2 -translate-x-1/2
        bg-neutral-900 text-white rounded-lg shadow-xl
        px-2.5 py-1.5 whitespace-nowrap
        pointer-events-none
        z-10
        flex items-center gap-2
        text-2xs font-medium
      "
      style={{ minWidth: compact ? 80 : 120 }}
    >
      {/* Live dot */}
      <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse flex-shrink-0" />

      <div className="flex flex-col leading-tight">
        <span className="text-neutral-400 text-[9px] uppercase tracking-wider">{label}</span>
        <span className="flex items-center gap-2 text-white tabular-nums">
          {spend !== undefined && (
            <span className="font-semibold">
              {formatMetric(spend, 'currency', { currency, compact: true })}
            </span>
          )}
          {conversions !== undefined && conversions > 0 && (
            <span>
              <span className="text-success-400">{conversions}</span>
              <span className="text-neutral-500 ml-0.5">conv</span>
            </span>
          )}
          {cpa !== undefined && cpa > 0 && (
            <span className="text-neutral-300">
              CPA {formatMetric(cpa, 'currency', { currency, compact: true })}
            </span>
          )}
          {clicks !== undefined && spend === undefined && (
            <span>
              {formatMetric(clicks, 'number', { compact: true })}
              <span className="text-neutral-500 ml-0.5">cliq</span>
            </span>
          )}
          {impressions !== undefined && spend === undefined && clicks === undefined && (
            <span>
              {formatMetric(impressions, 'number', { compact: true })}
              <span className="text-neutral-500 ml-0.5">impr</span>
            </span>
          )}
        </span>
      </div>

      {/* Arrow down */}
      <div
        className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-neutral-900 rotate-45"
        aria-hidden="true"
      />
    </div>
  )
}
