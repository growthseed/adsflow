/**
 * <CohortMatrixWidget> — heatmap de cohort (mês entrada × mês fechamento).
 * Pega array [{ rowKey, colKey, value }] e pivota em matrix coloridas
 * por intensidade. Padrão MidiaHub "Tempo".
 */

import { useMemo } from 'react'
import { ChartCard } from '../ChartCard'

export interface CohortMatrixWidgetProps {
  title: string
  subtitle?: string
  data: Array<Record<string, unknown>>
  rowKey: string
  colKey: string
  valueKey: string
  valueFormat?: 'currency' | 'number' | 'percent' | 'ratio' | 'days'
  colorScale?: 'green' | 'blue' | 'orange' | 'red' | 'purple'
  height?: number
}

const COLOR_SCALES = {
  green:  ['#f0fdf4', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'],
  blue:   ['#eff6ff', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'],
  orange: ['#fff7ed', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c'],
  red:    ['#fef2f2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626'],
  purple: ['#faf5ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea'],
}

function formatValue(v: number, fmt: CohortMatrixWidgetProps['valueFormat']): string {
  if (Number.isNaN(v) || v == null) return '—'
  switch (fmt) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
    case 'percent':
      return `${v.toFixed(1).replace('.', ',')}%`
    case 'ratio':
      return `${v.toFixed(2).replace('.', ',')}x`
    case 'days':
      return `${Math.round(v)}d`
    default:
      return v.toLocaleString('pt-BR')
  }
}

function colorFor(v: number, min: number, max: number, scale: string[]): string {
  if (max === min) return scale[Math.floor(scale.length / 2)]
  const norm = (v - min) / (max - min)
  const idx = Math.min(scale.length - 1, Math.floor(norm * scale.length))
  return scale[idx]
}

export default function CohortMatrixWidget({
  title,
  subtitle,
  data,
  rowKey,
  colKey,
  valueKey,
  valueFormat = 'percent',
  colorScale = 'green',
  height = 360,
}: CohortMatrixWidgetProps) {
  const { rows, cols, matrix, min, max } = useMemo(() => {
    const rowSet = new Set<string>()
    const colSet = new Set<string>()
    const cells = new Map<string, number>()
    let mi = Infinity
    let ma = -Infinity
    for (const d of data) {
      const r = String(d[rowKey] ?? '')
      const c = String(d[colKey] ?? '')
      const v = Number(d[valueKey] ?? 0)
      rowSet.add(r)
      colSet.add(c)
      cells.set(`${r}|${c}`, v)
      if (v < mi) mi = v
      if (v > ma) ma = v
    }
    const rs = Array.from(rowSet).sort()
    const cs = Array.from(colSet).sort()
    return { rows: rs, cols: cs, matrix: cells, min: mi, max: ma }
  }, [data, rowKey, colKey, valueKey])

  const isEmpty = !data || data.length === 0
  const scale = COLOR_SCALES[colorScale]

  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={isEmpty}>
      {!isEmpty && (
        <div className="overflow-auto h-full">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white z-10 px-2 py-1 text-left font-semibold text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
                  {rowKey}
                </th>
                {cols.map((c) => (
                  <th
                    key={c}
                    className="px-2 py-1 text-center font-semibold text-[var(--text-secondary)] border-b border-[var(--border-subtle)] min-w-[70px]"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r}>
                  <td className="sticky left-0 bg-white z-10 px-2 py-1 font-medium text-[var(--text-primary)] border-b border-[var(--border-subtle)]">
                    {r}
                  </td>
                  {cols.map((c) => {
                    const v = matrix.get(`${r}|${c}`)
                    if (v == null) {
                      return (
                        <td
                          key={c}
                          className="px-2 py-1 text-center text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]"
                        >
                          —
                        </td>
                      )
                    }
                    const bg = colorFor(v, min, max, scale)
                    return (
                      <td
                        key={c}
                        className="px-2 py-1 text-center border-b border-[var(--border-subtle)]"
                        style={{ background: bg }}
                        title={`${r} → ${c}: ${formatValue(v, valueFormat)}`}
                      >
                        {formatValue(v, valueFormat)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  )
}
