import { Card, Delta } from '@/components/primitives'
import { formatMetric } from '@/lib/formatMetric'
import type { PacingAggregate } from '../hooks/usePacingData'

interface Props {
  aggregate: PacingAggregate
}

export function PacingSummary({ aggregate }: Props) {
  const spendPct =
    aggregate.totalBudget > 0 ? Math.round((aggregate.totalSpend / aggregate.totalBudget) * 100) : null
  const projectedDelta =
    aggregate.totalBudget > 0
      ? ((aggregate.totalProjected - aggregate.totalBudget) / aggregate.totalBudget) * 100
      : null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <Card className="p-4">
        <div className="eyebrow text-neutral-500">Budget total · carteira</div>
        <div className="text-[24px] font-bold tabular mt-1">
          {aggregate.totalBudget > 0 ? formatMetric(aggregate.totalBudget, 'currency', { compact: true }) : '—'}
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5">
          meta do mês · {aggregate.totalBudget > 0 ? 'configurado' : 'sem budget definido'}
        </div>
      </Card>
      <Card className="p-4">
        <div className="eyebrow text-neutral-500">Investido até hoje</div>
        <div className="text-[24px] font-bold tabular mt-1">
          {formatMetric(aggregate.totalSpend, 'currency', { compact: true })}
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5">
          {spendPct != null ? (
            <>
              <b className="text-success-600 tabular">{spendPct}%</b> do budget
            </>
          ) : (
            'sem budget configurado'
          )}
        </div>
      </Card>
      <Card className="p-4">
        <div className="eyebrow text-neutral-500">Projeção fim do mês</div>
        <div className="text-[24px] font-bold tabular mt-1">
          {formatMetric(aggregate.totalProjected, 'currency', { compact: true })}
        </div>
        <div className="text-[11px] mt-0.5">
          {projectedDelta != null ? (
            <Delta value={projectedDelta} betterIs="lower" />
          ) : (
            <span className="text-neutral-500">projeção linear</span>
          )}
        </div>
      </Card>
      <Card className="p-4">
        <div className="eyebrow text-neutral-500">Clientes fora do ritmo</div>
        <div
          className={`text-[24px] font-bold tabular mt-1 ${
            aggregate.offPaceCount > 0 ? 'text-warning-600' : 'text-neutral-900'
          }`}
        >
          {aggregate.offPaceCount}
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5">
          {aggregate.aheadCount} adiantados · {aggregate.behindCount} atrasados
        </div>
      </Card>
    </div>
  )
}
