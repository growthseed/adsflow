/**
 * ============================================
 * Client Overview Page — AdFlow v4 (Sprint 1)
 * ============================================
 * Tela "Visão Geral do Cliente" — primeira que abre quando o
 * gestor entra num cliente. Layout opinativo:
 *
 *  1. Header: logo + nome + scope selector + period selector
 *  2. Hero strip: 4 KPI cards (do scope ativo) — TODOS GRANDES
 *  3. 3 charts em linha: Evolução · Por canal · Funil
 *  4. 3 highlight cards: insight · opportunity · urgent
 *  5. 3 module nav cards: Planner · Performance · Projeto
 *
 * Rota: /c/:clientSlug/overview
 * ============================================
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'

import {
  PageHeader,
  KPICard,
  ChartCard,
  ScopeSelector,
} from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import { getClientPerformance } from '@/services/adapters/performanceAdapter'
import type { ClientPerformance } from '@/services/adapters/performanceTypes'
import {
  getKPIsForScope,
  getEvolutionSeries,
  getChannelDistribution,
  getFunnelStages,
  getClientHighlights,
} from '@/data/mockPerformance'
import { formatMetric } from '@/lib/formatMetric'
import type { KPI, ProjectScopeId } from '@/types/metrics'

const PERIOD_OPTIONS = [
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'last_90_days', label: 'Últimos 90 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'this_quarter', label: 'Este trimestre' },
] as const

type Period = (typeof PERIOD_OPTIONS)[number]['value']

export default function ClientOverviewPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const navigate = useNavigate()

  const client = useMemo(
    () => (clientSlug ? getClientBySlug(clientSlug) : undefined),
    [clientSlug],
  )

  /** Real performance data if we have it, else undefined (fallback to mock) */
  const performance = useMemo(
    () => (clientSlug ? getClientPerformance(clientSlug) : undefined),
    [clientSlug],
  )

  // Default scope inference from industry (until persisted in Supabase)
  const defaultScope: ProjectScopeId = useMemo(() => {
    if (!client?.industry) return 'performance'
    const i = client.industry.toLowerCase()
    if (i.includes('educa')) return 'educacao'
    if (i.includes('saúde') || i.includes('saude') || i.includes('med')) return 'lead_gen'
    if (i.includes('ecomm') || i.includes('varej')) return 'ecommerce'
    return 'performance'
  }, [client?.industry])

  const [scope, setScope] = useState<ProjectScopeId>(defaultScope)
  const [period, setPeriod] = useState<Period>('last_30_days')

  if (!client) {
    return <Navigate to="/_v4/operations" replace />
  }

  // When performance snapshot exists, use REAL blended data for KPIs;
  // otherwise fall back to scope-based mocks.
  const kpis: KPI[] = performance
    ? buildRealKPIs(performance)
    : getKPIsForScope(scope)

  const evolution = getEvolutionSeries()
  const channels = performance ? buildRealChannels(performance) : getChannelDistribution()
  const funnel = getFunnelStages()
  const highlights = getClientHighlights()
  const totalSpend = channels.reduce((sum, c) => sum + c.value, 0)

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <PageHeader
        title={client.name}
        subtitle={[client.industry, client.city].filter(Boolean).join(' · ')}
        breadcrumbs={[
          { label: 'Operações', href: '/_v4/operations' },
          { label: client.name },
        ]}
        leading={
          <ClientAvatar gradient={client.avatar_gradient} name={client.short_name} />
        }
        actions={
          <div className="flex items-center gap-2">
            <ScopeSelector value={scope} onChange={setScope} />
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
        }
      />

      <main className="max-w-layout mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* ──────────────────────────────────────────────────
            HERO STRIP — 4 KPIs grandes do scope ativo
            ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Métricas de Sucesso
            </h2>
            <div className="flex items-center gap-1.5 text-2xs text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              Atualizado há 12 minutos
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <KPICard key={kpi.key} kpi={kpi} size="lg" showSource showGoal />
            ))}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────
            3 CHARTS — Evolução · Por canal · Funil
            ────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Visão Geral
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1 — Evolução */}
            <ChartCard
              title="Evolução das principais métricas"
              subtitle="Últimos 30 dias"
              height={240}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-conv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-mat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-success-500)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-success-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-neutral-200)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => d.slice(8, 10) + '/' + d.slice(5, 7)}
                    tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="conversoes"
                    stroke="var(--color-brand-600)"
                    fill="url(#grad-conv)"
                    strokeWidth={2}
                    name="Conversões"
                  />
                  <Area
                    type="monotone"
                    dataKey="matriculas"
                    stroke="var(--color-success-600)"
                    fill="url(#grad-mat)"
                    strokeWidth={2}
                    name="Matrículas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Chart 2 — Distribuição por canal */}
            <ChartCard
              title="Investimento por canal"
              subtitle={`Total: ${formatMetric(totalSpend, 'currency', { currency: 'BRL' })}`}
              height={240}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channels}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {channels.map((c) => (
                      <Cell key={c.name} fill={c.color} stroke="var(--surface-card)" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) =>
                      formatMetric(typeof v === 'number' ? v : 0, 'currency', {
                        currency: 'BRL',
                      })
                    }
                    contentStyle={{
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2 -mb-1">
                {channels.map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-2xs">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: c.color }}
                    />
                    <span className="text-neutral-700 font-medium">{c.name}</span>
                    <span className="text-neutral-400 tabular-nums">
                      {Math.round((c.value / totalSpend) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Chart 3 — Funil de leads */}
            <ChartCard title="Funil de Matrículas" subtitle="Conversão entre etapas" height={240}>
              <FunnelMini stages={funnel} />
            </ChartCard>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────
            HIGHLIGHTS — destaques da semana
            ────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Destaques da semana
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {highlights.map((h) => (
              <HighlightCard key={h.id} highlight={h} />
            ))}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────
            MODULE NAV — 3 botões pros pillars
            ────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Explorar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ModuleNavCard
              icon="📋"
              title="Planner"
              description="Estratégia e expectativas mapeadas como flow"
              accent="violet"
              onClick={() => navigate(`/c/${client.slug}/planner`)}
            />
            <ModuleNavCard
              icon="📊"
              title="Performance"
              description="Drill-down de campanhas, canais e métricas"
              accent="blue"
              onClick={() => navigate(`/c/${client.slug}/performance`)}
            />
            <ModuleNavCard
              icon="✅"
              title="Projeto"
              description="Demandas, prazos e prioridades no ClickUp"
              accent="emerald"
              onClick={() => navigate(`/c/${client.slug}/projeto`)}
            />
          </div>
        </section>

        {/* ──────────────────────────────────────────────────
            DEV NOTE — temporary, remove when wired to real data
            ────────────────────────────────────────────────── */}
        <div className="mt-8 p-3 rounded-lg bg-warning-50 border border-warning-100 text-xs text-warning-700 flex items-start gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            <strong>Dados de demonstração.</strong> Esta tela ainda usa mocks. Quando os adapters
            reais (Google Ads, Meta, Kommo) estiverem conectados via MCP, os números viram live.
          </span>
        </div>
      </main>
    </div>
  )
}

// =============================================================
// PIECES — small components used only by this page
// =============================================================

function ClientAvatar({ gradient, name }: { gradient: string; name: string }) {
  return (
    <div
      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0`}
      aria-hidden="true"
    >
      {name}
    </div>
  )
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period
  onChange: (v: Period) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Period)}
      className="
        bg-[var(--surface-card)] border border-[var(--border-default)]
        rounded-lg text-sm font-medium text-neutral-900
        px-3 py-2 cursor-pointer
        hover:border-brand-400 hover:bg-brand-50
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1
        transition-all duration-fast
      "
    >
      {PERIOD_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function FunnelMini({
  stages,
}: {
  stages: Array<{ stage: string; count: number; rate?: number }>
}) {
  const max = stages[0]?.count || 1
  return (
    <div className="space-y-2 h-full flex flex-col justify-center">
      {stages.map((s, i) => {
        const widthPct = (s.count / max) * 100
        return (
          <div key={s.stage}>
            <div className="flex items-center justify-between text-2xs text-neutral-500 mb-0.5">
              <span className="truncate font-medium">{s.stage}</span>
              <span className="tabular-nums flex-shrink-0 ml-2">
                {formatMetric(s.count, 'number')}
                {s.rate !== undefined && (
                  <span className="text-neutral-400 ml-1">
                    ({formatMetric(s.rate, 'percent')})
                  </span>
                )}
              </span>
            </div>
            <div className="h-5 bg-neutral-100 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-slow"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, var(--color-brand-500), var(--color-brand-700))`,
                  opacity: 1 - i * 0.12,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface HighlightCardProps {
  highlight: ReturnType<typeof getClientHighlights>[number]
}

function HighlightCard({ highlight }: HighlightCardProps) {
  const accents = {
    insight: {
      bg: 'bg-info-50',
      border: 'border-info-100',
      icon: 'text-info-600',
      label: 'Insight',
    },
    opportunity: {
      bg: 'bg-success-50',
      border: 'border-success-100',
      icon: 'text-success-600',
      label: 'Oportunidade',
    },
    urgent: {
      bg: 'bg-warning-50',
      border: 'border-warning-100',
      icon: 'text-warning-600',
      label: 'Urgente',
    },
  } as const

  const a = accents[highlight.type]

  return (
    <div
      className={`
        ${a.bg} ${a.border}
        border rounded-xl p-4
        transition-all duration-fast
        hover:shadow-md hover:-translate-y-0.5
        cursor-pointer
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`
            w-7 h-7 rounded-lg bg-white border ${a.border}
            flex items-center justify-center ${a.icon} flex-shrink-0
          `}
        >
          {highlight.type === 'opportunity' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          )}
          {highlight.type === 'insight' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
          {highlight.type === 'urgent' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </div>
        <span className={`text-2xs uppercase font-semibold tracking-wider ${a.icon}`}>
          {a.label}
        </span>
        {highlight.source_label && (
          <span className="text-2xs text-neutral-400 ml-auto">{highlight.source_label}</span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-neutral-900 leading-snug mb-1">
        {highlight.title}
      </h3>
      <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
        {highlight.description}
      </p>
      {highlight.cta && (
        <div className={`mt-3 text-xs font-medium ${a.icon} flex items-center gap-1`}>
          {highlight.cta}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      )}
    </div>
  )
}

interface ModuleNavCardProps {
  icon: string
  title: string
  description: string
  accent: 'violet' | 'blue' | 'emerald'
  onClick: () => void
}

function ModuleNavCard({ icon, title, description, accent, onClick }: ModuleNavCardProps) {
  const accents = {
    violet: {
      bg: 'bg-gradient-to-br from-violet-50 to-violet-100',
      border: 'hover:border-violet-300',
      iconBg: 'bg-violet-500',
      arrow: 'text-violet-600',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'hover:border-blue-300',
      iconBg: 'bg-blue-500',
      arrow: 'text-blue-600',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      border: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-500',
      arrow: 'text-emerald-600',
    },
  } as const

  const a = accents[accent]

  return (
    <button
      onClick={onClick}
      className={`
        text-left p-5 rounded-xl border border-transparent
        ${a.bg} ${a.border}
        transition-all duration-normal
        hover:shadow-lg hover:-translate-y-0.5
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
        group
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`
            w-12 h-12 rounded-xl ${a.iconBg}
            flex items-center justify-center text-2xl shadow-md
          `}
        >
          {icon}
        </div>
        <div
          className={`
            w-8 h-8 rounded-full bg-white/60 ${a.arrow}
            flex items-center justify-center
            transition-transform duration-fast
            group-hover:translate-x-1
          `}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">{title}</h3>
      <p className="text-xs text-neutral-600 leading-relaxed">{description}</p>
    </button>
  )
}

// =============================================================
// REAL DATA HELPERS — build KPIs and charts from snapshot
// =============================================================

function buildRealKPIs(performance: ClientPerformance): KPI[] {
  const b = performance.blended

  return [
    {
      key: 'real.spend',
      label: 'Investimento',
      description: 'Gasto total no período (cross-platform)',
      value: b.total_spend,
      unit: 'currency',
      currency: 'BRL',
      improvement_direction: 'neutral',
      source: 'blended',
    },
    {
      key: 'real.conversions',
      label: 'Conversões',
      description: 'Leads e conversões registradas',
      value: b.total_conversions,
      unit: 'number',
      improvement_direction: 'higher_better',
      source: 'blended',
    },
    {
      key: 'real.cpa',
      label: 'CPA',
      description: 'Custo por conversão',
      value: b.cost_per_conversion,
      unit: 'currency',
      currency: 'BRL',
      improvement_direction: 'lower_better',
      source: 'blended',
    },
    {
      key: 'real.reach',
      label: 'Alcance',
      description: 'Pessoas únicas impactadas',
      value: b.total_reach,
      unit: 'number',
      improvement_direction: 'higher_better',
      source: 'blended',
    },
  ]
}

function buildRealChannels(
  performance: ClientPerformance,
): Array<{ name: string; value: number; color: string; brand: 'meta_ads' | 'google_ads' | 'kommo' }> {
  const channels: Array<{
    name: string
    value: number
    color: string
    brand: 'meta_ads' | 'google_ads' | 'kommo'
  }> = []

  const meta = performance.platforms.meta_ads
  if (meta && meta.summary.spend > 0) {
    channels.push({
      name: 'Meta Ads',
      value: meta.summary.spend,
      color: '#0866FF',
      brand: 'meta_ads',
    })
  }

  const google = performance.platforms.google_ads
  if (google && google.summary.spend > 0) {
    channels.push({
      name: 'Google Ads',
      value: google.summary.spend,
      color: '#4285F4',
      brand: 'google_ads',
    })
  }

  return channels
}

