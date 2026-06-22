/**
 * <KpiCardAdvancedWidget> — KPI card avançado.
 * Mostra: ícone + rótulo + valor grande + variação% colorida +
 * sparkline (mini gráfico de tendência) + indicador de meta opcional.
 */

import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface KpiCardAdvancedProps {
  label: string
  value: string
  Icon?: LucideIcon
  /** Pequena legenda à direita (ex: "vs Fev/26") */
  hint?: string
  /** Variação decimal (0.15 = +15%) */
  variationPct?: number | null
  higherIsBetter?: boolean
  /** Pontos pra sparkline (mini line) */
  sparkline?: number[]
  /** Meta a comparar (mostra "75% da meta" abaixo) */
  goalLabel?: string
  goalProgress?: number  // 0..1
}

export default function KpiCardAdvancedWidget({
  label,
  value,
  Icon,
  hint,
  variationPct,
  higherIsBetter = true,
  sparkline,
  goalLabel,
  goalProgress,
}: KpiCardAdvancedProps) {
  const variationGood =
    variationPct != null && (higherIsBetter ? variationPct > 0 : variationPct < 0)
  const variationBad =
    variationPct != null && (higherIsBetter ? variationPct < 0 : variationPct > 0)
  const Trend = (variationPct ?? 0) >= 0 ? TrendingUp : TrendingDown

  const sparklineData = (sparkline ?? []).map((v, i) => ({ i, v }))
  const lineColor = variationGood ? '#10b981' : variationBad ? '#ef4444' : '#64748b'

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5 hover:ring-slate-300 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-slate-100">
              <Icon className="w-4 h-4 text-slate-600" />
            </div>
          )}
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 truncate">
            {label}
          </p>
        </div>
        {hint && <span className="text-[11px] text-slate-400 shrink-0">{hint}</span>}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">
          {value}
        </p>
        {sparklineData.length > 1 && (
          <div className="w-20 h-10 -mb-1">
            <ResponsiveContainer>
              <LineChart data={sparklineData}>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {variationPct != null && (
        <div
          className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
            variationGood ? 'text-emerald-600' : variationBad ? 'text-red-600' : 'text-slate-500'
          }`}
        >
          <Trend className="w-3.5 h-3.5" />
          <span>
            {variationPct > 0 ? '+' : ''}
            {(variationPct * 100).toFixed(1).replace('.', ',')}%
          </span>
        </div>
      )}

      {goalLabel && typeof goalProgress === 'number' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>{goalLabel}</span>
            <span className="tabular-nums">{Math.round(goalProgress * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(goalProgress * 100, 100)}%`,
                background:
                  goalProgress >= 1
                    ? '#10b981'
                    : goalProgress >= 0.8
                      ? '#f59e0b'
                      : goalProgress >= 0.5
                        ? '#f97316'
                        : '#ef4444',
                transition: 'width 600ms ease-out',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
