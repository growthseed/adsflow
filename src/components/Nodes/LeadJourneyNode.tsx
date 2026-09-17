import { memo } from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Route, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react'

export interface JourneyStage {
  label: string
  metric_key: string
  target: number
  realized: number
  conversion_pct?: number
  source: string
}

export interface LeadJourneyData {
  label: string
  stages: JourneyStage[]
  forecast_end_of_period?: number
  forecast_target?: number
  period_label?: string
  onEdit?: () => void
}

function formatNum(n: number | undefined): string {
  if (n == null) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString('pt-BR')
}

function stageColor(pct: number): string {
  if (pct >= 100) return 'bg-emerald-500'
  if (pct >= 70) return 'bg-blue-500'
  if (pct >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function convColor(pct: number): string {
  if (pct >= 30) return 'text-emerald-600'
  if (pct >= 15) return 'text-blue-600'
  if (pct >= 5) return 'text-amber-600'
  return 'text-red-600'
}

const LeadJourneyNode = ({ data, selected }: NodeProps & { data: LeadJourneyData }) => {
  const stages = data.stages ?? []

  const hasForecasting = data.forecast_end_of_period != null && data.forecast_target != null
  const forecastPct = hasForecasting
    ? ((data.forecast_end_of_period! / data.forecast_target!) * 100)
    : undefined

  return (
    <>
      <NodeResizer
        minWidth={Math.max(300, stages.length * 110 + 40)}
        minHeight={180}
        isVisible={selected}
        lineClassName="!border-violet-400"
        handleClassName="!bg-violet-500 !w-2 !h-2"
      />

      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />

      <div
        className={`
          rounded-xl border-2 bg-white shadow-sm overflow-hidden transition-all
          ${selected ? 'border-violet-500 shadow-violet-100' : 'border-slate-200'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-violet-50 border-b border-violet-100">
          <div className="flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-[11px] font-semibold text-violet-800">
              {data.label || 'Jornada do Lead'}
            </span>
          </div>
          {data.period_label && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">
              {data.period_label}
            </span>
          )}
        </div>

        {/* Stages */}
        <div className="px-3 py-3">
          <div className="flex items-stretch gap-1">
            {stages.map((stage, i) => {
              const pct = stage.target > 0 ? (stage.realized / stage.target) * 100 : 0

              return (
                <div key={i} className="flex items-center gap-1">
                  <div className="flex flex-col items-center min-w-[90px]">
                    {/* Stage values */}
                    <div className="text-center mb-1.5">
                      <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">
                        {stage.label}
                      </div>
                      <div className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                        {formatNum(stage.realized)}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        meta: {formatNum(stage.target)}
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${stageColor(pct)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-medium text-slate-500 mt-0.5">{pct.toFixed(0)}%</span>

                    {/* Source */}
                    <div className="text-[7px] text-slate-300 mt-0.5">{stage.source}</div>
                  </div>

                  {/* Arrow + conversion rate */}
                  {i < stages.length - 1 && (
                    <div className="flex flex-col items-center px-1">
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      {stage.conversion_pct != null && (
                        <span className={`text-[8px] font-bold ${convColor(stage.conversion_pct)}`}>
                          {stage.conversion_pct.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Forecast bar */}
          {hasForecasting && (
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
              {forecastPct! >= 80 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <div className="text-[9px] text-slate-500">
                <span className="font-medium">Projeção:</span>{' '}
                <span className={`font-bold ${forecastPct! >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {formatNum(data.forecast_end_of_period)}
                </span>
                {' '}de {formatNum(data.forecast_target)} ({forecastPct!.toFixed(0)}% da meta)
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default memo(LeadJourneyNode)
