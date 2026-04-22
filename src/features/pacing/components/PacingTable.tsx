import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Flame, Settings2, Turtle } from 'lucide-react'

import { Avatar, Card, Pill } from '@/components/primitives'
import { formatMetric } from '@/lib/formatMetric'
import type { PacingRow, PacingStatus } from '../hooks/usePacingData'
import { PacingBar } from './PacingBar'

interface Props {
  rows: PacingRow[]
  onConfigureAutoPause?: () => void
}

type Filter = 'all' | 'off_pace'

const statusMeta: Record<PacingStatus, { label: string; tone: 'success' | 'warning' | 'error'; Icon: React.ElementType }> = {
  on_pace:         { label: 'no ritmo',      tone: 'success', Icon: AlertTriangle }, // unused icon
  ahead:           { label: 'adiantado',     tone: 'error',   Icon: Flame },
  will_overspend:  { label: 'vai estourar',  tone: 'error',   Icon: AlertTriangle },
  behind:          { label: 'atrasado',      tone: 'warning', Icon: Turtle },
}

const barTone = {
  on_pace: 'success',
  ahead: 'error',
  will_overspend: 'error',
  behind: 'warning',
} as const

export function PacingTable({ rows, onConfigureAutoPause }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(
    () => (filter === 'off_pace' ? rows.filter((r) => r.status !== 'on_pace') : rows),
    [rows, filter],
  )

  return (
    <Card className="overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-neutral-100">
        <div>
          <h3 className="text-[13px] font-semibold text-neutral-900">Pacing por cliente</h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {rows.filter((r) => r.status !== 'on_pace').length} fora do ritmo · ordenado por desvio
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>
            Todos
          </FilterBtn>
          <FilterBtn active={filter === 'off_pace'} onClick={() => setFilter('off_pace')}>
            Fora do ritmo
          </FilterBtn>
          {onConfigureAutoPause && (
            <button
              onClick={onConfigureAutoPause}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-700"
            >
              <Settings2 size={12} /> auto-pause
            </button>
          )}
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-neutral-600">
              <Th>Cliente</Th>
              <Th align="right">Budget</Th>
              <Th align="right">Gasto</Th>
              <Th>Ritmo</Th>
              <Th align="right">Projeção</Th>
              <Th>Status</Th>
              <Th>Ação</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-neutral-500">
                  Tudo dentro do ritmo.
                </td>
              </tr>
            ) : (
              filtered
                .sort((a, b) => Math.abs(b.deviationPct ?? 0) - Math.abs(a.deviationPct ?? 0))
                .map((r) => <Row key={r.clientSlug} row={r} />)
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Row({ row }: { row: PacingRow }) {
  const meta = statusMeta[row.status]
  const bar = barTone[row.status]
  const pct = row.spendPct != null ? Math.round(row.spendPct) : null
  return (
    <tr className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={row.clientName} size="sm" />
          <div className="min-w-0">
            <Link
              to={`/c/${row.clientSlug}/performance`}
              className="text-[13px] font-semibold text-neutral-900 truncate hover:text-brand-700 block"
            >
              {row.clientName}
            </Link>
            <div className="text-[10px] text-neutral-500 truncate">
              {row.platformsLabel} · {row.campaignCount} camp.
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right tabular text-[13px] text-neutral-700">
        {row.budget != null ? formatMetric(row.budget, 'currency', { compact: true }) : '—'}
      </td>
      <td className="px-4 py-3 text-right tabular text-[13px]">
        {row.spend != null ? (
          <>
            <span className={row.status === 'will_overspend' || row.status === 'ahead' ? 'text-error-600 font-semibold' : 'text-neutral-900 font-semibold'}>
              {formatMetric(row.spend, 'currency', { compact: true })}
            </span>
            {pct != null && <span className="text-[10px] text-neutral-500 ml-1">{pct}%</span>}
          </>
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-3 min-w-[180px]">
        {row.spendPct != null ? (
          <>
            <PacingBar actualPct={row.spendPct} idealPct={row.idealPct} tone={bar} />
            <div
              className={`text-[10px] mt-1.5 tabular ${
                row.status === 'will_overspend' || row.status === 'ahead'
                  ? 'text-error-600'
                  : row.status === 'behind'
                  ? 'text-warning-600'
                  : 'text-success-600'
              }`}
            >
              {row.deviationPct != null
                ? `${row.deviationPct > 0 ? '+' : ''}${row.deviationPct.toFixed(0)}% do ideal`
                : '—'}
            </div>
          </>
        ) : (
          <span className="text-[11px] text-neutral-400">sem budget</span>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular text-[13px]">
        {row.projectedSpend != null
          ? formatMetric(row.projectedSpend, 'currency', { compact: true })
          : '—'}
      </td>
      <td className="px-4 py-3">
        <Pill tone={meta.tone}>
          <meta.Icon size={10} strokeWidth={2.5} /> {meta.label}
        </Pill>
      </td>
      <td className="px-4 py-3">
        {row.status === 'will_overspend' && (
          <button className="px-2.5 py-1 rounded-md border border-error-200 text-error-700 text-[11px] font-semibold hover:bg-error-50">
            Pausar hoje
          </button>
        )}
        {row.status === 'ahead' && (
          <button className="px-2.5 py-1 rounded-md border border-neutral-200 text-neutral-700 text-[11px] font-semibold hover:bg-neutral-50">
            Pausar amanhã
          </button>
        )}
        {row.status === 'behind' && (
          <button className="px-2.5 py-1 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-semibold">
            Acelerar
          </button>
        )}
        {row.status === 'on_pace' && (
          <Link
            to={`/c/${row.clientSlug}/performance`}
            className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900"
          >
            detalhes
          </Link>
        )}
      </td>
    </tr>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  const cls = align === 'right' ? 'text-right' : 'text-left'
  return <th className={`font-bold text-[11px] px-4 py-2.5 ${cls}`}>{children}</th>
}

function FilterBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
        active
          ? 'bg-brand-50 text-brand-700 border border-brand-100'
          : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  )
}
