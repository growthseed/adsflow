/**
 * Ofensores · Waterfall por campanha — variação atual − anterior
 *
 * Rota: /c/:clientSlug/ofensores
 * Fonte: /api/integrations?op=meta-ads-compare (mesmo endpoint do Comparativo)
 *
 * Layout PBI:
 *   1. Selector de métrica (Investimento / Leads / CPL / Impressões)
 *   2. Waterfall composto:
 *      Anterior (total) → +Ganhos por campanha → −Perdas por campanha → Atual (total)
 *   3. Tabela top-10 ofensores (maior queda) + top-10 ganhadores
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip,
  XAxis, YAxis, ReferenceLine,
} from 'recharts'
import { TrendingDown, TrendingUp, AlertCircle, XCircle, Activity } from 'lucide-react'

import { PageHeader } from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import supabase from '@/lib/supabase'

interface Period {
  spend: number
  impressions: number
  clicks: number
  link_clicks: number
  leads: number
  ctr: number
  cpc: number
  cpm: number
  cost_per_lead: number
  reach: number
}

interface CampaignRow {
  campaign_id: string
  campaign_name: string
  current: Period
  previous: Period
  delta: { spend_abs: number; leads_abs: number; impressions_abs: number; clicks_abs: number }
}

interface ComparePayload {
  totals: { current: Period; previous: Period }
  campaigns: CampaignRow[]
  current_range: { since: string; until: string }
  previous_range: { since: string; until: string }
  fetched_at: string
  cached?: boolean
}

type MetricKey = 'spend' | 'leads' | 'impressions' | 'clicks'

const BRL2 = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const INT = (v: number) => v.toLocaleString('pt-BR')

const PRESETS = [
  { key: 'last_7d', label: 'Últimos 7 dias' },
  { key: 'last_14d', label: 'Últimos 14 dias' },
  { key: 'last_30d', label: 'Últimos 30 dias' },
  { key: 'last_90d', label: 'Últimos 90 dias' },
  { key: 'this_month', label: 'Este mês' },
  { key: 'last_month', label: 'Mês passado' },
]

function useCompare(slug: string | undefined, preset: string) {
  const [state, setState] = useState<{ data: ComparePayload | null; loading: boolean; note: string | null; error: string | null }>({
    data: null, loading: true, note: null, error: null,
  })

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    ;(async () => {
      setState({ data: null, loading: true, note: null, error: null })
      try {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token
        if (!token) { if (!cancelled) setState({ data: null, loading: false, note: 'Sessão expirada.', error: null }); return }
        const resp = await fetch(
          `/api/integrations?op=meta-ads-compare&client_slug=${encodeURIComponent(slug)}&preset=${encodeURIComponent(preset)}`,
          { headers: { authorization: `Bearer ${token}` } },
        )
        if (resp.status === 501) {
          const j = (await resp.json()) as { note?: string }
          if (!cancelled) setState({ data: null, loading: false, note: j.note ?? 'Meta não configurado.', error: null })
          return
        }
        if (!resp.ok) {
          const j = (await resp.json().catch(() => ({}))) as { detail?: string }
          throw new Error(j.detail || `HTTP ${resp.status}`)
        }
        const body = (await resp.json()) as ComparePayload
        if (!cancelled) setState({ data: body, loading: false, note: null, error: null })
      } catch (e) {
        if (!cancelled) setState({ data: null, loading: false, note: null, error: e instanceof Error ? e.message : 'Erro' })
      }
    })()
    return () => { cancelled = true }
  }, [slug, preset])

  return state
}

interface WaterfallRow { name: string; delta: number; baseline: number; cumulative: number; isPivot?: boolean }

// Tooltip custom para waterfall (tipagem relaxada — Recharts Tooltip passa `readonly any[]`)
function WaterfallTooltip({ active, payload, formatter }: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: WaterfallRow }>
  formatter: (n: number) => string
}) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  if (!p) return null
  if (p.isPivot) {
    return (
      <div className="rounded bg-[var(--surface-card)] border border-[var(--border-subtle)] px-3 py-2 text-xs shadow">
        <div className="font-semibold text-[var(--text-primary)]">{p.name}</div>
        <div className="text-[var(--text-tertiary)]">Total {formatter(p.cumulative)}</div>
      </div>
    )
  }
  const positive = p.delta > 0
  return (
    <div className="rounded bg-[var(--surface-card)] border border-[var(--border-subtle)] px-3 py-2 text-xs shadow max-w-xs">
      <div className="font-semibold text-[var(--text-primary)] truncate">{p.name}</div>
      <div className={positive ? 'text-[var(--color-success-600)]' : 'text-[var(--color-error-600)]'}>
        Δ {positive ? '+' : ''}{formatter(p.delta)}
      </div>
      <div className="text-[10px] text-[var(--text-tertiary)] mt-1">Acumulado {formatter(p.cumulative)}</div>
    </div>
  )
}

interface OfensoresPageProps {
  clientSlugOverride?: string
  embedded?: boolean
}

export default function OfensoresPage({ clientSlugOverride, embedded = false }: OfensoresPageProps = {}) {
  const params = useParams<{ clientSlug: string }>()
  const clientSlug = clientSlugOverride ?? params.clientSlug
  const client = useMemo(() => (clientSlug ? getClientBySlug(clientSlug) : undefined), [clientSlug])
  const [preset, setPreset] = useState('last_30d')
  const [metric, setMetric] = useState<MetricKey>('spend')

  const { data, loading, note, error } = useCompare(clientSlug, preset)

  if (!client) return <Navigate to="/_v4/operations" replace />

  // ---- Constrói waterfall data ----
  const waterfall = useMemo(() => {
    if (!data) return { rows: [], totalPrev: 0, totalCurr: 0, deltaTotal: 0 }

    const valueOf = (p: Period): number => {
      if (metric === 'spend') return p.spend
      if (metric === 'leads') return p.leads
      if (metric === 'impressions') return p.impressions
      return p.clicks
    }
    const totalPrev = valueOf(data.totals.previous)
    const totalCurr = valueOf(data.totals.current)
    const deltaTotal = totalCurr - totalPrev

    // Sort by magnitude — maiores primeiros (positivos + negativos misturados)
    const deltas = data.campaigns
      .map((c) => ({ name: c.campaign_name, delta: valueOf(c.current) - valueOf(c.previous) }))
      .filter((c) => Math.abs(c.delta) > 0.001)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 12) // top 12 ofensores (mais impactantes)

    // Build waterfall rows: cumulative tracking
    let cumulative = totalPrev
    const rows: Array<{ name: string; baseline: number; delta: number; cumulative: number; isPivot?: boolean }> = []
    rows.push({ name: `Anterior`, baseline: 0, delta: totalPrev, cumulative: totalPrev, isPivot: true })
    for (const d of deltas) {
      const baseline = d.delta >= 0 ? cumulative : cumulative + d.delta
      rows.push({
        name: d.name.length > 30 ? d.name.slice(0, 27) + '…' : d.name,
        baseline,
        delta: d.delta,
        cumulative: cumulative + d.delta,
      })
      cumulative += d.delta
    }
    rows.push({ name: `Atual`, baseline: 0, delta: totalCurr, cumulative: totalCurr, isPivot: true })

    return { rows, totalPrev, totalCurr, deltaTotal }
  }, [data, metric])

  const fmt = useMemo(() => {
    if (metric === 'spend') return (n: number) => BRL2(n)
    return (n: number) => INT(n)
  }, [metric])

  const topOfensores = useMemo(() => {
    if (!data) return []
    const valueOf = (p: Period): number => {
      if (metric === 'spend') return p.spend
      if (metric === 'leads') return p.leads
      if (metric === 'impressions') return p.impressions
      return p.clicks
    }
    return [...data.campaigns]
      .map((c) => ({ ...c, delta: valueOf(c.current) - valueOf(c.previous) }))
      .filter((c) => c.delta < 0)
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 10)
  }, [data, metric])

  const topGanhadores = useMemo(() => {
    if (!data) return []
    const valueOf = (p: Period): number => {
      if (metric === 'spend') return p.spend
      if (metric === 'leads') return p.leads
      if (metric === 'impressions') return p.impressions
      return p.clicks
    }
    return [...data.campaigns]
      .map((c) => ({ ...c, delta: valueOf(c.current) - valueOf(c.previous) }))
      .filter((c) => c.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 10)
  }, [data, metric])

  const metricLabel = metric === 'spend' ? 'Investimento'
    : metric === 'leads' ? 'Leads'
    : metric === 'impressions' ? 'Impressões' : 'Cliques'

  return (
    <div className="space-y-6">
      {!embedded && <PageHeader
        title="Análise de Ofensores"
        subtitle={data
          ? `${client.name} · variação ${metricLabel} · ${data.previous_range.since}→${data.previous_range.until} vs ${data.current_range.since}→${data.current_range.until}`
          : `${client.name} · Waterfall por campanha`}
        breadcrumbs={[
          { label: client.name, href: `/c/${client.slug}/overview` },
          { label: 'Ofensores' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
            >
              <option value="spend">Investimento</option>
              <option value="leads">Leads</option>
              <option value="impressions">Impressões</option>
              <option value="clicks">Cliques</option>
            </select>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
            >
              {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
        }
      />}

      {loading && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-10 text-center text-sm text-[var(--text-tertiary)]">
          Calculando ofensores via Meta Graph API (2 períodos)...
        </div>
      )}

      {!loading && note && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Meta pendente</h4>
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
          {/* Resumo do delta */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-4" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Período anterior</div>
              <div className="text-2xl font-bold text-[var(--text-tertiary)] tabular-nums">{fmt(waterfall.totalPrev)}</div>
            </div>
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-4 text-center" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Variação total</div>
              <div className={`text-2xl font-bold tabular-nums flex items-center justify-center gap-2 ${waterfall.deltaTotal >= 0 ? 'text-[var(--color-success-600)]' : 'text-[var(--color-error-600)]'}`}>
                {waterfall.deltaTotal >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {waterfall.deltaTotal >= 0 ? '+' : ''}{fmt(waterfall.deltaTotal)}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
                {waterfall.totalPrev > 0 ? `${((waterfall.deltaTotal / waterfall.totalPrev) * 100).toFixed(1)}%` : '—'}
              </div>
            </div>
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-4 text-right" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Período atual</div>
              <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{fmt(waterfall.totalCurr)}</div>
            </div>
          </section>

          {/* Waterfall */}
          <section className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Decomposição da variação por campanha</h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">
              Waterfall: do total <strong>anterior</strong> → contribuição de cada campanha (top 12 mais impactantes) → total <strong>atual</strong>
            </p>
            {waterfall.rows.length === 2 ? (
              <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">
                Sem variações entre os 2 períodos para esta métrica.
              </div>
            ) : (
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfall.rows} margin={{ left: 8, right: 8, top: 8, bottom: 60 }}>
                    <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="var(--text-tertiary)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v).replace('R$', 'R$').replace(',00', '')} />
                    <Tooltip content={(props) => <WaterfallTooltip {...props} formatter={fmt} />} />
                    <ReferenceLine y={waterfall.totalPrev} stroke="var(--text-tertiary)" strokeDasharray="4 4" />
                    {/* Baseline transparente (faz o efeito flutuante) */}
                    <Bar dataKey="baseline" stackId="a" fill="transparent" />
                    {/* Delta colorido */}
                    <Bar dataKey="delta" stackId="a">
                      {waterfall.rows.map((row, i) => {
                        const color = row.isPivot
                          ? 'var(--color-brand-600)'
                          : row.delta >= 0
                            ? 'var(--color-success-600)'
                            : 'var(--color-error-600)'
                        return <Cell key={i} fill={color} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Top 10 Ofensores + Ganhadores */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[var(--color-error-600)]" />
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Top 10 Ofensores ({metricLabel} ↓)</h4>
              </div>
              {topOfensores.length === 0 ? (
                <div className="px-5 py-6 text-xs text-[var(--text-tertiary)] text-center">Sem campanhas em queda</div>
              ) : (
                <ul className="divide-y divide-[var(--border-subtle)]">
                  {topOfensores.map((c) => (
                    <li key={c.campaign_id} className="px-5 py-2 flex items-center gap-3 text-xs">
                      <span className="flex-1 truncate text-[var(--text-primary)]" title={c.campaign_name}>{c.campaign_name}</span>
                      <span className="tabular-nums text-[var(--color-error-600)] font-semibold">{fmt(c.delta)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--color-success-600)]" />
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Top 10 Ganhadores ({metricLabel} ↑)</h4>
              </div>
              {topGanhadores.length === 0 ? (
                <div className="px-5 py-6 text-xs text-[var(--text-tertiary)] text-center">Sem campanhas em crescimento</div>
              ) : (
                <ul className="divide-y divide-[var(--border-subtle)]">
                  {topGanhadores.map((c) => (
                    <li key={c.campaign_id} className="px-5 py-2 flex items-center gap-3 text-xs">
                      <span className="flex-1 truncate text-[var(--text-primary)]" title={c.campaign_name}>{c.campaign_name}</span>
                      <span className="tabular-nums text-[var(--color-success-600)] font-semibold">+{fmt(c.delta)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <div className="text-[10px] text-[var(--text-tertiary)] text-center pt-2">
            <Activity className="inline-block w-3 h-3 mr-1" />
            Meta Graph API · {new Date(data.fetched_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {data.cached && ' · cache'}
          </div>
        </>
      )}
    </div>
  )
}
