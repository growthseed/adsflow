/**
 * Google Ads Page — dados reais via Google Ads API v21 (GAQL)
 *
 * Rota: /c/:clientSlug/google-ads
 * Fonte: /api/integrations?op=google-ads-detail
 *
 * Layout (espelho do Meta Ads):
 *   1. KPIs totais (Investimento · Impressões · Cliques · Conversões · CPL · CTR)
 *   2. Filtro de período
 *   3. Tabela campanhas com métricas + status + tipo
 *   4. Bar chart Investimento por campanha
 */

import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import {
  BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  Banknote, Eye, MousePointer, Users, Target, AlertCircle, XCircle,
  Filter,
} from 'lucide-react'

import { PageHeader } from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import supabase from '@/lib/supabase'

interface CampaignMetrics {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conversions_value: number
  ctr: number
  cpc: number
  cpm: number
  cost_per_conversion: number
  search_impression_share: number
}

interface Campaign {
  id: string
  name: string
  status: string
  channel_type: string
  budget_daily: number
  metrics: CampaignMetrics
}

interface GoogleAdsPayload {
  client_slug: string
  account_id: string
  account_name: string | null
  currency: string
  preset: string
  returned: number
  campaigns: Campaign[]
  totals: CampaignMetrics & { roas: number }
  fetched_at: string
  cached?: boolean
}

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const BRL2 = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const INT = (v: number) => v.toLocaleString('pt-BR')
const PCT = (v: number, d = 2) => `${(v * 100).toFixed(d)}%`

const PRESETS = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'last_7d', label: 'Últimos 7 dias' },
  { key: 'last_14d', label: 'Últimos 14 dias' },
  { key: 'last_30d', label: 'Últimos 30 dias' },
  { key: 'last_90d', label: 'Últimos 90 dias' },
  { key: 'this_month', label: 'Este mês' },
  { key: 'last_month', label: 'Mês passado' },
]

function useGoogleAds(slug: string | undefined, preset: string) {
  const [state, setState] = useState<{
    data: GoogleAdsPayload | null
    loading: boolean
    note: string | null
    error: string | null
  }>({ data: null, loading: true, note: null, error: null })

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    ;(async () => {
      setState((s) => ({ ...s, loading: true, error: null, note: null }))
      try {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token
        if (!token) {
          if (!cancelled) setState({ data: null, loading: false, note: 'Sessão expirada.', error: null })
          return
        }
        const resp = await fetch(
          `/api/integrations?op=google-ads-detail&client_slug=${encodeURIComponent(slug)}&preset=${encodeURIComponent(preset)}`,
          { headers: { authorization: `Bearer ${token}` } },
        )
        if (resp.status === 501) {
          const j = (await resp.json()) as { note?: string }
          if (!cancelled) setState({ data: null, loading: false, note: j.note ?? 'Google Ads não configurado.', error: null })
          return
        }
        if (!resp.ok) {
          const j = (await resp.json().catch(() => ({}))) as { detail?: string; error?: string }
          throw new Error(j.detail || j.error || `HTTP ${resp.status}`)
        }
        const body = (await resp.json()) as GoogleAdsPayload
        if (!cancelled) setState({ data: body, loading: false, note: null, error: null })
      } catch (e) {
        if (!cancelled) setState({
          data: null, loading: false, note: null,
          error: e instanceof Error ? e.message : 'Erro',
        })
      }
    })()
    return () => { cancelled = true }
  }, [slug, preset])

  return state
}

