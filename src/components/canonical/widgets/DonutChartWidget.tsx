/**
 * <DonutChartWidget> — Pie/donut chart for composition stories.
 * Used for "Alcance por plataforma" (Reportei style) or "Distribuição
 * por canal" (Ad Flow overview).
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartCard } from '../ChartCard'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

export interface DonutChartWidgetProps {
  title: string
  subtitle?: string
  data: DonutSegment[]
  height?: number
  /** Donut (hole in the middle) vs full pie. Default donut. */
  variant?: 'donut' | 'pie'
  /** Center label (only shown when donut) */
  centerLabel?: string
  centerValue?: string
  formatValue?: (value: number) => string
}

export default function DonutChartWidget({
  title,
  subtitle,
  data,
  height = 280,
  variant = 'donut',
  centerLabel,
  centerValue,
  formatValue,
}: DonutChartWidgetProps) {
  const isEmpty = !data || data.length === 0 || data.every((d) => d.value === 0)
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={isEmpty}>
      {!isEmpty && (
        <div className="relative w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data as unknown as Array<Record<string, unknown>>}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={variant === 'donut' ? '55%' : 0}
                outerRadius="85%"
                paddingAngle={variant === 'donut' ? 2 : 0}
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
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
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#64748b' }}
                iconType="circle"
                verticalAlign="bottom"
              />
            </PieChart>
          </ResponsiveContainer>

          {variant === 'donut' && centerValue && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">
                {centerLabel}
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">
                {centerValue}
              </div>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  )
}
