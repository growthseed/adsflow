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

import { useMemo } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'

import { PageHeader, ClientBrand } from '@/components/canonical'
import { WidgetRenderer } from '@/components/canonical/widgets'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import { getClientSnapshot } from '@/data/clientDashboardSnapshots'
import { getDashboardTemplate } from '@/data/dashboardTemplates'
import { useAuth } from '@/contexts/AuthContext'

export default function ClientPerformancePage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const navigate = useNavigate()
  const { activeClient } = useAuth()

  const client = useMemo(
    () => (clientSlug ? getClientBySlug(clientSlug) : undefined),
    [clientSlug],
  )

  const snapshot = useMemo(
    () => (clientSlug ? getClientSnapshot(clientSlug) : null),
    [clientSlug],
  )

  const template = useMemo(
    () => (snapshot ? getDashboardTemplate(snapshot.scope) : null),
    [snapshot],
  )

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
        subtitle={`${snapshot.period.label} · ${snapshot.scope === 'leads_b2b' ? 'Leads & CRM' : snapshot.scope === 'ecommerce' ? 'E-commerce' : snapshot.scope === 'pdv_local' ? 'PDV Local' : snapshot.scope === 'sales_inside' ? 'Inside Sales' : 'Personalizado'}`}
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
          <button
            type="button"
            onClick={() => navigate(`/c/${client.slug}/projeto`)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Ver projeto
          </button>
        }
      />

      <main className="max-w-layout mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <WidgetRenderer template={template} snapshot={snapshot} />
      </main>
    </div>
  )
}
