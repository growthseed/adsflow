import { Delta } from '@/components/primitives'
import { formatMetric } from '@/lib/formatMetric'

interface Props {
  leads: number
  cpl: number | null
  roas: number | null
  /** Investimento do período — substitui ROAS no terceiro slot quando ROAS=null */
  spend?: number | null
  leadsDelta?: number | null
  cplDelta?: number | null
  roasDelta?: number | null
  spendDelta?: number | null
}

/**
 * KPI strip fixa do Portal mobile. Mostra 3 KPIs.
 * Quando o cliente não tem ROAS configurado (vertical lead-gen,
 * sem revenue tracking), o terceiro slot vira "Investimento".
 */
export function PortalKpiStrip({
  leads,
  cpl,
  roas,
  spend = null,
  leadsDelta = null,
  cplDelta = null,
  roasDelta = null,
  spendDelta = null,
}: Props) {
  const showRoas = roas != null && roas > 0

  return (
    <div className="grid grid-cols-3 bg-white">
      <Cell label="Leads" value={leads.toLocaleString('pt-BR')} delta={leadsDelta} />
      <Cell
        label="CPL"
        value={cpl != null ? formatMetric(cpl, 'currency') : '—'}
        delta={cplDelta}
        betterIs="lower"
        divider
      />
      {showRoas ? (
        <Cell
          label="ROAS"
          value={`${roas.toFixed(1)}×`}
          delta={roasDelta}
          divider
        />
      ) : (
        <Cell
          label="Investimento"
          value={spend != null ? formatMetric(spend, 'currency') : '—'}
          delta={spendDelta}
          divider
        />
      )}
    </div>
  )
}

function Cell({
  label,
  value,
  delta,
  betterIs = 'higher',
  divider = false,
}: {
  label: string
  value: string
  delta: number | null
  betterIs?: 'higher' | 'lower'
  divider?: boolean
}) {
  return (
    <div className={`px-4 py-3 ${divider ? 'border-l border-neutral-100' : ''}`}>
      <div className="eyebrow text-neutral-500">{label}</div>
      <div className="text-[22px] font-bold tabular text-neutral-900 mt-0.5 leading-none">
        {value}
      </div>
      {delta != null && (
        <div className="mt-1">
          <Delta value={delta} betterIs={betterIs} />
        </div>
      )}
    </div>
  )
}
