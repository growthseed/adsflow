import { Link } from 'react-router-dom'
import { Sparkles, Target } from 'lucide-react'

import { Card, CardBody, CardHead, ProgressBar } from '@/components/primitives'
import { formatMetric } from '@/lib/formatMetric'
import type { HojeData } from '../hooks/useHojeData'

interface Props {
  goals: HojeData['goals']
  aiTip?: string
  periodLabel: string
  daysLeft: number
}

export function GoalsCard({ goals, aiTip, periodLabel, daysLeft }: Props) {
  return (
    <Card className="col-span-12 lg:col-span-4 min-h-[280px] flex flex-col">
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <Target size={16} className="text-brand-600" />
            Metas do mês
          </span>
        }
        subtitle={`Carteira · ${periodLabel} · restam ${daysLeft} dias`}
      />
      <CardBody className="flex-1 space-y-4">
        {goals.map((g) => {
          const pct =
            g.target != null && g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0
          const currentLabel =
            g.unit === 'currency' ? formatMetric(g.current, 'currency') : g.current.toLocaleString('pt-BR')
          const targetLabel =
            g.target == null
              ? null
              : g.unit === 'currency'
              ? formatMetric(g.target, 'currency')
              : g.target.toLocaleString('pt-BR')

          return (
            <div key={g.key}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-600">{g.label}</span>
                <span className="text-neutral-900">
                  {g.target == null ? (
                    <GoalEmptyCta />
                  ) : (
                    <>
                      <b className="tabular">{currentLabel}</b>{' '}
                      <span className="text-neutral-500">/ {targetLabel}</span>
                    </>
                  )}
                </span>
              </div>
              <ProgressBar
                value={pct}
                tone={g.tone}
                ariaLabel={`${g.label}: ${pct}% da meta`}
              />
              <div className="text-[11px] text-neutral-500 mt-1">{g.status}</div>
            </div>
          )
        })}
        {aiTip && (
          <div className="relative mt-2 rounded-lg bg-brand-50 border border-brand-100 px-3 py-2.5 text-[12px] leading-snug text-brand-700">
            <div className="eyebrow text-brand-600 mb-1 flex items-center gap-1.5">
              <Sparkles size={11} /> Insight da IA
            </div>
            {aiTip}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function GoalEmptyCta() {
  return (
    <Link
      to="/alerts"
      className="text-[11px] font-semibold text-brand-700 hover:text-brand-900"
    >
      Configurar →
    </Link>
  )
}
