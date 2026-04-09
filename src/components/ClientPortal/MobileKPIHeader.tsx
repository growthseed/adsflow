/**
 * Client Portal — Mobile KPI Header
 *
 * Sticky 3-column grid of the three KPIs the portal exposes to end
 * clients: Total Spend, Leads, CPA. Mobile-first; gains padding on
 * sm+ but the layout stays 3-col at every breakpoint.
 *
 * If `kpi` is null we still render the grid with "—" placeholders so
 * the layout doesn't shift between loading and loaded states.
 */

import type { ClientPortalKPI } from '@/types/clientPortal'

interface MobileKPIHeaderProps {
  kpi: ClientPortalKPI | null
}

export default function MobileKPIHeader({ kpi }: MobileKPIHeaderProps) {
  return (
    <div className="bg-slate-50 px-3 py-3 sm:px-6 sm:py-4">
      {kpi?.period_label && (
        <div className="mb-2 text-[11px] font-medium text-slate-500 uppercase tracking-wide">
          {kpi.period_label}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <KPICard
          label="Investimento"
          value={kpi ? formatCurrency(kpi.totalSpend, kpi.currency) : '—'}
        />
        <KPICard
          label="Leads"
          value={kpi ? formatNumber(kpi.leads) : '—'}
        />
        <KPICard
          label="Custo / Lead"
          value={kpi?.cpa != null ? formatCurrency(kpi.cpa, kpi.currency) : '—'}
        />
      </div>
    </div>
  )
}

interface KPICardProps {
  label: string
  value: string
}

function KPICard({ label, value }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col gap-1">
      <div className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
        {label}
      </div>
      <div className="text-lg sm:text-2xl font-bold text-slate-900 tabular-nums leading-tight truncate">
        {value}
      </div>
    </div>
  )
}

// --- helpers ---------------------------------------------------------

function formatCurrency(v: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(v)
  } catch {
    return `R$ ${Math.round(v).toLocaleString('pt-BR')}`
  }
}

function formatNumber(v: number): string {
  return v.toLocaleString('pt-BR')
}
