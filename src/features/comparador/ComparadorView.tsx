import { useDateRange } from '@/contexts/DateRangeContext'
import DateRangeSelector from '@/components/UI/DateRangeSelector'

import { useComparadorData } from './hooks/useComparadorData'
import { AggregateKpiStrip } from './components/AggregateKpiStrip'
import { ComparisonTable } from './components/ComparisonTable'
import { InsightCallouts } from './components/InsightCallouts'
import { formatMetric } from '@/lib/formatMetric'

/**
 * Home > view "Comparador" — visão densa de toda a carteira lado a
 * lado. Handoff V2 spec #1. Dados compõem ClickUp (saúde/urgência)
 * + Performance snapshot (spend/leads/CPL/ROAS). Campos ausentes
 * renderizam "—" como requerido.
 */
export default function ComparadorView() {
  const { dateRange, setDateRange } = useDateRange()
  const { rows, aggregate, insights } = useComparadorData()

  const footerSpend = formatMetric(aggregate.totalSpend, 'currency', { compact: true })
  const footerCpl = aggregate.avgCpl != null ? formatMetric(aggregate.avgCpl, 'currency') : '—'

  return (
    <div className="max-w-layout mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.01em] text-neutral-900">
            Comparador de clientes
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Visão densa de toda a carteira · comparativo do período vs. anterior
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </div>
      </header>

      <AggregateKpiStrip aggregate={aggregate} />
      <ComparisonTable rows={rows} />

      <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-neutral-500 mt-3 px-1">
        <span>
          {aggregate.clientCount} {aggregate.clientCount === 1 ? 'cliente' : 'clientes'} ·{' '}
          <b className="text-neutral-900 tabular">{footerSpend}</b> investido ·{' '}
          <b className="text-neutral-900 tabular">{aggregate.totalLeads.toLocaleString('pt-BR')}</b> leads · CPL médio{' '}
          <b className="text-neutral-900 tabular">{footerCpl}</b>
        </span>
        <span>atualizado {aggregate.lastSyncLabel}</span>
      </footer>

      <InsightCallouts insights={insights} />
    </div>
  )
}
