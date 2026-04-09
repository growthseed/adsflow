/**
 * Design System Showcase — AdFlow v4
 * Rota temporária pra visualizar os componentes canônicos.
 * Acessível em /_v4/design-system
 */

import {
  BrandLogo,
  SUPPORTED_BRANDS,
  KPICard,
  ChartCard,
  PageHeader,
  EmptyState,
  ScopeSelector,
} from '@/components/canonical'
import { useState } from 'react'
import type { KPI, ProjectScopeId } from '@/types/metrics'

const sampleKPIs: KPI[] = [
  {
    key: 'perf.cpl',
    label: 'CPL',
    value: 42.18,
    previous_value: 45.9,
    delta_percent: -0.081,
    trend: 'down',
    improvement_direction: 'lower_better',
    unit: 'currency',
    currency: 'BRL',
    goal: 45,
    sparkline: [52, 48, 50, 47, 46, 44, 43, 42, 41, 42],
    source: 'blended',
  },
  {
    key: 'perf.conversions',
    label: 'Matrículas',
    value: 17,
    previous_value: 15,
    delta_percent: 0.133,
    trend: 'up',
    improvement_direction: 'higher_better',
    unit: 'number',
    goal: 20,
    sparkline: [8, 10, 9, 12, 11, 13, 14, 15, 16, 17],
    source: 'kommo',
  },
  {
    key: 'perf.roas',
    label: 'ROAS',
    value: 3.2,
    previous_value: 2.8,
    delta_percent: 0.143,
    trend: 'up',
    improvement_direction: 'higher_better',
    unit: 'ratio',
    goal: 3.0,
    sparkline: [2.1, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2],
    source: 'blended',
  },
  {
    key: 'perf.impression_share',
    label: 'Impression Share',
    value: 0.64,
    previous_value: 0.66,
    delta_percent: -0.03,
    trend: 'down',
    improvement_direction: 'higher_better',
    unit: 'percent',
    goal: 0.75,
    sparkline: [0.7, 0.68, 0.69, 0.67, 0.66, 0.65, 0.64, 0.64, 0.63, 0.64],
    source: 'google_ads',
  },
]

export default function DesignSystemPage() {
  const [scope, setScope] = useState<ProjectScopeId>('performance')

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <PageHeader
        title="Design System — AdFlow v4"
        subtitle="Showcase dos componentes canônicos"
        breadcrumbs={[{ label: 'Dev' }, { label: 'Design System' }]}
        actions={<ScopeSelector value={scope} onChange={setScope} />}
      />

      <main className="max-w-layout mx-auto px-6 py-8 space-y-10">
        {/* Brand logos */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Brand Logos</h2>
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-6">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6">
              {SUPPORTED_BRANDS.map((brand) => (
                <div key={brand} className="flex flex-col items-center gap-2">
                  <BrandLogo brand={brand} size={48} />
                  <span className="text-xs text-neutral-500 text-center">{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KPI Cards — 4 tamanhos */}
        <section>
          <h2 className="text-lg font-semibold mb-4">KPI Cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleKPIs.map((kpi) => (
              <KPICard key={kpi.key} kpi={kpi} size="lg" showSource />
            ))}
          </div>

          <h3 className="text-sm font-medium text-neutral-600 mt-6 mb-3">
            Variante: clickable + compact
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sampleKPIs.map((kpi) => (
              <KPICard
                key={`sm-${kpi.key}`}
                kpi={kpi}
                size="sm"
                compact
                onClick={() => console.log(kpi.key)}
              />
            ))}
          </div>

          <h3 className="text-sm font-medium text-neutral-600 mt-6 mb-3">
            Loading state
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPICard kpi={sampleKPIs[0]} loading />
            <KPICard kpi={sampleKPIs[0]} loading />
            <KPICard kpi={sampleKPIs[0]} loading />
            <KPICard kpi={sampleKPIs[0]} loading />
          </div>
        </section>

        {/* Chart Cards */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Chart Cards</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title="Evolução das métricas" subtitle="últimos 30 dias">
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                (chart slot — recharts vai aqui)
              </div>
            </ChartCard>
            <ChartCard title="Distribuição por canal" loading />
            <ChartCard title="Funil de leads" empty emptyMessage="Sincronize o Kommo para ver" />
          </div>
        </section>

        {/* Empty state */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Empty State</h2>
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl">
            <EmptyState
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                  <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
                </svg>
              }
              title="Nenhum relatório ainda"
              description="Crie seu primeiro relatório para este cliente. Você pode começar de um template ou do zero."
              action={
                <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
                  Criar relatório
                </button>
              }
            />
          </div>
        </section>
      </main>
    </div>
  )
}
