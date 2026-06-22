/**
 * CRM · Tempo de Fechamento — inspirado no PBI página "Análise de Tempo"
 *
 * Rota: /c/:clientSlug/crm/tempo
 * Fonte: /api/integrations?op=clint-funnel (mesmo handler real)
 *
 * Layout PBI:
 *   1. 2 KPIs — Tempo M. Vendas (dias) + Opt >> Vendas (%)
 *   2. Funil de Vendas
 *   3. Cohort Mês de Entrada × Mês de Fechamento (heatmap)
 *   4. Opt >> Vendas por Responsável (bar horizontal)
 *   5. Opt >> Vendas por Mês/Ano (area chart)
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  Area, AreaChart, BarChart, Bar, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  Clock as ClockIcon, Percent, AlertCircle, XCircle, TrendingUp,
} from 'lucide-react'

import { PageHeader } from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import supabase from '@/lib/supabase'

// ------------------------------------------------------------------
// Types (espelha o handler)
// ------------------------------------------------------------------

interface ClintAgg {
  client_slug: string
  counts: { open: number; won: number; lost: number; total: number }
  conversion: { won_rate: number; won_rate_opportunities: number }
  value: { won_total: number; won_avg: number; currency: string }
  timing: { avg_days_to_win: number; median_days_to_win: number | null }
  byStage: Array<{ stage: string; total: number; open: number; won: number; lost: number }>
  byMonth: Array<{ ym: string; leads: number; won: number; lost: number; open: number }>
  byUser: Array<{ id: string; name: string; total: number; won: number; lost: number; open: number; avg_days_to_win: number | null }>
  cohort: Array<{ entry_ym: string; close_ym: string; leads: number; won: number; rate: number }>
  fetched_at: string
}

const INT = (v: number) => v.toLocaleString('pt-BR')
const PCT = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`
const fmtYM = (ym: string) => {
  const [y, m] = ym.split('-')
  return `${m}/${y.slice(2)}`
}

// ------------------------------------------------------------------
// Hook (mesma chamada do Funil — handler cacheia 5min)
// ------------------------------------------------------------------

function useClintAgg(slug: string | undefined) {
  const [state, setState] = useState<{
    data: ClintAgg | null
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
        const body = (await resp.json()) as ClintAgg
        if (!cancelled) setState({ data: body, loading: false, note: null, error: null })
      } catch (e) {
        if (!cancelled) setState({
          data: null, loading: false, note: null,
          error: e instanceof Error ? e.message : 'Erro',
        })
      }
    })()
    return () => { cancelled = true }
  }, [slug])

  return state
}

// ------------------------------------------------------------------
// KPI card PBI (mesmo padrão do Funil)
// ------------------------------------------------------------------

function PbiKpi({
  label, value, icon: Icon, accent = 'brand', sub,
}: {
  label: string
  value: string
  icon: React.ElementType
  accent?: 'brand' | 'success' | 'warning'
  sub?: string
}) {
  const accentBg = {
    brand: 'bg-[var(--color-brand-600)]',
    success: 'bg-[var(--color-success-600)]',
    warning: 'bg-amber-500',
  }[accent]

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-4" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-full ${accentBg} text-white flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight mb-2">{value}</div>
      {sub && <div className="text-xs text-[var(--text-tertiary)]">{sub}</div>}
    </div>
  )
}

// ------------------------------------------------------------------
// Cohort heatmap — Mês de Entrada × Mês de Fechamento
// ------------------------------------------------------------------

function CohortHeatmap({ rows }: { rows: ClintAgg['cohort'] }) {
  // Eixos
  const entryMonths = Array.from(new Set(rows.map((r) => r.entry_ym))).sort()
  const closeMonths = Array.from(new Set(rows.map((r) => r.close_ym))).sort()

  // Lookup matrix
  const cellMap = new Map<string, { won: number; leads: number; rate: number }>()
  for (const r of rows) {
    cellMap.set(`${r.entry_ym}|${r.close_ym}`, { won: r.won, leads: r.leads, rate: r.rate })
  }

  // Max rate pra normalizar intensidade da cor
  const maxRate = rows.length > 0 ? Math.max(...rows.map((r) => r.rate)) : 0

  function bgFor(rate: number): string {
    if (rate <= 0) return 'transparent'
    const intensity = maxRate > 0 ? rate / maxRate : 0
    // Brand azul (#476382) com opacidade proporcional — conversão é positivo
    const alpha = 0.15 + intensity * 0.65 // 0.15 → 0.80
    return `rgba(71, 99, 130, ${alpha.toFixed(2)})`
  }

  if (entryMonths.length === 0 || closeMonths.length === 0) {
    return <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">Sem cohort — precisa de WON com created_at e won_at preenchidos</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-[var(--surface-card)] px-3 py-2 text-left text-[var(--text-secondary)] font-semibold border-b border-r border-[var(--border-subtle)]">
              E/F
            </th>
            {closeMonths.map((cm) => (
              <th key={cm} className="px-2 py-2 text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)] min-w-[58px]">
                {fmtYM(cm)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entryMonths.map((em) => (
            <tr key={em}>
              <td className="sticky left-0 bg-[var(--surface-card)] px-3 py-2 text-[var(--text-primary)] font-semibold border-r border-[var(--border-subtle)] whitespace-nowrap">
                {fmtYM(em)}
              </td>
              {closeMonths.map((cm) => {
                const cell = cellMap.get(`${em}|${cm}`)
                if (!cell) return <td key={cm} className="px-2 py-2 text-[var(--text-tertiary)]/40 text-center">·</td>
                return (
                  <td
                    key={cm}
                    className="px-2 py-2 text-center tabular-nums font-medium"
                    style={{
                      backgroundColor: bgFor(cell.rate),
                      color: cell.rate > maxRate * 0.6 ? 'white' : 'var(--text-primary)',
                    }}
                    title={`Entrada ${fmtYM(em)} · Fechamento ${fmtYM(cm)} · ${cell.won} venda(s) / ${cell.leads} lead(s)`}
                  >
                    {PCT(cell.rate, 2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ------------------------------------------------------------------
// Funil compacto (reuso visual do CrmFunnelPage)
// ------------------------------------------------------------------

function FunnelMini({ stages }: { stages: ClintAgg['byStage'] }) {
  if (stages.length === 0) {
    return <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">Sem etapas</div>
  }
  const max = Math.max(...stages.map((s) => s.total))
  return (
    <div className="space-y-2">
      {stages.slice(0, 8).map((s) => {
        const widthPct = max > 0 ? (s.total / max) * 100 : 0
        const wonPct = s.total > 0 ? (s.won / s.total) * 100 : 0
        return (
          <div key={s.stage}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{s.stage}</span>
              <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">{INT(s.total)}</span>
              <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums w-12 text-right">{wonPct.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-[var(--color-neutral-100)] rounded overflow-hidden">
              <div className="bg-[var(--color-brand-600)] h-full" style={{ width: `${widthPct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------
// Página
// ------------------------------------------------------------------

export default function CrmTempoPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const client = useMemo(() => (clientSlug ? getClientBySlug(clientSlug) : undefined), [clientSlug])
  const { data, loading, note, error } = useClintAgg(clientSlug)

  if (!client) return <Navigate to="/_v4/operations" replace />

  const tempoMedio = data?.timing.avg_days_to_win ?? 0
  const tempoMediana = data?.timing.median_days_to_win
  const optVendasRate = data?.conversion.won_rate_opportunities ?? 0

  // Opt >> Vendas por responsável (Won / (Won+Lost))
  const optByUser = (data?.byUser ?? [])
    .map((u) => {
      const opp = u.won + u.lost
      return { name: u.name, rate: opp > 0 ? u.won / opp : 0, won: u.won, opp }
    })
    .filter((u) => u.opp > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10)

  // Opt >> Vendas por Mês/Ano
  const monthSeries = (data?.byMonth ?? []).map((m) => {
    const opp = m.won + m.lost
    return { ym: fmtYM(m.ym), rate: opp > 0 ? m.won / opp : 0, won: m.won, opp }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tempo de Fechamento"
        subtitle={`${client.name} · Cohort de conversão (mês entrada × mês fechamento)`}
        breadcrumbs={[
          { label: client.name, href: `/c/${client.slug}/overview` },
          { label: 'CRM' },
          { label: 'Tempo' },
        ]}
      />

      {loading && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-10 text-center text-sm text-[var(--text-tertiary)]">
          Paginando deals da Clint... (cache 5min — chamadas seguintes são instantâneas)
        </div>
      )}

      {!loading && note && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Integração CRM pendente</h4>
            <p className="text-xs text-[var(--text-tertiary)]">{note}</p>
            <Link to="/integrations" className="text-xs text-[var(--color-brand-600)] underline mt-2 inline-block">
              Configurar integração →
            </Link>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="bg-[var(--surface-card)] border border-[var(--color-error-600)]/40 rounded-xl p-6 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-[var(--color-error-600)] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Falha ao buscar</h4>
            <p className="text-xs text-[var(--text-tertiary)]">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* ── 1. KPI cards ──────────────────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
            <PbiKpi
              label="Tempo M. Vendas (dias)"
              value={tempoMedio > 0 ? tempoMedio.toFixed(1) : '—'}
              icon={ClockIcon}
              accent="brand"
              sub={tempoMediana !== null ? `Mediana ${tempoMediana} dias` : 'Sem dados suficientes'}
            />
            <PbiKpi
              label="Opt >> Vendas"
              value={PCT(optVendasRate, 2)}
              icon={Percent}
              accent="success"
              sub={`${INT(data.counts.won)} venda(s) / ${INT(data.counts.won + data.counts.lost)} oportunidades fechadas`}
            />
          </section>

          {/* ── 2. Funil + Cohort ─────────────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Funil */}
            <div className="lg:col-span-1 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Funil de Vendas</h3>
              <p className="text-xs text-[var(--text-tertiary)] mb-4">Etapas com taxa de conversão</p>
              <FunnelMini stages={data.byStage} />
            </div>

            {/* Cohort heatmap */}
            <div className="lg:col-span-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Análise de Conversão por Data de Entrada e Fechamento</h3>
              <p className="text-xs text-[var(--text-tertiary)] mb-4">
                Linhas = mês de <strong>entrada</strong> do lead · Colunas = mês de <strong>fechamento</strong> · Células = % conversão
              </p>
              <CohortHeatmap rows={data.cohort} />
            </div>
          </section>

          {/* ── 3. Opt >> Vendas por Responsável + Mês ────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Opt &gt;&gt; Vendas por Responsável</h3>
              <p className="text-xs text-[var(--text-tertiary)] mb-4">Taxa de conversão (Vendas / Oportunidades fechadas)</p>
              {optByUser.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">Sem oportunidades fechadas</div>
              ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={optByUser} layout="vertical" margin={{ left: 8, right: 32 }}>
                      <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} width={140} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                        formatter={(v, _name, ctx) => {
                          const payload = (ctx as { payload?: { won?: number; opp?: number } }).payload
                          return [`${(Number(v ?? 0) * 100).toFixed(2)}% (${payload?.won}/${payload?.opp})`, 'Tx Conversão']
                        }}
                      />
                      <Bar dataKey="rate" radius={[0, 6, 6, 0]} fill="var(--color-success-600)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Opt &gt;&gt; Vendas por Mês/Ano</h3>
              <p className="text-xs text-[var(--text-tertiary)] mb-4">Evolução temporal da taxa de conversão</p>
              {monthSeries.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">Sem série mensal</div>
              ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthSeries} margin={{ left: -10, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="gOptRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-success-600)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-success-600)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="ym" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                        formatter={(v, _name, ctx) => {
                          const payload = (ctx as { payload?: { won?: number; opp?: number } }).payload
                          return [`${(Number(v ?? 0) * 100).toFixed(2)}% (${payload?.won}/${payload?.opp})`, 'Tx Conversão']
                        }}
                      />
                      <Area type="monotone" dataKey="rate" stroke="var(--color-success-600)" fill="url(#gOptRate)" strokeWidth={2} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          {/* Footer: pequeno disclaimer */}
          <div className="text-[10px] text-[var(--text-tertiary)] text-center pt-2 flex items-center justify-center gap-2">
            <TrendingUp className="w-3 h-3" />
            Dados Clint ao vivo · {new Date(data.fetched_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </>
      )}
    </div>
  )
}
