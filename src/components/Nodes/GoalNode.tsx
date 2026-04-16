import { memo, useMemo } from 'react'
import { Handle, Position, NodeResizer } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Target, TrendingUp, TrendingDown, Minus, RefreshCw, Pencil } from 'lucide-react'

import type { GoalNodeData, GoalStatus } from '@/types/goalMetrics'
import { computeGoalStatus, GOAL_STATUS_CONFIG, OBJECTIVE_LABELS } from '@/types/goalMetrics'
import { getMetricByKey } from '@/data/metricRegistry'

const STATUS_BAR_COLORS: Record<GoalStatus, string> = {
  exceeded: 'bg-emerald-500',
  on_track: 'bg-blue-500',
  at_risk: 'bg-amber-500',
  off_track: 'bg-red-500',
  no_data: 'bg-slate-300',
}

function formatValue(value: number | undefined, unit: string): string {
  if (value == null) return '—'
  if (unit === 'currency') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  if (unit === 'percent') return `${value.toFixed(1)}%`
  if (unit === 'ratio') return `${value.toFixed(1)}x`
  return value.toLocaleString('pt-BR')
}

const GoalNode = ({ data, selected }: NodeProps<GoalNodeData>) => {
  const metric = useMemo(
    () => data.metric ?? getMetricByKey(data.metric_key),
    [data.metric, data.metric_key],
  )

  const activeTarget = useMemo(() => {
    if (!data.targets?.length) return undefined
    if (data.active_range) return data.targets.find((t) => t.range === data.active_range)
    return data.targets[0]
  }, [data.targets, data.active_range])

  const pct = data.attainment_pct ?? (
    activeTarget && data.realized != null && activeTarget.target > 0
      ? (data.realized / activeTarget.target) * 100
      : undefined
  )

  const status = data.status ?? computeGoalStatus(pct)
  const cfg = GOAL_STATUS_CONFIG[status]
  const barColor = STATUS_BAR_COLORS[status]
  const unit = metric?.unit ?? 'number'
  const direction = metric?.direction ?? 'higher_better'

  return (
    <>
      <NodeResizer
        minWidth={220}
        minHeight={140}
        isVisible={selected}
        lineClassName="!border-blue-400"
        handleClassName="!bg-blue-500 !w-2 !h-2"
      />

      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />

      <div
        className={`
          min-w-[220px] rounded-xl border-2 bg-white shadow-sm overflow-hidden transition-all
          ${selected ? 'border-blue-500 shadow-blue-100' : 'border-slate-200'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <Target className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-700 truncate">
              {data.label || metric?.label || 'Meta'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {data.onRefresh && (
              <button onClick={data.onRefresh} className="p-0.5 hover:bg-slate-200 rounded transition-colors">
                <RefreshCw className="w-3 h-3 text-slate-400" />
              </button>
            )}
            {data.onEdit && (
              <button onClick={data.onEdit} className="p-0.5 hover:bg-slate-200 rounded transition-colors">
                <Pencil className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-3 py-2.5 space-y-2">
          {/* Objective badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
              {OBJECTIVE_LABELS[data.objective] ?? data.objective}
            </span>
            {data.period !== 'monthly' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                {data.period === 'quarterly' ? activeTarget?.range ?? 'Q?' : data.period}
              </span>
            )}
          </div>

          {/* Metric name */}
          <div className="text-[10px] text-slate-500 font-medium">
            {metric?.label ?? data.metric_key}
          </div>

          {/* Values row */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wide">Realizado</div>
              <div className="text-lg font-bold text-slate-900 leading-tight">
                {formatValue(data.realized, unit)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase tracking-wide">Meta</div>
              <div className="text-sm font-semibold text-slate-600 leading-tight">
                {activeTarget ? formatValue(activeTarget.target, unit) : '—'}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.min(pct ?? 0, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-semibold ${cfg.color}`}>
                {pct != null ? `${pct.toFixed(0)}%` : '—'}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Trend indicator */}
          {direction !== 'neutral' && pct != null && (
            <div className="flex items-center gap-1 text-[9px] text-slate-400">
              {pct >= 100 ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : pct >= 70 ? (
                <Minus className="w-3 h-3 text-blue-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span>
                {direction === 'lower_better' ? 'menor é melhor' : 'maior é melhor'}
              </span>
            </div>
          )}

          {/* Forecast (if available) */}
          {data.forecast_end_of_period != null && activeTarget && (
            <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-1.5 mt-1">
              Projeção fim do período: <span className="font-semibold text-slate-600">{formatValue(data.forecast_end_of_period, unit)}</span>
              {data.forecast_end_of_period < activeTarget.target && (
                <span className="text-red-500 ml-1">
                  ({((data.forecast_end_of_period / activeTarget.target) * 100).toFixed(0)}% da meta)
                </span>
              )}
            </div>
          )}

          {/* Data source indicator */}
          <div className="text-[8px] text-slate-300 pt-0.5">
            {data.data_source === 'manual' ? 'Entrada manual' : `via ${data.data_source}`}
          </div>
        </div>
      </div>
    </>
  )
}

export default memo(GoalNode)
