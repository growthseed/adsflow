/**
 * <WaterfallChartWidget> — decomposição de variação (ofensores).
 *
 * Recharts não tem waterfall nativo. Truque conhecido: usa BarChart com
 * uma série invisível como offset + a série real visível em cima.
 *
 * Exemplo de input:
 *   [
 *     { category: 'Mês anterior', value: 100000, isTotal: true },
 *     { category: 'Comercial',    value:  +5000 },
 *     { category: 'Reativação',   value:  -3000 },
 *     { category: 'Outros',       value:  +1500 },
 *     { category: 'Mês atual',    value: 103500, isTotal: true },
 *   ]
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { ChartCard } from '../ChartCard'

export interface WaterfallItem {
  category: string
  value: number
  isTotal?: boolean
}

export interface WaterfallChartWidgetProps {
  title: string
  subtitle?: string
  data: WaterfallItem[]
  height?: number
  positiveColor?: string
  negativeColor?: string
  totalColor?: string
  formatValue?: (v: number) => string
}

interface WaterfallRow extends WaterfallItem {
  start: number
  end: number
  fill: string
  /** Esta é a barra "invisível" que serve de offset */
  offset: number
  /** Esta é a barra colorida visível, sempre positiva (Math.abs do delta) */
  visible: number
}

function computeRows(
  data: WaterfallItem[],
  pos: string,
  neg: string,
  tot: string,
): WaterfallRow[] {
  let running = 0
  return data.map((d) => {
    if (d.isTotal) {
      // barra cheia do zero até o total
      const row: WaterfallRow = {
        ...d,
        start: 0,
        end: d.value,
        offset: 0,
        visible: d.value,
        fill: tot,
      }
      running = d.value
      return row
    }
    const start = running
    const end = running + d.value
    const row: WaterfallRow = {
      ...d,
      start,
      end,
      offset: d.value >= 0 ? start : end,
      visible: Math.abs(d.value),
      fill: d.value >= 0 ? pos : neg,
    }
    running = end
    return row
  })
}

export default function WaterfallChartWidget({
  title,
  subtitle,
  data,
  height = 320,
  positiveColor = '#00C896',
  negativeColor = '#FF4D4D',
  totalColor = '#1A1F36',
  formatValue,
}: WaterfallChartWidgetProps) {
  const isEmpty = !data || data.length === 0
  const rows = isEmpty ? [] : computeRows(data, positiveColor, negativeColor, totalColor)
  const fmt = formatValue ?? ((v: number) => v.toLocaleString('pt-BR'))

  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={isEmpty}>
      {!isEmpty && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmt(v as number)}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(_value, _name, props) => {
                const r = props.payload as WaterfallRow
                const sign = r.value > 0 ? '+' : ''
                return [`${sign}${fmt(r.value)}`, r.isTotal ? 'Total' : 'Delta']
              }}
            />
            {/* barra invisível (offset) */}
            <Bar dataKey="offset" stackId="a" fill="transparent" />
            {/* barra visível (delta colorido) */}
            <Bar dataKey="visible" stackId="a" radius={[2, 2, 0, 0]}>
              {rows.map((r, i) => (
                <Cell key={i} fill={r.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
