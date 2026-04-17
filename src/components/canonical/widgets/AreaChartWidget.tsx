/**
 * <AreaChartWidget> — Stacked area chart for "X vs Y over time" stories.
 * Used in V4 Company-style dashboards for "Leads vs Perdas por mês".
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartCard } from '../ChartCard'
import type { LineSeries } from './LineChartWidget'

export interface AreaChartWidgetProps {
  title: string
  subtitle?: string
  data: Array<Record<string, number | string>>
  xKey: string
  series: LineSeries[]
  height?: number
  stacked?: boolean
  formatX?: (value: string) => string
  formatY?: (value: number) => string
}

export default function AreaChartWidget({
  title,
  subtitle,
  data,
  xKey,
  series,
  height = 280,
  stacked = false,
  formatX,
  formatY,
}: AreaChartWidgetProps) {
  const isEmpty = !data || data.length === 0
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={isEmpty}>
      {!isEmpty && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient id={`grad-${s.key}`} key={s.key} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={formatX}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (formatY ? formatY(v) : String(v))}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-primary)',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: any) => {
                const n = typeof v === 'number' ? v : Number(v)
                return formatY ? formatY(n) : String(n)
              }) as never}
            />
            {series.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#64748b' }}
                iconType="circle"
              />
            )}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
