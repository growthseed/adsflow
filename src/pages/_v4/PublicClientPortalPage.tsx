/**
 * ============================================
 * PUBLIC CLIENT PORTAL — token-based, no auth required
 * ============================================
 * Route: /portal/:token
 *
 * IMPORTANT: This page renders the SAME content as the internal
 * client pages (Overview, Performance, Projeto) but without the
 * Sidebar/AppLayout shell. The client gets the full experience
 * with charts, widgets, template engine — not a stripped-down version.
 *
 * Layout: minimal header (logo + name + "Falar com gestor") + tab
 * navigation (Visão Geral / Performance / Projeto) + full content.
 *
 * Security: token is a 32-char hex (128 bits entropy). RPC returns
 * only slug+name+logo. Data comes from the same snapshot the
 * internal pages use.
 * ============================================
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart3, Layout, Briefcase, TrendingUp, ArrowRight } from 'lucide-react'

import supabase from '@/lib/supabase'
import { ClientBrand, KPICard, FunnelChartWidget, GaugeWidget, DonutChartWidget, LineChartWidget } from '@/components/canonical'
import { WidgetRenderer } from '@/components/canonical/widgets'
import { getClientSnapshot } from '@/data/clientDashboardSnapshots'
import { getDashboardTemplate } from '@/data/dashboardTemplates'
import { humanizeSnapshot } from '@/lib/humanizeSnapshot'
import { getClientPortalBundle } from '@/services/clientPortalService'
import type { SnapshotKPI } from '@/types/clientDashboardSnapshot'

// Portal task components
import TaskTimeline from '@/components/ClientPortal/TaskTimeline'
import PortalEmptyState from '@/components/ClientPortal/PortalEmptyState'

interface ResolvedClient {
  slug: string
  name: string
  logo_url: string | null
  industry: string | null
}

type PortalTab = 'overview' | 'performance' | 'projeto'

const TABS: Array<{ id: PortalTab; label: string; icon: typeof BarChart3 }> = [
  { id: 'overview', label: 'Visão Geral', icon: Layout },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'projeto', label: 'Projeto', icon: Briefcase },
]

export default function PublicClientPortalPage() {
  const { token } = useParams<{ token: string }>()
  const [client, setClient] = useState<ResolvedClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PortalTab>('overview')

  useEffect(() => {
    if (!token) {
      setError('Link inválido.')
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc(
          'resolve_portal_token',
          { p_token: token },
        )
        if (rpcError) throw rpcError
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setError('Link expirado ou desativado. Entre em contato com a Efeito Digital.')
          return
        }
        const row = Array.isArray(data) ? data[0] : data
        setClient(row as ResolvedClient)
      } catch (err) {
        console.error('[PublicPortal] resolve_portal_token failed:', err)
        setError('Erro ao carregar o painel. Tente novamente.')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const snapshot = useMemo(
    () => (client?.slug ? getClientSnapshot(client.slug) : null),
    [client],
  )
  const template = useMemo(
    () => (snapshot ? getDashboardTemplate(snapshot.scope) : null),
    [snapshot],
  )
  const welcome = useMemo(
    () => (snapshot ? humanizeSnapshot(snapshot) : null),
    [snapshot],
  )
  const bundle = useMemo(
    () => (client?.slug ? getClientPortalBundle(client.slug) : null),
    [client],
  )

  const kpiOrder = snapshot
    ? Object.values(snapshot.kpis).slice(0, 5)
    : ([] as SnapshotKPI[])

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando seu painel...</p>
        </div>
      </div>
    )
  }

  // --- Error ---
  if (error || !client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 mb-2">
            {error || 'Painel não encontrado'}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Se você recebeu esse link de um gestor da Efeito Digital, entre em contato.
          </p>
          <a href="mailto:jw@efeito.digital" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Falar com a Efeito Digital
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <ClientBrand
            name={client.name}
            slug={client.slug}
            logoUrl={client.logo_url}
            size="md"
            subtitle={client.industry ?? undefined}
          />
          <a
            href="mailto:jw@efeito.digital"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Falar com meu gestor
          </a>
        </div>

        {/* ── TAB NAVIGATION ───────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* ── CONTENT ────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* === VISÃO GERAL TAB === */}
        {activeTab === 'overview' && (
          <>
            {/* Welcome */}
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
                    {welcome.body.map((s, i) => (
                      <p key={i}>{s}</p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('performance')}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    Ver detalhes da performance
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* KPI Strip */}
            {kpiOrder.length > 0 && (
              <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
              </section>
            )}

            {/* Charts row */}
            {snapshot && snapshot.timeseries.daily.length > 0 && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <LineChartWidget
                    title="Evolução do período"
                    subtitle="Dados diários"
                    data={snapshot.timeseries.daily}
                    xKey="date"
                    series={[
                      { key: 'leads', label: 'Leads', color: '#3b82f6' },
                      { key: 'spend', label: 'Investimento', color: '#f59e0b' },
                    ]}
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
                      valueLabel={snapshot.kpis.roas.value.toFixed(2)}
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
          </>
        )}

        {/* === PERFORMANCE TAB === */}
        {activeTab === 'performance' && (
          <>
            {snapshot && template ? (
              <WidgetRenderer template={template} snapshot={snapshot} />
            ) : (
              <PortalEmptyState
                title="Performance em preparação"
                description="Os dados de performance serão exibidos aqui assim que forem sincronizados."
              />
            )}
          </>
        )}

        {/* === PROJETO TAB === */}
        {activeTab === 'projeto' && (
          <>
            {bundle?.roadmap && bundle.roadmap.tasks.length > 0 ? (
              <>
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">Progresso do projeto</span>
                    <span className="text-xs font-semibold tabular-nums text-slate-900">{bundle.roadmap.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${bundle.roadmap.progress_percentage}%` }}
                    />
                  </div>
                </div>
                <TaskTimeline tasks={bundle.roadmap.tasks} />
              </>
            ) : (
              <PortalEmptyState
                title="Nada por aqui ainda"
                description="As entregas do projeto aparecem aqui automaticamente conforme são registradas."
              />
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="text-center py-8 px-6 border-t border-slate-200 mt-8">
        <p className="text-[11px] text-slate-400">
          Painel de acompanhamento gerenciado pela Efeito Digital
        </p>
        <a href="https://efeito.digital" target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:text-blue-700">
          efeito.digital
        </a>
      </footer>
    </div>
  )
}
