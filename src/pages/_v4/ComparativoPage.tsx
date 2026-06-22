/**
 * Comparativo · Período atual vs Período anterior
 *
 * Rota: /c/:clientSlug/comparativo
 * Fonte: /api/integrations?op=meta-ads-compare (2 chamadas Graph API)
 *
 * Layout PBI:
 *   1. KPIs lado a lado (current / previous / Δ %)
 *   2. Tabela campanha × métricas em duas colunas
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Banknote, Eye, MousePointer, Users, Target, AlertCircle, XCircle } from 'lucide-react'

import { PageHeader } from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import supabase from '@/lib/supabase'

interface Period {
  spend: number
  impressions: number
  clicks: number
  link_clicks: number
  leads: number
  reach: number
  ctr: number
  cpc: number
  cpm: number
  cost_per_lead: number
}

interface CampaignRow {
  campaign_id: string
  campaign_name: string
  current: Period
  previous: Period
  delta: {
    spend_abs: number; spend_pct: number
    leads_abs: number; leads_pct: number
    impressions_abs: number; impressions_pct: number
    clicks_abs: number; clicks_pct: number
  }
}

interface ComparePayload {
  client_slug: string
  account_id: string
  currency: string
  preset: string
  current_range: { since: string; until: string }
  previous_range: { since: string; until: string }
  totals: { current: Period; previous: Period; delta: CampaignRow['delta'] }
  campaigns: CampaignRow[]
  fetched_at: string
  cached?: boolean
}

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
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
        if (!token) {
          if (!cancelled) setState({ data: null, loading: false, note: 'Sessão expirada.', error: null })
          return
        }
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

function DeltaBadge({ value }: { value: number }) {
  if (!Number.isFinite(value) || value === 0) {
    return <span className="text-[var(--text-tertiary)]">—</span>
  }
  const positive = value > 0
  return (
    <span className={positive ? 'text-[var(--color-success-600)]' : 'text-[var(--color-error-600)]'}>
      {positive ? '+' : ''}{(value * 100).toFixed(1)}%
    </span>
  )
}

function PairCard({
  label, icon: Icon, current, previous, deltaPct, formatter,
}: {
  label: string
  icon: React.ElementType
  current: number
  previous: number
  deltaPct: number
  formatter: (n: number) => string
}) {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-4" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-[var(--color-brand-600)] text-white flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Atual</div>
          <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{formatter(current)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Anterior</div>
          <div className="text-xl font-semibold text-[var(--text-tertiary)] tabular-nums">{formatter(previous)}</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
        Variação <DeltaBadge value={deltaPct} />
      </div>
    </div>
  )
}

interface ComparativoPageProps {
  clientSlugOverride?: string
  embedded?: boolean
}

export default function ComparativoPage({ clientSlugOverride, embedded = false }: ComparativoPageProps = {}) {
  const params = useParams<{ clientSlug: string }>()
  const clientSlug = clientSlugOverride ?? params.clientSlug
  const client = useMemo(() => (clientSlug ? getClientBySlug(clientSlug) : undefined), [clientSlug])
  const [preset, setPreset] = useState('last_30d')
  const { data, loading, note, error } = useCompare(clientSlug, preset)

  if (!client) return <Navigate to="/_v4/operations" replace />

  return (
    <div className="space-y-6">
      {!embedded && <PageHeader
        title="Comparativo · Período"
        subtitle={data
          ? `${client.name} · ${data.current_range.since}→${data.current_range.until} vs ${data.previous_range.since}→${data.previous_range.until}`
          : `${client.name} · Período atual vs anterior`}
        breadcrumbs={[
          { label: client.name, href: `/c/${client.slug}/overview` },
          { label: 'Comparativo' },
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
          Buscando 2 períodos da Meta Graph API...
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
          {/* KPI pairs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <PairCard label="Investimento" icon={Banknote} current={data.totals.current.spend} previous={data.totals.previous.spend} deltaPct={data.totals.delta.spend_pct} formatter={BRL} />
            <PairCard label="Leads" icon={Users} current={data.totals.current.leads} previous={data.totals.previous.leads} deltaPct={data.totals.delta.leads_pct} formatter={INT} />
            <PairCard label="Impressões" icon={Eye} current={data.totals.current.impressions} previous={data.totals.previous.impressions} deltaPct={data.totals.delta.impressions_pct} formatter={INT} />
            <PairCard label="Cliques" icon={MousePointer} current={data.totals.current.clicks} previous={data.totals.previous.clicks} deltaPct={data.totals.delta.clicks_pct} formatter={INT} />
          </section>

          {/* Tabela campanhas */}
          <section className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-soft)' }}>
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Campanhas · atual vs anterior</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Ordenado por magnitude de variação em investimento</p>
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)]">{data.campaigns.length} campanhas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-neutral-50)] border-b border-[var(--border-subtle)]">
                    <th rowSpan={2} className="text-left px-5 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase align-bottom">Campanha</th>
                    <th colSpan={2} className="text-center px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase border-l border-[var(--border-subtle)]">Investimento</th>
                    <th rowSpan={2} className="text-right px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase align-bottom border-l border-[var(--border-subtle)]">Δ</th>
                    <th colSpan={2} className="text-center px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase border-l border-[var(--border-subtle)]">Leads</th>
                    <th rowSpan={2} className="text-right px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase align-bottom border-l border-[var(--border-subtle)]">Δ</th>
                    <th colSpan={2} className="text-center px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase border-l border-[var(--border-subtle)]">CPL</th>
                  </tr>
                  <tr className="bg-[var(--color-neutral-50)] border-b border-[var(--border-subtle)]">
                    <th className="text-right px-3 py-2 text-[10px] font-medium text-[var(--text-tertiary)] border-l border-[var(--border-subtle)]">Atual</th>
                    <th className="text-right px-3 py-2 text-[10px] font-medium text-[var(--text-tertiary)]">Anterior</th>
                    <th className="text-right px-3 py-2 text-[10px] font-medium text-[var(--text-tertiary)] border-l border-[var(--border-subtle)]">Atual</th>
                    <th className="text-right px-3 py-2 text-[10px] font-medium text-[var(--text-tertiary)]">Anterior</th>
                    <th className="text-right px-3 py-2 text-[10px] font-medium text-[var(--text-tertiary)] border-l border-[var(--border-subtle)]">Atual</th>
                    <th className="text-right px-5 py-2 text-[10px] font-medium text-[var(--text-tertiary)]">Anterior</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.slice(0, 50).map((c) => (
                    <tr key={c.campaign_id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--color-neutral-50)]">
                      <td className="px-5 py-2 font-medium text-[var(--text-primary)] truncate max-w-[260px]" title={c.campaign_name}>{c.campaign_name}</td>
                      <td className="px-3 py-2 text-right tabular-nums border-l border-[var(--border-subtle)]">{BRL2(c.current.spend)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--text-tertiary)]">{BRL2(c.previous.spend)}</td>
                      <td className="px-3 py-2 text-right tabular-nums border-l border-[var(--border-subtle)]"><DeltaBadge value={c.delta.spend_pct} /></td>
                      <td className="px-3 py-2 text-right tabular-nums border-l border-[var(--border-subtle)]">{INT(c.current.leads)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--text-tertiary)]">{INT(c.previous.leads)}</td>
                      <td className="px-3 py-2 text-right tabular-nums border-l border-[var(--border-subtle)]"><DeltaBadge value={c.delta.leads_pct} /></td>
                      <td className="px-3 py-2 text-right tabular-nums border-l border-[var(--border-subtle)]">{c.current.leads > 0 ? BRL2(c.current.cost_per_lead) : '—'}</td>
                      <td className="px-5 py-2 text-right tabular-nums text-[var(--text-tertiary)]">{c.previous.leads > 0 ? BRL2(c.previous.cost_per_lead) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="text-[10px] text-[var(--text-tertiary)] text-center pt-2">
            <Target className="inline-block w-3 h-3 mr-1" />
            Meta Graph API · {new Date(data.fetched_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {data.cached && ' · cache'}
          </div>
        </>
      )}
    </div>
  )
}