function KpiTile({
  label, value, sub, icon: Icon, accent = 'brand',
}: {
  label: string; value: string; sub?: string; icon: React.ElementType
  accent?: 'brand' | 'success' | 'warning' | 'neutral'
}) {
  const accentColor = {
    brand: 'text-[var(--color-brand-600)]',
    success: 'text-[var(--color-success-600)]',
    warning: 'text-amber-500',
    neutral: 'text-[var(--text-tertiary)]',
  }[accent]
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-4" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-widest font-medium text-[var(--text-tertiary)]">{label}</span>
        <Icon className={`w-4 h-4 ${accentColor}`} />
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--text-tertiary)]">{sub}</div>}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const color = status === 'ENABLED'
    ? 'bg-[var(--color-success-50)] text-[var(--color-success-700)] border-[var(--color-success-600)]/40'
    : status === 'PAUSED'
      ? 'bg-amber-50 text-amber-700 border-amber-300'
      : 'bg-[var(--color-neutral-50)] text-[var(--text-tertiary)] border-[var(--border-subtle)]'
  const label = status === 'ENABLED' ? 'Ativa' : status === 'PAUSED' ? 'Pausada' : status
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${color}`}>{label}</span>
}

function ChannelBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    SEARCH: 'bg-blue-50 text-blue-700',
    DISPLAY: 'bg-purple-50 text-purple-700',
    VIDEO: 'bg-pink-50 text-pink-700',
    SHOPPING: 'bg-emerald-50 text-emerald-700',
    PERFORMANCE_MAX: 'bg-amber-50 text-amber-700',
    SMART: 'bg-indigo-50 text-indigo-700',
    DISCOVERY: 'bg-cyan-50 text-cyan-700',
  }
  const cls = colors[type] || 'bg-[var(--color-neutral-100)] text-[var(--text-tertiary)]'
  return <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${cls}`}>{type}</span>
}

interface GoogleAdsPageProps {
  clientSlugOverride?: string
  embedded?: boolean
}

