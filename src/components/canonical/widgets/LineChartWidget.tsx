/**
 * <LineChartWidget> — Recharts line chart inside a ChartCard.
 * One or many series, smooth curves, auto-formatted axes.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartCard } from '../ChartCard'

export interface LineSeries {
  key: string
  label: string
  color: string
}

export interface LineChartWidgetProps {
  title: string
  subtitle?: string
  /** Each row is an x-axis point, with one numeric field per series */
  data: Array<Record<string, number | string>>
  /** The key in each row that holds the x-axis label (e.g. 'date') */
  xKey: string
  series: LineSeries[]
  height?: number
  /** Format x-axis tick label (default: identity) */
  formatX?: (value: string) => string
  /** Format y-axis tick + tooltip value */
  formatY?: (value: number) => string
}

export default function LineChartWidget({
  title,
  subtitle,
  data,
  xKey,
  series,
  height = 280,
  formatX,
  formatY,
}: LineChartWidgetProps) {
  const isEmpty = !data || data.length === 0
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={isEmpty}>
      {!isEmpty && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 12,
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
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
