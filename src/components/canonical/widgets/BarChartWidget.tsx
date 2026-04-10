/**
 * <BarChartWidget> — Vertical OR horizontal bar chart.
 * Horizontal mode is what we use for "Ofensores" and "Motivos de Perda"
 * (V4 Company style).
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartCard } from '../ChartCard'

export interface BarSeries {
  key: string
  label: string
  color: string
}

export interface BarChartWidgetProps {
  title: string
  subtitle?: string
  data: Array<Record<string, number | string>>
  /** Category axis key (e.g. 'campaign', 'vendedor', 'motivo') */
  categoryKey: string
  series: BarSeries[]
  height?: number
  /** Horizontal bars (rotates X/Y). Default vertical. */
  horizontal?: boolean
  /** Color each bar differently based on category index */
  rainbow?: boolean
  formatValue?: (value: number) => string
}

const RAINBOW_PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#6366f1',
]

export default function BarChartWidget({
  title,
  subtitle,
  data,
  categoryKey,
  series,
  height = 280,
  horizontal = false,
  rainbow = false,
  formatValue,
}: BarChartWidgetProps) {
  const isEmpty = !data || data.length === 0
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={isEmpty}>
      {!isEmpty && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 8, right: 12, left: horizontal ? 80 : -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              horizontal={!horizontal}
              vertical={horizontal}
            />
            {horizontal ? (
              <>
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (formatValue ? formatValue(v) : String(v))}
                />
                <YAxis
                  dataKey={categoryKey}
                  type="category"
                  tick={{ fill: '#334155', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  width={72}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={categoryKey}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (formatValue ? formatValue(v) : String(v))}
                />
              </>
            )}
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 12,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: any) => {
                const n = typeof v === 'number' ? v : Number(v)
                return formatValue ? formatValue(n) : String(n)
              }) as never}
            />
            {series.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#64748b' }}
                iconType="circle"
              />
            )}
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
                maxBarSize={48}
              >
                {rainbow &&
                  data.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={RAINBOW_PALETTE[idx % RAINBOW_PALETTE.length]}
                    />
                  ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
