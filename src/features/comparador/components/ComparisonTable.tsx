import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Avatar, Card, Pill } from '@/components/primitives'
import { formatMetric } from '@/lib/formatMetric'
import type { ComparadorRow } from '../hooks/useComparadorData'
import { Sparkline } from './Sparkline'
import { HealthScore } from './HealthScore'

type SortKey = 'name' | 'spend' | 'leads' | 'cpl' | 'roas' | 'health' | 'urgency'
type SortDir = 'asc' | 'desc'

interface Props {
  rows: ComparadorRow[]
}

function bestIndex(values: Array<number | null>, betterIs: 'higher' | 'lower'): number | null {
  let best: { idx: number; v: number } | null = null
  values.forEach((v, i) => {
    if (v == null) return
    if (!best) {
      best = { idx: i, v }
      return
    }
    if (betterIs === 'higher' ? v > best.v : v < best.v) best = { idx: i, v }
  })
  return best ? (best as { idx: number; v: number }).idx : null
}

function worstIndex(values: Array<number | null>, betterIs: 'higher' | 'lower'): number | null {
  return bestIndex(values, betterIs === 'higher' ? 'lower' : 'higher')
}

export function ComparisonTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('urgency')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    const copy = [...rows]
    const dir = sortDir === 'asc' ? 1 : -1
    const nullLast = (v: number | null) => (v == null ? Infinity * dir : v)
    copy.sort((a, b) => {
      switch (sortKey) {
        case 'name':    return a.name.localeCompare(b.name) * dir
        case 'spend':   return (nullLast(a.spend) - nullLast(b.spend)) * dir
        case 'leads':   return (nullLast(a.leads) - nullLast(b.leads)) * dir
        case 'cpl':     return (nullLast(a.cpl) - nullLast(b.cpl)) * dir
        case 'roas':    return (nullLast(a.roas) - nullLast(b.roas)) * dir
        case 'health':  return (a.health - b.health) * dir
        case 'urgency': return (a.urgency - b.urgency) * dir
      }
    })
    return copy
  }, [rows, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  const bestLeadsIdx = bestIndex(sorted.map((r) => r.leads), 'higher')
  const bestCplIdx = bestIndex(sorted.map((r) => r.cpl), 'lower')
  const bestRoasIdx = bestIndex(sorted.map((r) => r.roas), 'higher')
  const worstLeadsIdx = worstIndex(sorted.map((r) => r.leads), 'higher')
  const worstCplIdx = worstIndex(sorted.map((r) => r.cpl), 'lower')
  const worstRoasIdx = worstIndex(sorted.map((r) => r.roas), 'higher')

  return (
    <Card className="overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100">
        <h3 className="text-[13px] font-semibold text-neutral-900">Desempenho por cliente</h3>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>ordenar por</span>
          <button
            onClick={() => toggleSort('urgency')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-neutral-200 hover:border-neutral-300 text-neutral-700 font-medium"
          >
            {sortKey === 'urgency' ? 'Urgência' : humanSort(sortKey)}
            {sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-neutral-600">
              <Th>Cliente</Th>
              <Th align="right" sortKey="spend" current={sortKey} dir={sortDir} onSort={toggleSort}>Investido</Th>
              <Th align="right" sortKey="leads" current={sortKey} dir={sortDir} onSort={toggleSort}>Leads</Th>
              <Th align="right" sortKey="cpl" current={sortKey} dir={sortDir} onSort={toggleSort}>CPL</Th>
              <Th align="right" sortKey="roas" current={sortKey} dir={sortDir} onSort={toggleSort}>ROAS</Th>
              <Th>Tendência (7d)</Th>
              <Th sortKey="health" current={sortKey} dir={sortDir} onSort={toggleSort}>Saúde</Th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-neutral-500">
                  Nenhum cliente na carteira.
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
                <tr key={r.slug} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={r.name} size="sm" />
                      <div className="min-w-0">
                        <Link
                          to={`/c/${r.slug}/overview`}
                          className="text-[13px] font-semibold text-neutral-900 hover:text-brand-700 block truncate"
                        >
                          {r.name}
                        </Link>
                        {r.isNew && (
                          <div className="mt-0.5">
                            <Pill tone="info">novo</Pill>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <NumCell value={r.spend} unit="currency" />
                  <NumCell
                    value={r.leads}
                    unit="count"
                    highlight={i === bestLeadsIdx ? 'best' : i === worstLeadsIdx ? 'worst' : null}
                  />
                  <NumCell
                    value={r.cpl}
                    unit="currency"
                    highlight={i === bestCplIdx ? 'best' : i === worstCplIdx ? 'worst' : null}
                  />
                  <NumCell
                    value={r.roas}
                    unit="roas"
                    highlight={i === bestRoasIdx ? 'best' : i === worstRoasIdx ? 'worst' : null}
                  />
                  <td className="px-4 py-3">
                    {r.trend && r.trend.length >= 2 ? (
                      <Sparkline data={r.trend} ariaLabel={`tendência de spend de ${r.name}`} />
                    ) : (
                      <span className="text-[11px] text-neutral-400 tabular">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <HealthScore score={r.health} tone={r.healthTone} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      to={`/c/${r.slug}/performance`}
                      aria-label={`abrir performance de ${r.name}`}
                      className="inline-grid place-items-center w-7 h-7 rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ── helpers ── */

function humanSort(k: SortKey): string {
  switch (k) {
    case 'name': return 'Nome'
    case 'spend': return 'Investido'
    case 'leads': return 'Leads'
    case 'cpl': return 'CPL'
    case 'roas': return 'ROAS'
    case 'health': return 'Saúde'
    case 'urgency': return 'Urgência'
  }
}

function Th({
  children,
  align = 'left',
  sortKey,
  current,
  dir,
  onSort,
}: {
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
  sortKey?: SortKey
  current?: SortKey
  dir?: SortDir
  onSort?: (k: SortKey) => void
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  const clickable = sortKey && onSort
  const isCurrent = sortKey && current === sortKey
  return (
    <th className={`font-bold text-[11px] px-4 py-2.5 ${alignClass}`}>
      {clickable ? (
        <button
          onClick={() => onSort!(sortKey!)}
          className={`inline-flex items-center gap-1 ${
            align === 'right' ? 'flex-row-reverse' : ''
          } hover:text-neutral-900 transition-colors ${isCurrent ? 'text-neutral-900' : 'text-neutral-600'}`}
        >
          {children}
          {isCurrent ? (
            dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
          ) : (
            <ArrowUpDown size={11} className="opacity-40" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  )
}

function NumCell({
  value,
  unit,
  highlight,
}: {
  value: number | null
  unit: 'currency' | 'count' | 'roas'
  highlight?: 'best' | 'worst' | null
}) {
  const label =
    value == null
      ? '—'
      : unit === 'currency'
      ? formatMetric(value, 'currency', { compact: value >= 10000 })
      : unit === 'roas'
      ? `${value.toFixed(1)}×`
      : value.toLocaleString('pt-BR')

  const classes = [
    'px-4 py-3 text-right tabular text-[13px]',
    value == null ? 'text-neutral-300' : 'text-neutral-900',
    highlight === 'best' ? 'bg-success-50 text-success-700 font-semibold' : '',
    highlight === 'worst' && value != null ? 'text-error-600' : '',
  ].join(' ')

  return <td className={classes}>{label}</td>
}
