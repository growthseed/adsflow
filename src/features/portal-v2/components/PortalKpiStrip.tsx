import { Delta } from '@/components/primitives'
import { formatMetric } from '@/lib/formatMetric'

interface Props {
  leads: number
  cpl: number | null
  roas: number | null
  leadsDelta?: number | null
  cplDelta?: number | null
  roasDelta?: number | null
}

/**
 * KPI strip fixa do Portal mobile. Só 3 KPIs (Leads · CPL · ROAS)
 * por design — CTR, CPM etc. nunca aparecem no portal do cliente.
 */
export function PortalKpiStrip({
  leads,
  cpl,
  roas,
  leadsDelta = null,
  cplDelta = null,
  roasDelta = null,
}: Props) {
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
      <Cell
        label="ROAS"
        value={roas != null ? `${roas.toFixed(1)}×` : '—'}
        delta={roasDelta}
        divider
      />
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
