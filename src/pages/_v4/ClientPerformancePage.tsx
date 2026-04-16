/**
 * ============================================
 * Client Performance Page — AdFlow v4 (TDD v3.0)
 * ============================================
 * Template-driven dashboard. Reads:
 *   1. The client's nicho (snapshot.scope)
 *   2. The dashboard template for that nicho
 *   3. The client dashboard snapshot (mock or live)
 *
 * Renders the whole layout via <WidgetRenderer />. No widget is
 * hardcoded here — everything comes from the template config.
 *
 * Rota: /c/:clientSlug/performance
 * ============================================
 */

import { useMemo, useState, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { subDays, format } from 'date-fns'

import { PageHeader, ClientBrand } from '@/components/canonical'
import { WidgetRenderer } from '@/components/canonical/widgets'
import DateRangeSelector from '@/components/UI/DateRangeSelector'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import { getClientSnapshot } from '@/data/clientDashboardSnapshots'
import { getDashboardTemplate } from '@/data/dashboardTemplates'
import { downloadClientReport } from '@/lib/generateClientReport'
import { useAuth } from '@/contexts/AuthContext'

interface DateRange {
  startDate: Date
  endDate: Date
}

export default function ClientPerformancePage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const navigate = useNavigate()
  const { activeClient } = useAuth()

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 29),
    endDate: new Date(),
  })

  const client = useMemo(
    () => (clientSlug ? getClientBySlug(clientSlug) : undefined),
    [clientSlug],
  )

  const rawSnapshot = useMemo(
    () => (clientSlug ? getClientSnapshot(clientSlug) : null),
    [clientSlug],
  )

  const snapshot = useMemo(() => {
    if (!rawSnapshot) return null
    const from = format(dateRange.startDate, 'yyyy-MM-dd')
    const to = format(dateRange.endDate, 'yyyy-MM-dd')
    const days = Math.round((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / 864e5) + 1
    const label = `${format(dateRange.startDate, 'dd/MM')} — ${format(dateRange.endDate, 'dd/MM/yyyy')}`

    const daily = rawSnapshot.timeseries?.daily?.filter((row) => {
      const d = String(row.date ?? row.day ?? '')
      return d >= from && d <= to
    }) ?? rawSnapshot.timeseries?.daily

    return {
      ...rawSnapshot,
      period: { from, to, label, days },
      timeseries: { ...rawSnapshot.timeseries, daily },
    }
  }, [rawSnapshot, dateRange])

  const template = useMemo(
    () => (snapshot ? getDashboardTemplate(snapshot.scope) : null),
    [snapshot],
  )

  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range)
  }, [])

  if (!client) return <Navigate to="/_v4/operations" replace />

  // If we somehow don't have a snapshot for this client yet, show a
  // friendly "em breve" state — do NOT 404, because the client exists
  // in the static AgencyClient map.
  if (!snapshot || !template) {
    return (
      <div className="min-h-screen bg-[var(--surface-page)]">
        <PageHeader
          title="Performance"
          subtitle={client.name}
          leading={
            <ClientBrand
              name={client.name}
              slug={client.slug}
              logoUrl={activeClient?.client.logo_url}
              size="lg"
              showName={false}
            />
          }
          breadcrumbs={[
            { label: 'Operações', href: '/_v4/operations' },
            { label: client.name, href: `/c/${client.slug}/overview` },
            { label: 'Performance' },
          ]}
        />
        <main className="max-w-layout mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center">
            <div className="text-5xl mb-3">📊</div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Performance em preparação
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Estamos configurando as métricas desse cliente. Em breve o
              dashboard aparece aqui com os dados reais de mídia.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <PageHeader
        title="Performance"
        subtitle={`${snapshot.period.label} (${snapshot.period.days}d) · ${snapshot.scope === 'leads_b2b' ? 'Leads & CRM' : snapshot.scope === 'ecommerce' ? 'E-commerce' : snapshot.scope === 'pdv_local' ? 'PDV Local' : snapshot.scope === 'sales_inside' ? 'Inside Sales' : 'Personalizado'}`}
        leading={
          <ClientBrand
            name={client.name}
            slug={client.slug}
            logoUrl={activeClient?.client.logo_url}
            size="lg"
            showName={false}
          />
        }
        breadcrumbs={[
          { label: 'Operações', href: '/_v4/operations' },
          { label: client.name, href: `/c/${client.slug}/overview` },
          { label: 'Performance' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <DateRangeSelector value={dateRange} onChange={handleDateChange} />
            <button
              type="button"
              onClick={() => {
                if (!snapshot || !client) return
                downloadClientReport({
                  clientName: client.name,
                  clientSlug: client.slug,
                  periodLabel: snapshot.period.label,
                  periodFrom: snapshot.period.from,
                  periodTo: snapshot.period.to,
                  snapshot,
                })
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 bg-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Gerar PDF
            </button>
            <button
              type="button"
              onClick={() => navigate(`/c/${client.slug}/projeto`)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Ver projeto
            </button>
          </div>
        }
      />

      <main className="max-w-layout mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <WidgetRenderer template={template} snapshot={snapshot} />
      </main>
    </div>
  )
}
