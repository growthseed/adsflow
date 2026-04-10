/**
 * ============================================
 * Client Overview Page — AdFlow v4 (TDD v3.0)
 * ============================================
 * The landing screen when the client (or the agency gestor) opens
 * a client context. This is the "vitrine" — it needs to look great
 * and feel personal.
 *
 * Structure:
 *   1. Humanized welcome block ("Boa tarde, Isaac. Foram gerados
 *      54 leads esta semana...")
 *   2. Hero KPI strip (5 KPIs from the snapshot)
 *   3. Primary chart (area) — "Resultados diários"
 *   4. Channel distribution donut + funnel OR gauge
 *   5. Module cards (Planner · Performance · Projeto)
 *
 * Rota: /c/:clientSlug/overview
 * ============================================
 */

import { useMemo } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowRight, TrendingUp, Layout, Briefcase } from 'lucide-react'

import {
  PageHeader,
  ClientBrand,
  KPICard,
  LineChartWidget,
  DonutChartWidget,
  FunnelChartWidget,
  GaugeWidget,
} from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import { getClientSnapshot } from '@/data/clientDashboardSnapshots'
import { humanizeSnapshot } from '@/lib/humanizeSnapshot'
import { useAuth } from '@/contexts/AuthContext'
import type { SnapshotKPI } from '@/types/clientDashboardSnapshot'

export default function ClientOverviewPage() {
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

  const welcome = useMemo(
    () => (snapshot ? humanizeSnapshot(snapshot) : null),
    [snapshot],
  )

  if (!client) return <Navigate to="/_v4/operations" replace />

  // Pick 5 KPIs from the snapshot — the first key in each nicho's config
  // is already the "primary" one by design (e.g. leads, revenue, reach).
  const kpiOrder = snapshot
    ? Object.values(snapshot.kpis).slice(0, 5)
    : ([] as SnapshotKPI[])

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <PageHeader
        title={client.name}
        subtitle={[client.industry, client.city].filter(Boolean).join(' · ')}
        leading={
          <ClientBrand
            name={client.name}
            slug={client.slug}
            logoUrl={activeClient?.client.logo_url}
            size="xl"
            showName={false}
          />
        }
        breadcrumbs={[
          { label: 'Operações', href: '/_v4/operations' },
          { label: client.name },
        ]}
        actions={
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/c/${client.slug}/performance`)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Performance
            </button>
            <button
              type="button"
              onClick={() => navigate(`/c/${client.slug}/projeto`)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Projeto
            </button>
          </div>
        }
      />

      <main className="max-w-layout mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ─── 1. HUMANIZED WELCOME ──────────────────────────── */}
        {welcome && snapshot && (
          <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl p-6 sm:p-8 text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
            <div className="relative">
              <div className="text-xs font-medium uppercase tracking-widest text-blue-200 mb-2">
                {snapshot.period.label}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
                {welcome.greeting}
              </h1>
              <div className="space-y-2 max-w-3xl text-sm sm:text-base text-blue-50 leading-relaxed">
                {welcome.body.map((sentence, i) => (
                  <p key={i}>{sentence}</p>
                ))}
              </div>
              {welcome.cta && (
                <button
                  type="button"
                  onClick={() => navigate(`/c/${client.slug}/performance`)}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                >
                  {welcome.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </section>
        )}

        {/* ─── 2. HERO KPI STRIP ──────────────────────────────── */}
        {snapshot && kpiOrder.length > 0 && (
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {kpiOrder.map((k) => (
                <KPICard
                  key={k.key}
                  kpi={{
                    key: k.key,
                    label: k.label,
                    value: k.value,
                    previous_value: k.previous_value,
                    delta_percent: k.delta_percent,
                    trend: k.trend ?? 'flat',
                    improvement_direction: k.improvement_direction ?? 'higher_better',
                    unit: k.unit,
                    currency: k.currency,
                    goal: k.goal,
                    sparkline: k.sparkline,
                    source: 'blended',
                  }}
                  size="md"
                  showSparkline
                  showGoal
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── 3. MAIN EVOLUTION CHART ────────────────────────── */}
        {snapshot && snapshot.timeseries.daily.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <LineChartWidget
                title="Evolução do período"
                subtitle="Dados diários"
                data={snapshot.timeseries.daily}
                xKey="date"
                series={
                  snapshot.scope === 'ecommerce'
                    ? [
                        { key: 'revenue', label: 'Receita', color: '#10b981' },
                        { key: 'spend', label: 'Investimento', color: '#64748b' },
                      ]
                    : snapshot.scope === 'pdv_local'
                      ? [
                          { key: 'reach', label: 'Alcance', color: '#3b82f6' },
                          { key: 'impressions', label: 'Impressões', color: '#8b5cf6' },
                        ]
                      : [
                          { key: 'leads', label: 'Leads', color: '#3b82f6' },
                          { key: 'spend', label: 'Investimento', color: '#f59e0b' },
                        ]
                }
                formatX={(v) => {
                  const d = new Date(v)
                  return `${d.getDate()}/${d.getMonth() + 1}`
                }}
                formatY={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
              />
            </div>
            <div>
              {snapshot.funnel ? (
                <FunnelChartWidget
                  title="Funil"
                  subtitle="Etapas de conversão"
                  stages={snapshot.funnel.stages}
                />
              ) : snapshot.kpis.roas ? (
                <GaugeWidget
                  title="ROAS atual"
                  subtitle="Meta vs realizado"
                  value={snapshot.kpis.roas.value}
                  goal={snapshot.kpis.roas.goal ?? 4}
                  valueLabel={snapshot.kpis.roas.value.toFixed(2).replace('.', ',')}
                  goalLabel={String(snapshot.kpis.roas.goal ?? 4)}
                />
              ) : (
                <DonutChartWidget
                  title="Distribuição por canal"
                  data={snapshot.channels}
                  centerLabel="TOTAL"
                  centerValue={snapshot.blended.spend_formatted}
                />
              )}
            </div>
          </section>
        )}

        {/* ─── 4. MODULE NAV CARDS ────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <ModuleCard
            title="Planner"
            description="Estratégia visual das campanhas"
            icon={<Layout className="w-5 h-5" />}
            color="from-violet-500 to-purple-600"
            onClick={() => navigate(`/c/${client.slug}/planner`)}
          />
          <ModuleCard
            title="Performance"
            description="Métricas completas de mídia"
            icon={<TrendingUp className="w-5 h-5" />}
            color="from-blue-500 to-indigo-600"
            onClick={() => navigate(`/c/${client.slug}/performance`)}
          />
          <ModuleCard
            title="Projeto"
            description="Entregas e tarefas da Efeito"
            icon={<Briefcase className="w-5 h-5" />}
            color="from-emerald-500 to-teal-600"
            onClick={() => navigate(`/c/${client.slug}/projeto`)}
          />
        </section>
      </main>
    </div>
  )
}

// =============================================================
// MODULE CARD
// =============================================================

interface ModuleCardProps {
  title: string
  description: string
  icon: React.ReactNode
  color: string
  onClick: () => void
}

function ModuleCard({ title, description, icon, color, onClick }: ModuleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-sm mb-3`}
      >
        {icon}
      </div>
      <div className="text-sm font-semibold text-slate-900 mb-0.5">{title}</div>
      <div className="text-xs text-slate-500">{description}</div>
      <ArrowRight className="absolute top-5 right-5 w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
    </button>
  )
}