export default function GoogleAdsPage({ clientSlugOverride, embedded = false }: GoogleAdsPageProps = {}) {
  const params = useParams<{ clientSlug: string }>()
  const clientSlug = clientSlugOverride ?? params.clientSlug
  const client = useMemo(() => (clientSlug ? getClientBySlug(clientSlug) : undefined), [clientSlug])
  const [preset, setPreset] = useState('last_30d')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all')

  const { data, loading, note, error } = useGoogleAds(clientSlug, preset)

  if (!client) {
    if (embedded) {
      return (
        <div className="rounded-lg border border-dashed border-[#DDE3EA] bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#152033]">Sem dados de Google Ads</p>
          <p className="mt-1 text-xs text-gray-500">A sincronização via n8n ainda não populou os dados de Google Ads deste período.</p>
        </div>
      )
    }
    return <Navigate to="/_v4/operations" replace />
  }

  const filtered = useMemo(() => {
    if (!data) return []
    if (statusFilter === 'all') return data.campaigns
    if (statusFilter === 'active') return data.campaigns.filter((c) => c.status === 'ENABLED')
    return data.campaigns.filter((c) => c.status !== 'ENABLED')
  }, [data, statusFilter])

  const chartData = useMemo(() => {
    if (!data) return []
    return [...data.campaigns]
      .filter((c) => c.metrics.spend > 0)
      .slice(0, 12)
      .map((c) => ({
        short: c.name.length > 22 ? c.name.slice(0, 19) + '…' : c.name,
        spend: c.metrics.spend,
      }))
  }, [data])

  const presetLabel = PRESETS.find((p) => p.key === preset)?.label ?? preset

  return (
    <div className="space-y-6">
      {!embedded && <PageHeader
        title="Google Ads · Performance"
        subtitle={data ? `${data.account_name ?? data.account_id} · ${presetLabel} · ${data.returned} campanhas` : `${client.name} · Google Ads`}
        breadcrumbs={[
          { label: client.name, href: `/c/${client.slug}/overview` },
          { label: 'Performance' },
          { label: 'Google Ads' },
        ]}
        actions={
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
          >
            {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        }
      />}

      {loading && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-10 text-center text-sm text-[var(--text-tertiary)]">
          Buscando campanhas via Google Ads API v21 (GAQL, refresh OAuth automático)...
        </div>
      )}

      {!loading && note && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Google Ads pendente</h4>
            <p className="text-xs text-[var(--text-tertiary)]">{note}</p>
            <Link to="/integrations" className="text-xs text-[var(--color-brand-600)] underline mt-2 inline-block">Configurar →</Link>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="bg-[var(--surface-card)] border border-[var(--color-error-600)]/40 rounded-xl p-6 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-[var(--color-error-600)] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Falha</h4>
            <p className="text-xs text-[var(--text-tertiary)]">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* KPIs */}
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <KpiTile label="Investimento" value={BRL(data.totals.spend)} icon={Banknote} accent="brand" />
            <KpiTile label="Impressões" value={INT(data.totals.impressions)} icon={Eye} />
            <KpiTile label="Cliques" value={INT(data.totals.clicks)} icon={MousePointer} />
            <KpiTile label="Conversões" value={INT(data.totals.conversions)} icon={Users} accent="success" />
            <KpiTile label="CPL" value={data.totals.conversions > 0 ? BRL2(data.totals.cost_per_conversion) : '—'} icon={Target} accent="warning" />
            <KpiTile label="CTR" value={data.totals.impressions > 0 ? PCT(data.totals.ctr) : '—'} icon={Eye} />
          </section>

          {/* Bar chart */}
          {chartData.length > 0 && (
            <section className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Investimento por campanha</h3>
              <p className="text-xs text-[var(--text-tertiary)] mb-4">Top 12 com gasto no período</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -10, right: 8 }}>
                    <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="short" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={60} interval={0} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [BRL2(Number(v ?? 0)), 'Investimento']}
                    />
                    <Bar dataKey="spend" fill="var(--color-brand-600)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Status filter */}
          <section className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-tertiary)]">Status:</span>
            {(['all', 'active', 'paused'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                  statusFilter === s
                    ? 'bg-[var(--color-brand-50)] border-[var(--color-brand-600)] text-[var(--color-brand-700)] font-semibold'
                    : 'bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
                }`}
              >
                {s === 'all' ? `Todas (${data.campaigns.length})`
                  : s === 'active' ? `Ativas (${data.campaigns.filter((c) => c.status === 'ENABLED').length})`
                  : `Pausadas (${data.campaigns.filter((c) => c.status !== 'ENABLED').length})`}
              </button>
            ))}
            <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">
              GAQL · {new Date(data.fetched_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {data.cached && ' · cache'}
            </span>
          </section>

          {/* Tabela campanhas */}
          <section className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-soft)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-neutral-50)] border-b border-[var(--border-subtle)]">
                    <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Campanha</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Tipo</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Status</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Orç./d</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Investido</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Impressões</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Cliques</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">CTR</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">CPC</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Conv.</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">CPL</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={11} className="px-5 py-8 text-center text-sm text-[var(--text-tertiary)]">Nenhuma campanha nesse filtro.</td></tr>
                  ) : filtered.map((c) => (
                    <tr key={c.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--color-neutral-50)]">
                      <td className="px-5 py-2 font-medium text-[var(--text-primary)] truncate max-w-[260px]" title={c.name}>{c.name}</td>
                      <td className="px-3 py-2"><ChannelBadge type={c.channel_type} /></td>
                      <td className="px-3 py-2"><StatusPill status={c.status} /></td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--text-tertiary)]">{c.budget_daily > 0 ? BRL2(c.budget_daily) : '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--text-primary)]">{BRL2(c.metrics.spend)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--text-primary)]">{INT(c.metrics.impressions)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--text-primary)]">{INT(c.metrics.clicks)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--text-primary)]">{c.metrics.impressions > 0 ? PCT(c.metrics.ctr) : '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--text-primary)]">{c.metrics.clicks > 0 ? BRL2(c.metrics.cpc) : '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--text-primary)]">{INT(c.metrics.conversions)}</td>
                      <td className="px-5 py-2 text-right tabular-nums font-semibold text-[var(--color-brand-600)]">
                        {c.metrics.conversions > 0 ? BRL2(c.metrics.cost_per_conversion) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
