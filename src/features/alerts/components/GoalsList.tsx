import { MoreHorizontal, ArrowUpRight } from 'lucide-react'

import { Avatar, Card, ProgressBar } from '@/components/primitives'
import type { ProgressTone } from '@/components/primitives'
import { formatMetric } from '@/lib/formatMetric'
import type { AgencyGoal } from '../types'

interface Props {
  goals: AgencyGoal[]
  onEdit?: (goal: AgencyGoal) => void
}

function toneFor(g: AgencyGoal): ProgressTone {
  if (g.pct == null) return 'info'
  if (g.direction === 'cap') {
    if (g.pct > 100) return 'error'
    if (g.pct > 90) return 'warning'
    return 'success'
  }
  if (g.pct >= 90) return 'success'
  if (g.pct >= 70) return 'warning'
  return 'error'
}

function formatValue(v: number | null, unit: AgencyGoal['unit']): string {
  if (v == null) return '—'
  switch (unit) {
    case 'currency': return formatMetric(v, 'currency')
    case 'percent':  return `${v.toFixed(0)}%`
    case 'ratio':    return `${v.toFixed(1)}×`
    default:         return v.toLocaleString('pt-BR')
  }
}

export function GoalsList({ goals, onEdit }: Props) {
  if (goals.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-neutral-600 mb-2">Nenhuma meta configurada ainda.</p>
        <p className="text-xs text-neutral-500">
          Crie metas por cliente (leads, ROAS, CPL) para acompanhar o progresso da carteira.
        </p>
      </Card>
    )
  }

  return (
    <Card className="divide-y divide-neutral-100">
      {goals.map((g) => {
        const tone = toneFor(g)
        const cur = formatValue(g.currentValue, g.unit)
        const tgt = formatValue(g.targetValue, g.unit)
        const pct = g.pct != null ? Math.min(100, Math.max(0, g.pct)) : 0
        return (
          <div key={g.id} className="grid grid-cols-12 gap-3 items-center px-4 py-3">
            <div className="col-span-12 md:col-span-3 flex items-center gap-2.5 min-w-0">
              <Avatar name={g.clientName} size="sm" />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-neutral-900 truncate">
                  {g.clientName} · {g.label}
                </div>
                <div className="text-[11px] text-neutral-500 truncate">
                  {humanHorizon(g.horizon)} · {g.direction === 'cap' ? `teto ${tgt}` : `meta ${tgt}`}
                </div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-7">
              <div className="flex justify-between text-xs mb-1">
                <span className="tabular text-neutral-700">
                  {cur} <span className="text-neutral-400">/ {tgt}</span>
                </span>
                <span className="tabular text-neutral-500">
                  {g.daysLeft > 0 ? `restam ${g.daysLeft}d` : 'prazo encerrado'}
                </span>
              </div>
              <ProgressBar value={pct} tone={tone} ariaLabel={`${g.label}: ${pct.toFixed(0)}%`} />
              <div className={`text-[10px] mt-1 ${toneText(tone)}`}>
                {g.pct == null
                  ? 'sem leitura no momento'
                  : g.direction === 'cap' && g.pct > 100
                  ? `estourado em ${(g.pct - 100).toFixed(0)}%`
                  : g.pct >= 100
                  ? 'meta batida'
                  : `${pct.toFixed(0)}% do alvo`}
              </div>
            </div>
            <div className="col-span-6 md:col-span-1 text-right">
              <span
                className={`text-[18px] font-bold tabular ${toneText(tone)}`}
              >
                {g.pct == null ? '—' : `${Math.round(g.pct)}%`}
              </span>
            </div>
            <div className="col-span-6 md:col-span-1 flex justify-end gap-1">
              <IconBtn label="editar" onClick={() => onEdit?.(g)}>
                <ArrowUpRight size={14} />
              </IconBtn>
              <IconBtn label="mais">
                <MoreHorizontal size={14} />
              </IconBtn>
            </div>
          </div>
        )
      })}
    </Card>
  )
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="w-7 h-7 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
    >
      {children}
    </button>
  )
}

function humanHorizon(h: AgencyGoal['horizon']) {
  switch (h) {
    case 'weekly':    return 'Semanal'
    case 'monthly':   return 'Mensal'
    case 'quarterly': return 'Trimestral'
    case 'yearly':    return 'Anual'
    default:          return 'Custom'
  }
}

function toneText(tone: ProgressTone): string {
  switch (tone) {
    case 'success': return 'text-success-600'
    case 'warning': return 'text-warning-600'
    case 'error':   return 'text-error-600'
    case 'info':    return 'text-info-600'
    default:        return 'text-neutral-700'
  }
}
