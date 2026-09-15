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
import { ArrowRight, FileText, TrendingUp, Layout, Briefcase } from 'lucide-react'

import {
  PageHeader,
  ClientBrand,
  KPICard,
  LineChartWidget,
  DonutChartWidget,
  FunnelChartWidget,
  GaugeWidget,
} from '@/components/canonical'
import { getClientSnapshot } from '@/data/clientDashboardSnapshots'
import { useClientGoals } from '@/hooks/useClientGoals'
import { useResolvedAgencyClient } from '@/hooks/useResolvedAgencyClient'
import { humanizeSnapshot } from '@/lib/humanizeSnapshot'
import { useAuth } from '@/contexts/AuthContext'
import type { SnapshotKPI } from '@/types/clientDashboardSnapshot'
import { BlendedPaidTrafficCard } from './components/BlendedPaidTrafficCard'
import { KommoCrmCard } from './components/KommoCrmCard'

export default function ClientOverviewPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const navigate = useNavigate()
  const { activeClient } = useAuth()

  const client = useResolvedAgencyClient(clientSlug)

  const snapshot = useMemo(
    () => (clientSlug ? getClientSnapshot(clientSlug) : null),
    [clientSlug],
  )

  const welcome = useMemo(
    () => (snapshot ? humanizeSnapshot(snapshot) : null),
    [snapshot],
  )

  // Editable goals from Supabase
  const { getGoal, upsertGoal } = useClientGoals(activeClient?.client_id)

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
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-1.5 rounded-lg transition-colors"
            >
              Performance
            </button>
            <button
              type="button"
              onClick={() => navigate(`/c/${client.slug}/projeto`)}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-1.5 rounded-lg transition-colors"
            >
              Projeto
            </button>
            <button
              type="button"
              onClick={() => navigate(`/c/${client.slug}/report`)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-1.5 rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Report
            </button>
          </div>
        }
      />

      <main className="max-w-layout mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ─── 1. HUMANIZED WELCOME ──────────────────────────── */}
        {welcome && snapshot && (
          <section className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-elegant)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
            <div className="relative">
              <div className="text-xs font-medium uppercase tracking-widest text-white/60 mb-2">
                {snapshot.period.label}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
                {welcome.greeting}
              </h1>
              <div className="space-y-2 max-w-3xl text-sm sm:text-base text-white/80 leading-relaxed">
                {welcome.body.map((sentence, i) => (
                  <p key={i}>{sentence}</p>
                ))}
              </div>
              {welcome.cta && (
                <button
                  type="button"
                  onClick={() => navigate(`/c/${client.slug}/performance`)}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-white text-[var(--color-brand-700)] rounded-lg text-sm font-semibold hover:bg-[var(--color-brand-50)] transition-colors shadow-lg"
                >
                  {welcome.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </section>
        )}

        {/* ─── 1.5 · Tráfego pago consolidado (Meta + Google) ─── */}
        {clientSlug && <BlendedPaidTrafficCard clientSlug={clientSlug} />}

        {/* ─── 1.6 · CRM Kommo (MQL/SQL + conversão) ─────────── */}
        {clientSlug && <KommoCrmCard clientSlug={clientSlug} />}

        {/* ─── 2. HERO KPI STRIP ──────────────────────────────── */}
        {snapshot && kpiOrder.length > 0 && (
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {kpiOrder.map((k) => {
                const dbGoal = getGoal(k.key)
                const isLower = k.improvement_direction === 'lower_better'
                const goalType = isLower ? 'expectativa' as const : 'meta' as const
                return (
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
                      goal: dbGoal?.goal_value ?? k.goal,
                      sparkline: k.sparkline,
                      source: 'blended',
                    }}
                    size="md"
                    showSparkline
                    showGoal
                    editableGoal={{
                      value: dbGoal?.goal_value ?? k.goal,
                      type: goalType,
                      onSave: (newValue) => {
                        upsertGoal(k.key, newValue, goalType, isLower ? 'lower_better' : 'higher_better')
                      },
                    }}
                  />
                )
              })}
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

        {/* ─── 4. PROJECT HIGHLIGHTS ───────────────────────────── */}
        {client && (client.stats.urgent > 0 || client.stats.in_progress > 0 || client.upcoming_tasks.length > 0) && (
          <section className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Destaques do projeto</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {client.stats.total_active} tarefas ativas · {client.stats.overdue} atrasadas
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/c/${client.slug}/projeto`)}
                className="text-xs font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-800)] flex items-center gap-1"
              >
                Ver todas
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-4 divide-x divide-[var(--border-subtle)] bg-[var(--surface-sunken)]">
              <div className="px-4 py-3 text-center">
                <div className="text-lg font-bold text-[var(--text-primary)]">{client.stats.in_progress}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Em andamento</div>
              </div>
              <div className="px-4 py-3 text-center">
                <div className="text-lg font-bold text-[var(--text-primary)]">{client.stats.review}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Em revisão</div>
              </div>
              <div className="px-4 py-3 text-center">
                <div className={`text-lg font-bold ${client.stats.urgent > 0 ? 'text-[var(--color-error-600)]' : 'text-[var(--text-primary)]'}`}>{client.stats.overdue}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Atrasadas</div>
              </div>
              <div className="px-4 py-3 text-center">
                <div className="text-lg font-bold text-[var(--color-success-600)]">{client.stats.done}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Concluídas</div>
              </div>
            </div>

            {/* Upcoming tasks */}
            {client.upcoming_tasks.length > 0 && (
              <div className="divide-y divide-[var(--border-subtle)]">
                {client.upcoming_tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-neutral-50)] transition-colors">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        task.status === 'urgent' ? 'bg-red-500' :
                        task.status === 'in_progress' ? 'bg-[var(--color-brand-500)]' :
                        task.status === 'review' ? 'bg-amber-500' :
                        task.status === 'done' ? 'bg-emerald-500' :
                        'bg-[var(--color-neutral-400)]'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-[var(--text-primary)] truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.list_name && (
                          <span className="text-[10px] text-[var(--text-tertiary)]">{task.list_name}</span>
                        )}
                        {task.due_date_label && (
                          <span className={`text-[10px] font-medium ${
                            task.days_late && task.days_late > 0 ? 'text-[var(--color-error-600)]' : 'text-[var(--text-tertiary)]'
                          }`}>
                            {task.due_date_label}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.assignees.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: a.color }}
                        title={a.username}
                      >
                        {a.initial}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── 5. MODULE NAV CARDS ────────────────────────────── */}
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
      className="group relative overflow-hidden bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] rounded-2xl p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-sm mb-3`}
      >
        {icon}
      </div>
      <div className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{title}</div>
      <div className="text-xs text-[var(--text-tertiary)]">{description}</div>
      <ArrowRight className="absolute top-5 right-5 w-4 h-4 text-[var(--color-neutral-300)] group-hover:text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-all" />
    </button>
  )
}
