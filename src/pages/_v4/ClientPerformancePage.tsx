/**
 * ============================================
 * Client Performance Page — AdFlow v4 (Sprint 3)
 * ============================================
 * Módulo "Performance" — drill-down completo das métricas.
 * Consome dados reais do Meta Ads + Google Ads (snapshot JSON
 * populado via MCP fetch).
 *
 * Hierarquia:
 *   1. Header: cliente + scope + period + platform filter
 *   2. Blended KPI strip (cross-platform)
 *   3. Tabs por plataforma (Meta Ads / Google Ads / Blended)
 *   4. Platform detail: daily chart + campaigns table
 *
 * Rota: /c/:clientSlug/performance
 * ============================================
 */

import { useMemo, useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'

import { PageHeader, KPICard, ChartCard, BrandLogo, EmptyState } from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import { getClientPerformance } from '@/services/adapters/performanceAdapter'
import type {
  Campaign,
  AdPlatform,
  ClientPerformance,
} from '@/services/adapters/performanceTypes'
import type { KPI, KPISource } from '@/types/metrics'
import { formatMetric } from '@/lib/formatMetric'

type PlatformTab = 'all' | 'meta_ads' | 'google_ads'

export default function ClientPerformancePage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const navigate = useNavigate()

  const client = useMemo(
    () => (clientSlug ? getClientBySlug(clientSlug) : undefined),
    [clientSlug],
  )

  const performance = useMemo(
    () => (clientSlug ? getClientPerformance(clientSlug) : undefined),
    [clientSlug],
  )

  const [platformTab, setPlatformTab] = useState<PlatformTab>('all')

  if (!client) return <Navigate to="/_v4/operations" replace />

  // Empty state — client exists on ClickUp but no performance data yet
  if (!performance) {
    return (
      <div className="min-h-screen bg-[var(--surface-page)]">
        <PageHeader
          title="Performance"
          subtitle={client.name}
          breadcrumbs={[
            { label: 'Operações', href: '/_v4/operations' },
            { label: client.name, href: `/c/${client.slug}/overview` },
            { label: 'Performance' },
          ]}
          leading={<ClientAvatar gradient={client.avatar_gradient} name={client.short_name} />}
        />
        <main className="max-w-layout mx-auto px-4 sm:px-6 py-8">
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl">
            <EmptyState
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M7 14l4-4 4 4 6-6" />
                </svg>
              }
              title="Sem dados de performance"
              description="Este cliente ainda não tem contas Meta Ads ou Google Ads conectadas. Conecte as integrações para ver os números aqui."
              action={
                <button
                  onClick={() => navigate('/integrations')}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  Ir para Integrações
                </button>
              }
            />
          </div>
        </main>
      </div>
    )
  }

  const { platforms, period } = performance
  const hasMeta = !!platforms.meta_ads?.connected
  const hasGoogle = !!platforms.google_ads?.connected

  // Auto-select the only connected platform if just one
  const effectiveTab: PlatformTab =
    platformTab === 'all' && hasMeta && !hasGoogle
      ? 'meta_ads'
      : platformTab === 'all' && !hasMeta && hasGoogle
        ? 'google_ads'
        : platformTab

  // Build 4 KPI cards from blended metrics
  const kpis = buildBlendedKPIs(performance)

  // Filter campaigns by selected platform
  const campaigns: Campaign[] = useMemo(() => {
    const meta = platforms.meta_ads?.campaigns || []
    const google = platforms.google_ads?.campaigns || []
    if (effectiveTab === 'meta_ads') return meta
    if (effectiveTab === 'google_ads') return google
    return [...meta, ...google].sort((a, b) => b.metrics.spend - a.metrics.spend)
  }, [effectiveTab, platforms])

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <PageHeader
        title="Performance"
        subtitle={`${client.name} · ${period.label}`}
        breadcrumbs={[
          { label: 'Operações', href: '/_v4/operations' },
          { label: client.name, href: `/c/${client.slug}/overview` },
          { label: 'Performance' },
        ]}
        leading={<ClientAvatar gradient={client.avatar_gradient} name={client.short_name} />}
      />

      <main className="max-w-layout mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ──────────────────────────────────────────────────
            BLENDED KPI STRIP
            ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Resumo do período
            </h2>
            <div className="flex items-center gap-1.5 text-2xs text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
              Dados reais — sincronizado {relativeTime(performance.last_synced_at)}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <KPICard key={kpi.key} kpi={kpi} size="lg" showSource showGoal={false} />
            ))}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────
            PLATFORM TABS
            ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)]">
            <TabButton
              active={effectiveTab === 'all'}
              onClick={() => setPlatformTab('all')}
              disabled={!hasMeta || !hasGoogle}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Blended
            </TabButton>
            <TabButton
              active={effectiveTab === 'meta_ads'}
              onClick={() => setPlatformTab('meta_ads')}
              disabled={!hasMeta}
            >
              <BrandLogo brand="meta_ads" size={16} />
              Meta Ads
              {hasMeta && platforms.meta_ads && (
                <span className="text-2xs text-neutral-500 tabular-nums">
                  {formatMetric(platforms.meta_ads.summary.spend, 'currency')}
                </span>
              )}
            </TabButton>
            <TabButton
              active={effectiveTab === 'google_ads'}
              onClick={() => setPlatformTab('google_ads')}
              disabled={!hasGoogle}
            >
              <BrandLogo brand="google_ads" size={16} />
              Google Ads
              {hasGoogle && platforms.google_ads && (
                <span className="text-2xs text-neutral-500 tabular-nums">
                  {formatMetric(platforms.google_ads.summary.spend, 'currency')}
                </span>
              )}
            </TabButton>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────
            PLATFORM CAMPAIGNS TABLE
            ────────────────────────────────────────────────── */}
        <section>
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Campanhas</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {campaigns.length} {campaigns.length === 1 ? 'campanha' : 'campanhas'}
                  {' · '}ordenadas por investimento
                </p>
              </div>
            </div>

            {campaigns.length === 0 ? (
              <EmptyState
                compact
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                }
                title="Nenhuma campanha neste filtro"
                description="Troque de plataforma ou ajuste o período."
              />
            ) : (
              <CampaignsTable campaigns={campaigns} />
            )}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────
            PLATFORM DEEP-DIVE (só aparece quando 1 plataforma selecionada)
            ────────────────────────────────────────────────── */}
        {effectiveTab !== 'all' && (
          <PlatformDeepDive
            performance={performance}
            platform={effectiveTab}
          />
        )}

        {/* Dev note */}
        <div className="p-3 rounded-lg bg-success-50 border border-success-100 text-xs text-success-700 flex items-start gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>
            <strong>Dados reais sincronizados.</strong> Snapshot de {period.label} via MCP Meta Ads
            {hasGoogle && ' + Google Ads'}. Cron diário refresca automaticamente quando habilitado.
          </span>
        </div>
      </main>
    </div>
  )
}

