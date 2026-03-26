/**
 * NODE STATS OVERLAY
 * Efeito Digital - Ads Flow
 *
 * Overlays mini stats (visits | leads | conversions), goal progress bar,
 * and drop-off badges on flow nodes and edges.
 */

import React, { memo } from 'react'
import type { AggregatedNodeMetrics, NodeGoal, DropOffData } from '@/services/flowAnalyticsService'

// =====================================================
// TYPES
// =====================================================

export interface NodeStatsOverlayProps {
  nodeId: string
  flowId: string
  metrics: AggregatedNodeMetrics | null
  goals: NodeGoal[]
  isVisible: boolean
}

export interface EdgeDropOffBadgeProps {
  sourceNodeId: string
  targetNodeId: string
  dropOffData: DropOffData | null
  labelX: number
  labelY: number
  isVisible: boolean
}

// =====================================================
// HELPERS
// =====================================================

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString('pt-BR')
}

function getGoalColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getGoalBgColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-100'
  if (percentage >= 50) return 'bg-yellow-100'
  return 'bg-red-100'
}

function getGoalTextColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-700'
  if (percentage >= 50) return 'text-yellow-700'
  return 'text-red-700'
}

function getActualForMetric(
  metrics: AggregatedNodeMetrics | null,
  metric: string
): number {
  if (!metrics) return 0
  switch (metric) {
    case 'visits': return metrics.visits
    case 'leads': return metrics.leads
    case 'conversions': return metrics.conversions
    case 'revenue': return metrics.revenue
    default: return 0
  }
}

// =====================================================
// NODE STATS OVERLAY
// =====================================================

const NodeStatsOverlay: React.FC<NodeStatsOverlayProps> = ({
  nodeId: _nodeId,
  flowId: _flowId,
  metrics,
  goals,
  isVisible,
}) => {
  if (!isVisible) return null

  const hasMetrics = metrics && (metrics.visits > 0 || metrics.leads > 0 || metrics.conversions > 0)
  const primaryGoal = goals.length > 0 ? goals[0] : null

  // Compute goal percentage
  let goalPct = 0
  if (primaryGoal && primaryGoal.target_value > 0) {
    const actual = getActualForMetric(metrics, primaryGoal.metric)
    goalPct = Math.min(Math.round((actual / primaryGoal.target_value) * 100), 999)
  }

  return (
    <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-0.5">
      {/* Mini stats bar */}
      {hasMetrics && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/75 backdrop-blur-sm text-[10px] text-white whitespace-nowrap shadow">
          <span title="Visitas">{formatCompact(metrics.visits)}<span className="opacity-50 ml-0.5">vis</span></span>
          <span className="opacity-30">|</span>
          <span title="Leads">{formatCompact(metrics.leads)}<span className="opacity-50 ml-0.5">leads</span></span>
          <span className="opacity-30">|</span>
          <span title="Conversoes">{formatCompact(metrics.conversions)}<span className="opacity-50 ml-0.5">conv</span></span>
        </div>
      )}

      {/* Goal progress bar */}
      {primaryGoal && (
        <div className="flex items-center gap-1 w-28">
          <div className={`flex-1 h-1.5 rounded-full ${getGoalBgColor(goalPct)} overflow-hidden`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${getGoalColor(goalPct)}`}
              style={{ width: `${Math.min(goalPct, 100)}%` }}
            />
          </div>
          <span className={`text-[9px] font-bold ${getGoalTextColor(goalPct)}`}>
            {goalPct}%
          </span>
        </div>
      )}
    </div>
  )
}

// =====================================================
// EDGE DROP-OFF BADGE
// =====================================================

export const EdgeDropOffBadge: React.FC<EdgeDropOffBadgeProps> = ({
  sourceNodeId: _src,
  targetNodeId: _tgt,
  dropOffData,
  labelX,
  labelY,
  isVisible,
}) => {
  if (!isVisible || !dropOffData || dropOffData.drop_off_rate === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(-50%, 8px) translate(${labelX}px,${labelY}px)`,
        pointerEvents: 'none',
      }}
    >
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 shadow-sm">
        <span className="opacity-70">&darr;</span> {dropOffData.drop_off_rate}% drop
      </span>
    </div>
  )
}

export default memo(NodeStatsOverlay)
