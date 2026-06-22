/**
 * <ScatterChartWidget> — XY scatter pra correlações.
 * Casos clássicos:
 *   - CPL × CTR por anúncio (eixo Y invertido — menor CPL = melhor)
 *   - NPS × Reposições por membro
 *   - Health Score × Receita
 */

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartCard } from '../ChartCard'

export interface ScatterChartWidgetProps {
  title: string
  subtitle?: string
  data: Array<Record<string, unknown>>
  xKey: string
  yKey: string
  sizeKey?: string
  tooltipKey?: string
  colorKey?: string
  xLabel?: string
  yLabel?: string
  yInverted?: boolean
  height?: number
  formatX?: (v: number) => string
  formatY?: (v: number) => string
}

const COLOR_PALETTE = [
  '#1A1F36', '#E66C37', '#6B007B', '#E044A7',
  '#744EC2', '#D9B300', '#3599B8', '#00C896',
]

export default function ScatterChartWidget({
  title,
  subtitle,
  data,
  xKey,
  yKey,
  sizeKey,
  tooltipKey,
  colorKey,
  xLabel,
  yLabel,
  yInverted = false,
  height = 320,
  formatX,
  formatY,
}: ScatterChartWidgetProps) {
  const isEmpty = !data || data.length === 0

  // group by colorKey
  const groups = isEmpty
    ? []
    : colorKey
      ? Array.from(
          data.reduce((m, d) => {
            const k = String(d[colorKey] ?? '—')
            if (!m.has(k)) m.set(k, [])
            m.get(k)!.push(d)
            return m
          }, new Map<string, Array<Record<string, unknown>>>()).entries(),
        )
      : [['Pontos', data] as [string, Array<Record<string, unknown>>]]

  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={isEmpty}>
      {!isEmpty && (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey={xKey}
              name={xLabel ?? xKey}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v) => (formatX ? formatX(v as number) : String(v))}
              label={
                xLabel
                  ? { value: xLabel, position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }
                  : undefined
              }
            />
            <YAxis
              type="number"
              dataKey={yKey}
              name={yLabel ?? yKey}
              reversed={yInverted}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v) => (formatY ? formatY(v as number) : String(v))}
              label={
                yLabel
                  ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }
                  : undefined
              }
            />
            {sizeKey && <ZAxis type="number" dataKey={sizeKey} range={[40, 400]} />}
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name, props) => {
                const p = props.payload as Record<string, unknown> | undefined
                if (name === xKey || name === yKey) {
                  const n = typeof value === 'number' ? value : Number(value)
                  if (name === xKey) return [formatX ? formatX(n) : String(n), xLabel ?? xKey]
                  return [formatY ? formatY(n) : String(n), yLabel ?? yKey]
                }
                if (tooltipKey && p) return [String(p[tooltipKey]), tooltipKey]
                return [String(value), String(name)]
              }}
            />
            {groups.map(([label, items], i) => (
              <Scatter key={label} name={label} data={items} fill={COLOR_PALETTE[i % COLOR_PALETTE.length]}>
                {items.map((_d, j) => (
                  <Cell key={j} fill={COLOR_PALETTE[i % COLOR_PALETTE.length]} />
                ))}
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