// =============================================================
// BUILD KPIs FROM BLENDED METRICS
// =============================================================

function buildBlendedKPIs(performance: ClientPerformance): KPI[] {
  const { blended } = performance

  return [
    {
      key: 'perf.spend',
      label: 'Investimento',
      description: 'Gasto total no período (cross-platform)',
      value: blended.total_spend,
      unit: 'currency',
      currency: 'BRL',
      improvement_direction: 'neutral',
      source: 'blended',
    },
    {
      key: 'perf.conversions',
      label: 'Conversões',
      description: 'Leads + ações de conversão',
      value: blended.total_conversions,
      unit: 'number',
      improvement_direction: 'higher_better',
      source: 'blended',
    },
    {
      key: 'perf.cost_per_conversion',
      label: 'Custo por conversão',
      value: blended.cost_per_conversion,
      unit: 'currency',
      currency: 'BRL',
      improvement_direction: 'lower_better',
      source: 'blended',
    },
    {
      key: 'perf.reach',
      label: 'Alcance',
      description: 'Pessoas únicas impactadas',
      value: blended.total_reach,
      unit: 'number',
      improvement_direction: 'higher_better',
      source: 'blended',
    },
  ]
}

// =============================================================
// CAMPAIGNS TABLE
// =============================================================

function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--surface-sunken)] text-2xs uppercase tracking-wider text-neutral-500">
            <th className="text-left px-4 py-2.5 font-semibold">Campanha</th>
            <th className="text-right px-3 py-2.5 font-semibold">Invest.</th>
            <th className="text-right px-3 py-2.5 font-semibold hidden md:table-cell">Impr.</th>
            <th className="text-right px-3 py-2.5 font-semibold hidden md:table-cell">Cliques</th>
            <th className="text-right px-3 py-2.5 font-semibold hidden lg:table-cell">CTR</th>
            <th className="text-right px-3 py-2.5 font-semibold hidden lg:table-cell">CPC</th>
            <th className="text-right px-3 py-2.5 font-semibold">Conv.</th>
            <th className="text-right px-3 py-2.5 font-semibold hidden md:table-cell">CPA</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className="border-t border-[var(--border-subtle)] hover:bg-neutral-50 transition-colors">
              <td className="px-4 py-3 min-w-0">
                <div className="flex items-center gap-2.5">
                  <BrandLogo brand={c.platform} size={16} className="flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusDot status={c.status} />
                      <span className="font-medium text-neutral-900 truncate">{c.name}</span>
                    </div>
                    {c.campaign_type && (
                      <span className="text-2xs text-neutral-500">{c.campaign_type}</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-right tabular-nums font-semibold text-neutral-900">
                {formatMetric(c.metrics.spend, 'currency')}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-neutral-600 hidden md:table-cell">
                {formatMetric(c.metrics.impressions, 'number', { compact: true })}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-neutral-600 hidden md:table-cell">
                {formatMetric(c.metrics.clicks, 'number')}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-neutral-600 hidden lg:table-cell">
                {formatMetric(c.metrics.ctr, 'percent')}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-neutral-600 hidden lg:table-cell">
                {formatMetric(c.metrics.cpc, 'currency')}
              </td>
              <td className="px-3 py-3 text-right tabular-nums font-semibold text-neutral-900">
                {formatMetric(c.metrics.conversions, 'number')}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-neutral-600 hidden md:table-cell">
                {c.metrics.cost_per_conversion > 0
                  ? formatMetric(c.metrics.cost_per_conversion, 'currency')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// =============================================================
// PLATFORM DEEP-DIVE
// =============================================================

function PlatformDeepDive({
  performance,
  platform,
}: {
  performance: ClientPerformance
  platform: AdPlatform
}) {
  const account = performance.platforms[platform]
  if (!account) return null

  const s = account.summary

  return (
    <section>
      <ChartCard
        title={`${platform === 'meta_ads' ? 'Meta Ads' : 'Google Ads'} — detalhe da conta`}
        subtitle={`${account.account_name} (${account.currency})`}
        height={140}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-full">
          <MiniMetric label="CTR" value={formatMetric(s.ctr, 'percent')} />
          <MiniMetric label="CPC" value={formatMetric(s.cpc, 'currency')} />
          <MiniMetric label="CPM" value={formatMetric(s.cpm, 'currency')} />
          <MiniMetric
            label="Campanhas ativas"
            value={`${s.active_campaigns}/${s.total_campaigns}`}
          />
        </div>
      </ChartCard>
    </section>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface-sunken)] rounded-lg p-3 flex flex-col justify-center">
      <div className="text-xs text-neutral-500 uppercase tracking-wider font-medium">{label}</div>
      <div className="text-xl font-bold text-neutral-900 tabular-nums mt-1">{value}</div>
    </div>
  )
}

// =============================================================
// SMALL PIECES
// =============================================================

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 px-4 py-3 text-sm font-medium
        border-b-2 -mb-px transition-all duration-fast
        ${active
          ? 'border-brand-600 text-brand-700'
          : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
      `}
    >
      {children}
    </button>
  )
}

function StatusDot({ status }: { status: Campaign['status'] }) {
  const colors: Record<Campaign['status'], string> = {
    enabled: 'bg-success-500 ring-success-100',
    paused: 'bg-neutral-400 ring-neutral-100',
    removed: 'bg-error-500 ring-error-100',
    learning: 'bg-warning-500 ring-warning-100',
    limited: 'bg-warning-500 ring-warning-100',
  }
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ring-2 flex-shrink-0 ${colors[status]}`}
      aria-label={status}
      title={status}
    />
  )
}

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

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return 'agora mesmo'
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

// Prevent unused-import warnings
void (undefined as unknown as KPISource)
