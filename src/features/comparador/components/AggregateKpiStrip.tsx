import { Card, Delta } from '@/components/primitives'
import { formatMetric } from '@/lib/formatMetric'
import type { ComparadorAggregate } from '../hooks/useComparadorData'

interface Props {
  aggregate: ComparadorAggregate
}

/**
 * 4 KPIs no topo do Comparador. Layout col-3 × 4 no grid-12.
 * Handoff V2: label eyebrow 11px + valor 26px tabular + delta abaixo.
 */
export function AggregateKpiStrip({ aggregate }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <KpiCard
        label="Total investido"
        value={formatMetric(aggregate.totalSpend, 'currency', { compact: true })}
        delta={aggregate.spendDelta}
      />
      <KpiCard
        label="Leads gerados"
        value={aggregate.totalLeads.toLocaleString('pt-BR')}
        delta={aggregate.leadsDelta}
      />
      <KpiCard
        label="CPL médio"
        value={aggregate.avgCpl != null ? formatMetric(aggregate.avgCpl, 'currency') : '—'}
        delta={aggregate.cplDelta}
        betterIs="lower"
      />
      <KpiCard
        label="ROAS médio"
        value={aggregate.avgRoas != null ? `${aggregate.avgRoas.toFixed(1)}×` : '—'}
        delta={aggregate.roasDelta}
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  delta,
  betterIs = 'higher',
}: {
  label: string
  value: string
  delta: number | null
  betterIs?: 'higher' | 'lower'
}) {
  return (
    <Card className="p-4">
      <div className="eyebrow text-neutral-500">{label}</div>
      <div className="text-[26px] font-bold tabular leading-tight mt-1 text-neutral-900">{value}</div>
      {delta != null ? (
        <div className="mt-1.5">
          <Delta value={delta} betterIs={betterIs} />
          <span className="ml-1.5 text-[11px] text-neutral-500">vs período anterior</span>
        </div>
      ) : (
        <div className="mt-1.5 text-[11px] text-neutral-400">comparativo indisponível</div>
      )}
    </Card>
  )
}
