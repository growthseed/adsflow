/**
 * <CalendarHeatmapWidget> — densidade de eventos por dia (GitHub-style).
 *
 * Útil pra Cronograma de Conteúdo MOAI: visualiza quais dias têm post
 * agendado, quais estão vazios, e onde está o pico.
 *
 * Input: [{ date: 'YYYY-MM-DD', count: number, items?: string[] }]
 */

import { useMemo } from 'react'
import { ChartCard } from '../ChartCard'

export interface CalendarHeatmapWidgetProps {
  title: string
  subtitle?: string
  data: Array<{ date: string; count: number; items?: string[] }>
  months?: number
  colorScale?: 'green' | 'blue' | 'orange' | 'purple'
  itemLabel?: string
  height?: number
}

const COLOR_SCALES = {
  green:  ['#f0fdf4', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#15803d'],
  blue:   ['#eff6ff', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#1e40af'],
  orange: ['#fff7ed', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#c2410c'],
  purple: ['#faf5ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#7e22ce'],
}

function daysInRange(monthsBack: number): string[] {
  const out: string[] = []
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth() - monthsBack + 1, 1)
  const cursor = new Date(start)
  while (cursor <= today) {
    out.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

function colorFor(count: number, max: number, scale: string[]): string {
  if (count === 0) return scale[0]
  if (max === 0) return scale[0]
  const norm = count / max
  const idx = Math.min(scale.length - 1, Math.max(1, Math.ceil(norm * (scale.length - 1))))
  return scale[idx]
}

export default function CalendarHeatmapWidget({
  title,
  subtitle,
  data,
  months = 3,
  colorScale = 'orange',
  itemLabel = 'items',
  height = 200,
}: CalendarHeatmapWidgetProps) {
  const isEmpty = !data || data.length === 0
  const scale = COLOR_SCALES[colorScale]

  const { allDays, byDate, max } = useMemo(() => {
    const days = daysInRange(months)
    const dict = new Map<string, { count: number; items?: string[] }>()
    let m = 0
    for (const d of data) {
      const key = (d.date ?? '').slice(0, 10)
      const existing = dict.get(key)
      const count = (existing?.count ?? 0) + d.count
      const items = [...(existing?.items ?? []), ...(d.items ?? [])]
      dict.set(key, { count, items })
      if (count > m) m = count
    }
    return { allDays: days, byDate: dict, max: m }
  }, [data, months])

  // organize em colunas de 7 dias (semanas), começando no domingo
  const weeks: string[][] = []
  if (allDays.length > 0) {
    const firstDate = new Date(allDays[0])
    const firstWeekDay = firstDate.getDay()
    let current: string[] = Array(firstWeekDay).fill('')
    for (const d of allDays) {
      current.push(d)
      if (current.length === 7) {
        weeks.push(current)
        current = []
      }
    }
    if (current.length > 0) {
      while (current.length < 7) current.push('')
      weeks.push(current)
    }
  }

  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={isEmpty}>
      {!isEmpty && (
        <div className="overflow-x-auto h-full pb-2">
          <div className="flex gap-1">
            {weeks.map((wk, i) => (
              <div key={i} className="flex flex-col gap-1">
                {wk.map((dateStr, j) => {
                  if (!dateStr) {
                    return <div key={j} className="w-3 h-3" />
                  }
                  const cell = byDate.get(dateStr)
                  const count = cell?.count ?? 0
                  return (
                    <div
                      key={j}
                      className="w-3 h-3 rounded-sm"
                      style={{ background: colorFor(count, max, scale) }}
                      title={`${dateStr} — ${count} ${itemLabel}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          {/* Legenda */}
          <div className="flex items-center gap-1 mt-3 text-[10px] text-[var(--text-tertiary)]">
            <span>Menos</span>
            {scale.map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
            ))}
            <span>Mais</span>
          </div>
        </div>
      )}
    </ChartCard>
  )
}
