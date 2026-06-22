/**
 * BI · Visão Geral cross-channel — inspirada nos templates Power BI
 * (Dashboard Padrão CRM Kommo + Meta Ads + Google Ads).
 *
 * Rota: /c/:clientSlug/bi/visao-geral
 * Dados:
 *   - Mídia: performance-snapshot.json (Meta + Google blended)
 *   - CRM:   /api/integrations?op=clint-funnel (CHAMADA REAL — sem mock)
 *
 * KPIs principais (espelham as âncoras DAX do PBI):
 *   • Investimento Total (Meta + Google)
 *   • Leads gerados (conversions de mídia)
 *   • Custo por Lead (CPL Total)
 *   • Funil CRM: Abertos / Oportunidades / Vendas
 *   • Ticket Médio · Tempo médio de fechamento
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  Area, AreaChart, BarChart, Bar, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  Banknote, Users, Target, TrendingUp, Trophy, XCircle, Clock as ClockIcon, AlertCircle,
} from 'lucide-react'

import { PageHeader } from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import perfSnapshot from '@/data/snapshots/performance-snapshot.json'
import supabase from '@/lib/supabase'

// ------------------------------------------------------------------
// Types (subset of performance-snapshot.json para o que usamos aqui)
// ------------------------------------------------------------------

interface PerfPlatform {
  platform: 'meta_ads' | 'google_ads'
  account_name?: string
  currency?: string
  connected?: boolean
  summary: {
    spend: number
    impressions: number
    clicks: number
    conversions?: number
    reach?: number
    ctr?: number
    cpc?: number
    cpm?: number
    cost_per_conversion?: number
    roas?: number
  }
  daily?: Array<{
    date: string
    spend: number
    impressions: number
    clicks: number
    conversions?: number
  }>
}

interface PerfClient {
  client_slug: string
  client_name: string
  period: { from: string; to: string; label: string }
  platforms: {
    meta_ads?: PerfPlatform
    google_ads?: PerfPlatform
  }
  blended?: {
    total_spend: number
    total_impressions: number
    total_clicks: number
    total_conversions?: number
    avg_ctr?: number
    avg_cpc?: number
    avg_cpm?: number
    cost_per_conversion?: number
    roas?: number
  }
  last_synced_at?: string
}

interface PerfSnapshot {
  captured_at: string
  clients: Record<string, PerfClient>
}

interface ClintFunnel {
  client_slug: string
  provider: 'clint'
  counts: { open: number; won: number; lost: number; total: number }
  conversion: { won_rate: number; won_rate_opportunities: number }
  value: { won_total: number; won_avg: number; currency: string }
  timing: { avg_days_to_win: number; median_days_to_win: number | null }
  fetched_at: string
}

const perfTyped = perfSnapshot as unknown as PerfSnapshot

// ------------------------------------------------------------------
// Formatters
// ------------------------------------------------------------------

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const BRL2 = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const INT = (v: number) => v.toLocaleString('pt-BR')

const PCT = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`

const formatDays = (n: number) =>
  n < 1 ? '< 1 dia' : n < 30 ? `${n.toFixed(1)} dias` : `${(n / 30).toFixed(1)} meses`

// ------------------------------------------------------------------
// KPI Cell (cartão padrão do PBI)
// ------------------------------------------------------------------

function KpiCell({
  label, value, sub, icon: Icon, accent,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
}) {
  const accentColor = {
    brand: 'text-[var(--color-brand-600)]',
    success: 'text-[var(--color-success-600)]',
    warning: 'text-amber-500',
    danger: 'text-[var(--color-error-600)]',
    neutral: 'text-[var(--text-tertiary)]',
  }[accent ?? 'neutral']

  return (
    <div
      className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-4"
      style={{ boxShadow: 'var(--shadow-soft)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-widest font-medium text-[var(--text-tertiary)]">{label}</span>
        <Icon className={`w-4 h-4 ${accentColor}`} />
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--text-tertiary)]">{sub}</div>}
    </div>
  )
}

// ------------------------------------------------------------------
// Loaders
// ------------------------------------------------------------------

function getPerf(slug: string): PerfClient | null {
  return perfTyped.clients[slug] ?? null
}

function useClintFunnel(slug: string | undefined) {
  const [state, setState] = useState<{
    data: ClintFunnel | null
    loading: boolean
    note: string | null
    error: string | null
  }>({ data: null, loading: true, note: null, error: null })

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    ;(async () => {
      setState({ data: null, loading: true, note: null, error: null })
      try {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token
        if (!token) {
          if (!cancelled) setState({ data: null, loading: false, note: 'Sessão expirada.', error: null })
          return
        }
        const resp = await fetch(`/api/integrations?op=clint-funnel&client_slug=${encodeURIComponent(slug)}`, {
          headers: { authorization: `Bearer ${token}` },
        })
        if (resp.status === 501) {
          const j = (await resp.json()) as { note?: string }
          if (!cancelled) setState({ data: null, loading: false, note: j.note ?? 'Clint não configurado.', error: null })
          return
        }
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const body = (await resp.json()) as ClintFunnel
        if (!cancelled) setState({ data: body, loading: false, note: null, error: null })
      } catch (e) {
        if (!cancelled) setState({
          data: null, loading: false, note: null,
          error: e instanceof Error ? e.message : 'Erro ao carregar CRM',
        })
      }
    })()
    return () => { cancelled = true }
  }, [slug])

  return state
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

export default function BiVisaoGeralPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const client = useMemo(() => (clientSlug ? getClientBySlug(clientSlug) : undefined), [clientSlug])
  const perf = useMemo(() => (clientSlug ? getPerf(clientSlug) : null), [clientSlug])
  const crm = useClintFunnel(clientSlug)

  if (!client) return <Navigate to="/_v4/operations" replace />

  // ----- Agregados de mídia -----
  const meta = perf?.platforms.meta_ads
  const google = perf?.platforms.google_ads

  const spendMeta = meta?.summary.spend ?? 0
  const spendGoogle = google?.summary.spend ?? 0
  const spendTotal = spendMeta + spendGoogle

  const leadsMeta = meta?.summary.conversions ?? 0
  const leadsGoogle = google?.summary.conversions ?? 0
  const leadsTotal = leadsMeta + leadsGoogle

  const impMeta = meta?.summary.impressions ?? 0
  const impGoogle = google?.summary.impressions ?? 0
  const impTotal = impMeta + impGoogle

  const clkMeta = meta?.summary.clicks ?? 0
  const clkGoogle = google?.summary.clicks ?? 0
  const clkTotal = clkMeta + clkGoogle

  const cplTotal = leadsTotal > 0 ? spendTotal / leadsTotal : 0
  const ctrTotal = impTotal > 0 ? clkTotal / impTotal : 0
  const cpmTotal = impTotal > 0 ? (spendTotal / impTotal) * 1000 : 0

  // ----- Daily series para área stacked (Meta vs Google) -----
  const dailySeries = useMemo(() => {
    const map = new Map<string, { date: string; meta: number; google: number }>()
    for (const d of meta?.daily ?? []) {
      const row = map.get(d.date) ?? { date: d.date, meta: 0, google: 0 }
      row.meta += d.spend
      map.set(d.date, row)
    }
    for (const d of google?.daily ?? []) {
      const row = map.get(d.date) ?? { date: d.date, meta: 0, google: 0 }
      row.google += d.spend
      map.set(d.date, row)
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [meta?.daily, google?.daily])

  // ----- Funil CRM (etapas básicas Clint) -----
  const funnelData = crm.data
    ? [
        { stage: 'Abertos', qtd: crm.data.counts.open },
        { stage: 'Vendas', qtd: crm.data.counts.won },
        { stage: 'Perdas', qtd: crm.data.counts.lost },
      ]
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="BI · Visão Geral"
        subtitle={perf
          ? `${client.name} · ${perf.period.label}`
          : `${client.name} · sem snapshot de mídia ainda`}
        breadcrumbs={[
          { label: client.name, href: `/c/${client.slug}/overview` },
          { label: 'BI' },
          { label: 'Visão Geral' },
        ]}
      />

      {/* ── 1. KPIs cross-channel (mídia) ─────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
          Mídia paga · cross-channel
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCell label="Investimento Total" value={BRL(spendTotal)} sub={`Meta ${BRL(spendMeta)} · Google ${BRL(spendGoogle)}`} icon={Banknote} accent="brand" />
          <KpiCell label="Leads Total" value={INT(leadsTotal)} sub={`Meta ${INT(leadsMeta)} · Google ${INT(leadsGoogle)}`} icon={Users} accent="success" />
          <KpiCell label="CPL Total" value={BRL2(cplTotal)} sub={leadsTotal > 0 ? 'Investimento / Leads' : 'Sem leads no período'} icon={Target} accent="warning" />
          <KpiCell label="Impressões" value={INT(impTotal)} icon={TrendingUp} />
          <KpiCell label="CTR Total" value={PCT(ctrTotal, 2)} icon={TrendingUp} />
          <KpiCell label="CPM Total" value={BRL2(cpmTotal)} icon={TrendingUp} />
        </div>
      </section>

      {/* ── 2. Área temporal stacked — Meta + Google ──────────────── */}
      <section className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Investimento por dia</h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          Stacked por fonte · {dailySeries.length > 0 ? `${dailySeries.length} dias` : 'sem série diária'}
        </p>
        {dailySeries.length > 0 ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySeries} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gMeta" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-600)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-brand-600)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gGoogle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(d) => {
                    const x = new Date(d as string)
                    return `${x.getDate()}/${x.getMonth() + 1}`
                  }}
                />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`)}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                  formatter={(v, name) => [BRL2(Number(v ?? 0)), name === 'meta' ? 'Meta Ads' : 'Google Ads']}
                />
                <Area type="monotone" dataKey="meta" stackId="1" stroke="var(--color-brand-600)" fill="url(#gMeta)" name="meta" />
                <Area type="monotone" dataKey="google" stackId="1" stroke="#0ea5e9" fill="url(#gGoogle)" name="google" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">
            Sem série diária. Conecte a integração ou rode o sync.
          </div>
        )}
      </section>

      {/* ── 3. CRM Clint — dados reais ───────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            CRM Clint · {client.name}
          </h2>
          {crm.data && (
            <span className="text-[10px] text-[var(--text-tertiary)]">
              ao vivo · {new Date(crm.data.fetched_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {crm.loading && (
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-10 text-center text-sm text-[var(--text-tertiary)]">
            Carregando funil Clint... (puxando dados reais)
          </div>
        )}

        {!crm.loading && crm.note && (
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Integração Clint pendente</h4>
              <p className="text-xs text-[var(--text-tertiary)]">{crm.note}</p>
              <Link to="/integrations" className="text-xs text-[var(--color-brand-600)] underline mt-2 inline-block">
                Configurar integração →
              </Link>
            </div>
          </div>
        )}

        {!crm.loading && crm.error && (
          <div className="bg-[var(--surface-card)] border border-[var(--color-error-600)]/40 rounded-xl p-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-[var(--color-error-600)] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Falha ao buscar CRM</h4>
              <p className="text-xs text-[var(--text-tertiary)]">{crm.error}</p>
            </div>
          </div>
        )}

        {crm.data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
              <KpiCell label="Total de deals" value={INT(crm.data.counts.total)} icon={Users} />
              <KpiCell label="Abertos" value={INT(crm.data.counts.open)} icon={ClockIcon} accent="warning" />
              <KpiCell label="Vendas" value={INT(crm.data.counts.won)} sub={`Tx ${PCT(crm.data.conversion.won_rate_opportunities)}`} icon={Trophy} accent="success" />
              <KpiCell label="Perdas" value={INT(crm.data.counts.lost)} icon={XCircle} accent="danger" />
              <KpiCell
                label="Faturamento (WON)"
                value={crm.data.value.won_total > 0 ? BRL(crm.data.value.won_total) : 'R$ 0'}
                sub={crm.data.value.won_avg > 0 ? `Ticket médio ${BRL(crm.data.value.won_avg)}` : 'Sem valor preenchido'}
                icon={Banknote}
                accent="brand"
              />
              <KpiCell
                label="Tempo até venda"
                value={crm.data.timing.avg_days_to_win > 0 ? formatDays(crm.data.timing.avg_days_to_win) : '—'}
                sub={crm.data.timing.median_days_to_win !== null ? `Mediana ${formatDays(crm.data.timing.median_days_to_win)}` : undefined}
                icon={ClockIcon}
              />
            </div>

            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Distribuição por status</h3>
              <p className="text-xs text-[var(--text-tertiary)] mb-4">Snapshot atual do funil Clint</p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="stage" type="category" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                      formatter={(v) => [INT(Number(v ?? 0)), 'Deals']}
                    />
                    <Bar dataKey="qtd" radius={[0, 6, 6, 0]} fill="var(--color-brand-600)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── 4. Resumo combinado mídia × vendas ───────────────────── */}
      {crm.data && spendTotal > 0 && (
        <section className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Eficiência fim-a-fim</h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">Mídia investida vs vendas fechadas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCell
              label="Custo por venda"
              value={crm.data.counts.won > 0 ? BRL(spendTotal / crm.data.counts.won) : '—'}
              sub={`${BRL(spendTotal)} / ${INT(crm.data.counts.won)} vendas`}
              icon={Target}
              accent="brand"
            />
            <KpiCell
              label="Conversão lead→venda"
              value={leadsTotal > 0 ? PCT(crm.data.counts.won / leadsTotal) : '—'}
              sub={`${INT(crm.data.counts.won)} / ${INT(leadsTotal)}`}
              icon={TrendingUp}
              accent="success"
            />
            <KpiCell
              label="ROAS (se valor preenchido)"
              value={crm.data.value.won_total > 0 ? `${(crm.data.value.won_total / spendTotal).toFixed(2)}x` : '—'}
              sub={crm.data.value.won_total > 0 ? `Faturado / investido` : 'Sem valor em WON'}
              icon={Trophy}
            />
            <KpiCell
              label="Tempo médio Lead→Venda"
              value={crm.data.timing.avg_days_to_win > 0 ? formatDays(crm.data.timing.avg_days_to_win) : '—'}
              icon={ClockIcon}
            />
          </div>
        </section>
      )}
    </div>
  )
}
