import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Database, ExternalLink, Image as ImageIcon, Play, RefreshCw, Rows3, TrendingUp } from 'lucide-react'
import MetaAdsPage from '@/pages/_v4/MetaAdsPage'
import GoogleAdsPage from '@/pages/_v4/GoogleAdsPage'
import ComparativoPage from '@/pages/_v4/ComparativoPage'
import OfensoresPage from '@/pages/_v4/OfensoresPage'
import { useMoaiMediaReport, type MediaRow } from '@/hooks/useMoaiMediaReport'
import { useMoaiSnapshot } from '@/hooks/useMoaiSnapshot'
import { MetaAdInspector } from '@/pages/_v4/components/MetaAdInspector'
import { MoaiModuleShell } from './MoaiModuleShell'
import supabase from '@/lib/supabase'

const tabs = [
  { to: '.', label: 'Visão geral', end: true },
  { to: 'meta', label: 'Meta Ads' },
  { to: 'google', label: 'Google Ads' },
  { to: 'comparativo', label: 'Comparativo' },
  { to: 'ofensores', label: 'Ofensores' },
]

type PeriodKey = '7d' | '30d' | '90d' | 'month' | 'all'
type Grain = 'day' | 'week' | 'month'

interface InlineAd {
  id: string
  name: string
  effective_status: string
  creative: { thumbnail_url: string | null; image_url: string | null; video_id: string | null; cta: string | null }
  metrics: { spend: number; impressions: number; clicks: number; ctr: number; cpc: number; leads: number; cost_per_lead: number }
}

const num = (row: MediaRow, ...keys: string[]) => {
  for (const key of keys) {
    const value = Number(row[key])
    if (Number.isFinite(value)) return value
  }
  return 0
}
const text = (row: MediaRow, ...keys: string[]) => {
  for (const key of keys) if (row[key] != null && String(row[key])) return String(row[key])
  return ''
}
const rowDate = (row: MediaRow) => text(row, 'metric_date', 'date_start', 'date', 'day').slice(0, 10)
const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const brl2 = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const integer = (value: number) => Math.round(value).toLocaleString('pt-BR')
const pct = (value: number) => `${value.toFixed(2).replace('.', ',')}%`

function shift(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}
function iso(date: Date) { return date.toISOString().slice(0, 10) }
function rangeDays(key: PeriodKey, maxDate: Date) {
  if (key === '7d') return 7
  if (key === '30d') return 30
  if (key === '90d') return 90
  if (key === 'month') return maxDate.getUTCDate()
  return 3650
}
function grainKey(value: string, grain: Grain) {
  const date = new Date(`${value}T00:00:00Z`)
  if (grain === 'day') return value
  if (grain === 'month') return `${value.slice(0, 7)}-01`
  const day = date.getUTCDay() || 7
  return iso(shift(date, 1 - day))
}
function totals(rows: MediaRow[]) {
  const spend = rows.reduce((sum, row) => sum + num(row, 'spend', 'amount_spent'), 0)
  const impressions = rows.reduce((sum, row) => sum + num(row, 'impressions'), 0)
  const clicks = rows.reduce((sum, row) => sum + num(row, 'clicks', 'link_clicks'), 0)
  const leads = rows.reduce((sum, row) => sum + num(row, 'leads', 'conversions', 'results'), 0)
  const reach = rows.reduce((sum, row) => sum + num(row, 'reach'), 0)
  return {
    spend, impressions, clicks, leads, reach,
    cpl: leads ? spend / leads : 0,
    cpc: clicks ? spend / clicks : 0,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    cpm: impressions ? (spend / impressions) * 1000 : 0,
  }
}

export default function MoaiMediaModule() {
  return (
    <MoaiModuleShell
      title="Mídia & Ads"
      description="Entrega, eficiência, criativos e conversão em uma leitura única."
      tabs={tabs}
    >
      <Routes>
        <Route index element={<MediaOverview />} />
        <Route path="meta" element={<MetaAdsPage clientSlugOverride="moai" embedded />} />
        <Route path="google" element={<GoogleAdsPage clientSlugOverride="moai" embedded />} />
        <Route path="comparativo" element={<ComparativoPage clientSlugOverride="moai" embedded />} />
        <Route path="ofensores" element={<OfensoresPage clientSlugOverride="moai" embedded />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </MoaiModuleShell>
  )
}

function MediaOverview() {
  const { campaignRows, adRows, loading, error, source, refetch } = useMoaiMediaReport()
  const { snapshot } = useMoaiSnapshot()
  const [period, setPeriod] = useState<PeriodKey>('30d')
  const [grain, setGrain] = useState<Grain>('day')

  const model = useMemo(() => {
    const dated = campaignRows.filter((row) => rowDate(row)).sort((a, b) => rowDate(a).localeCompare(rowDate(b)))
    const last = dated.length ? new Date(`${rowDate(dated[dated.length - 1])}T00:00:00Z`) : new Date()
    const days = rangeDays(period, last)
    const currentStart = shift(last, -(days - 1))
    const previousEnd = shift(currentStart, -1)
    const previousStart = shift(previousEnd, -(days - 1))
    const current = dated.filter((row) => rowDate(row) >= iso(currentStart) && rowDate(row) <= iso(last))
    const previous = dated.filter((row) => rowDate(row) >= iso(previousStart) && rowDate(row) <= iso(previousEnd))
    const currentTotals = totals(current)
    const previousTotals = totals(previous)

    const buckets = new Map<string, ReturnType<typeof totals>>()
    for (const row of current) {
      const key = grainKey(rowDate(row), grain)
      const bucket = buckets.get(key) ?? totals([])
      const next = totals([row])
      buckets.set(key, {
        spend: bucket.spend + next.spend,
        impressions: bucket.impressions + next.impressions,
        clicks: bucket.clicks + next.clicks,
        leads: bucket.leads + next.leads,
        reach: bucket.reach + next.reach,
        cpl: 0, cpc: 0, ctr: 0, cpm: 0,
      })
    }
    const trend = [...buckets.entries()].map(([date, value]) => ({
      date: grain === 'month' ? date.slice(0, 7) : date.slice(5),
      spend: value.spend,
      leads: value.leads,
      cpl: value.leads ? value.spend / value.leads : 0,
    }))

    const campaigns = new Map<string, ReturnType<typeof totals> & { name: string }>()
    for (const row of current) {
      const name = text(row, 'campaign_name', 'campaign', 'source') || 'Sem campanha'
      const old = campaigns.get(name) ?? { name, ...totals([]) }
      const next = totals([row])
      const spend = old.spend + next.spend
      const impressions = old.impressions + next.impressions
      const clicks = old.clicks + next.clicks
      const leads = old.leads + next.leads
      campaigns.set(name, {
        name, spend, impressions, clicks, leads, reach: old.reach + next.reach,
        cpl: leads ? spend / leads : 0,
        cpc: clicks ? spend / clicks : 0,
        ctr: impressions ? (clicks / impressions) * 100 : 0,
        cpm: impressions ? (spend / impressions) * 1000 : 0,
      })
    }

    return {
      currentTotals,
      previousTotals,
      trend,
      campaigns: [...campaigns.values()].sort((a, b) => b.spend - a.spend).slice(0, 12),
      lastDate: iso(last),
      currentRange: `${iso(currentStart)} a ${iso(last)}`,
      previousRange: `${iso(previousStart)} a ${iso(previousEnd)}`,
    }
  }, [campaignRows, period, grain])

  const comparison = (current: number, previous: number, lowerIsBetter = false) => {
    if (!previous) return { label: 'sem base anterior', good: true }
    const delta = ((current - previous) / previous) * 100
    return { label: `${delta >= 0 ? '+' : ''}${delta.toFixed(1).replace('.', ',')}%`, good: lowerIsBetter ? delta <= 0 : delta >= 0 }
  }

  const kpis = [
    ['Investimento', brl(model.currentTotals.spend), comparison(model.currentTotals.spend, model.previousTotals.spend)],
    ['Impressões', integer(model.currentTotals.impressions), comparison(model.currentTotals.impressions, model.previousTotals.impressions)],
    ['Cliques', integer(model.currentTotals.clicks), comparison(model.currentTotals.clicks, model.previousTotals.clicks)],
    ['Leads Meta', integer(model.currentTotals.leads), comparison(model.currentTotals.leads, model.previousTotals.leads)],
    ['CPL', brl2(model.currentTotals.cpl), comparison(model.currentTotals.cpl, model.previousTotals.cpl, true)],
    ['CTR', pct(model.currentTotals.ctr), comparison(model.currentTotals.ctr, model.previousTotals.ctr)],
    ['CPC', brl2(model.currentTotals.cpc), comparison(model.currentTotals.cpc, model.previousTotals.cpc, true)],
    ['CPM', brl2(model.currentTotals.cpm), comparison(model.currentTotals.cpm, model.previousTotals.cpm, true)],
  ] as const

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 border-y border-[#DDE3EA] bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#152033]"><Database size={14} /> {source}</span>
          <span className="text-[11px] text-gray-500">até {model.lastDate} · {campaignRows.length} linhas · {adRows.length} anúncios</span>
        </div>
        <button type="button" onClick={() => void refetch()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#CBD5E1] px-3 text-xs font-semibold text-[#152033] hover:bg-[#F8FAFC]">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </section>

      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase text-gray-500">Janela analisada</div>
          <div className="mt-1 text-sm font-semibold text-[#152033]">{model.currentRange}</div>
          <div className="text-xs text-gray-500">comparado com {model.previousRange}</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Segmented label="Período" value={period} onChange={(value) => setPeriod(value as PeriodKey)} items={[['7d','7 dias'],['30d','30 dias'],['90d','90 dias'],['month','Mês'],['all','Histórico']]} />
          <Segmented label="Agrupar" value={grain} onChange={(value) => setGrain(value as Grain)} items={[['day','Dia'],['week','Semana'],['month','Mês']]} />
        </div>
      </section>

      {error && <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}

      <section className="overflow-hidden border border-[#DDE3EA] bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          {kpis.map(([label, value, delta], index) => (
            <div key={label} className={`min-w-0 p-3 sm:p-4 ${index % 2 ? '' : 'border-r border-[#E8EDF2]'} md:border-r md:last:border-r-0`}>
              <div className="truncate text-[10px] font-semibold uppercase text-gray-500">{label}</div>
              <div className="mt-1 truncate text-lg font-bold tabular-nums text-[#152033] sm:text-xl">{value}</div>
              <div className={`mt-1 text-[10px] font-semibold ${delta.good ? 'text-emerald-700' : 'text-red-700'}`}>{delta.label} vs anterior</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1.55fr_0.45fr]">
        <div className="min-w-0 border border-[#DDE3EA] bg-white p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h2 className="text-sm font-bold text-[#152033]">Investimento, leads e CPL</h2><p className="text-xs text-gray-500">Leitura temporal na granularidade selecionada.</p></div>
            <TrendingUp size={17} className="text-[#0F766E]" />
          </div>
          <div className="h-[290px] min-h-[290px] min-w-0">
            {model.trend.length ? <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={290}>
              <AreaChart data={model.trend} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E8EDF2" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis yAxisId="money" tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `R$${Math.round(value)}`} tickLine={false} axisLine={false} />
                <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value, name) => name === 'Leads' ? integer(Number(value)) : brl2(Number(value))} />
                <Area yAxisId="money" type="monotone" dataKey="spend" name="Investimento" stroke="#17324D" fill="#DCE6EE" strokeWidth={2} />
                <Line yAxisId="money" type="monotone" dataKey="cpl" name="CPL" stroke="#D97706" strokeWidth={2} dot={false} />
                <Line yAxisId="leads" type="monotone" dataKey="leads" name="Leads" stroke="#0F766E" strokeWidth={2} dot={{ r: 2 }} />
              </AreaChart>
            </ResponsiveContainer> : <div className="flex h-full items-center justify-center border-y border-dashed border-[#DDE3EA] text-center"><div><Database size={22} className="mx-auto text-gray-300" /><div className="mt-2 text-sm font-semibold text-gray-600">Sem dados na janela</div><div className="mt-1 text-xs text-gray-400">A série aparecerá após a leitura autenticada do mart.</div></div></div>}
          </div>
        </div>

        <div className="border border-[#DDE3EA] bg-[#152033] p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white/60"><Activity size={14} /> Conversão cruzada</div>
          <div className="mt-5 space-y-4">
            <FunnelStep label="Leads de plataforma" value={model.currentTotals.leads} base={model.currentTotals.leads} />
            <FunnelStep label="Deals no Clint" value={Number(snapshot.kpis.qtd_leads?.value ?? 0)} base={Number(snapshot.kpis.qtd_leads?.value ?? 0)} />
            <FunnelStep label="Vendas WON" value={Number(snapshot.kpis.qtd_vendas?.value ?? 0)} base={Number(snapshot.kpis.qtd_leads?.value ?? 1)} />
          </div>
          <div className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-white/65">
            O elo definitivo será o identificador do lead entre campanha, Clint e receita. Até lá, os volumes ficam separados para evitar atribuição falsa.
          </div>
        </div>
      </section>

      <section className="overflow-hidden border border-[#DDE3EA] bg-white">
        <div className="flex items-center justify-between border-b border-[#DDE3EA] px-4 py-3">
          <div><h2 className="text-sm font-bold text-[#152033]">Campanhas que explicam o resultado</h2><p className="text-xs text-gray-500">Ranking por investimento, com eficiência e volume.</p></div>
          <Rows3 size={17} className="text-gray-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-xs">
            <thead className="bg-[#F8FAFC] text-gray-500"><tr>
              <th className="px-4 py-2.5 text-left font-semibold">Campanha</th><th className="px-3 py-2.5 text-right font-semibold">Investimento</th><th className="px-3 py-2.5 text-right font-semibold">Impressões</th><th className="px-3 py-2.5 text-right font-semibold">Cliques</th><th className="px-3 py-2.5 text-right font-semibold">Leads</th><th className="px-3 py-2.5 text-right font-semibold">CTR</th><th className="px-4 py-2.5 text-right font-semibold">CPL</th>
            </tr></thead>
            <tbody>{model.campaigns.map((row) => <tr key={row.name} className="border-t border-[#EEF2F6] hover:bg-[#F8FAFC]">
              <td className="max-w-[340px] truncate px-4 py-2.5 font-semibold text-[#152033]" title={row.name}>{row.name}</td><td className="px-3 py-2.5 text-right font-mono">{brl2(row.spend)}</td><td className="px-3 py-2.5 text-right font-mono">{integer(row.impressions)}</td><td className="px-3 py-2.5 text-right font-mono">{integer(row.clicks)}</td><td className="px-3 py-2.5 text-right font-mono text-emerald-700">{integer(row.leads)}</td><td className="px-3 py-2.5 text-right font-mono">{pct(row.ctr)}</td><td className="px-4 py-2.5 text-right font-mono">{row.leads ? brl2(row.cpl) : '—'}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <MetaCreativesInline />

      <section className="grid grid-cols-1 gap-px overflow-hidden border border-[#DDE3EA] bg-[#DDE3EA] md:grid-cols-2">
        <Action title="Comparativo" text="Compare períodos equivalentes sem depender do horário da sincronização." icon={<TrendingUp size={16} />} to="comparativo" />
        <Action title="Conversão CRM" text="Use Sales + CRM para separar lead, oportunidade, venda e receita." icon={<Activity size={16} />} to="../sales" />
      </section>
    </div>
  )
}

function MetaCreativesInline() {
  const [ads, setAds] = useState<InlineAd[]>([])
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState<string | null>(null)
  const [inspectId, setInspectId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) { setNote('Faça login para ver os criativos.'); setLoading(false); return }
        const resp = await fetch('/api/integrations?op=meta-ads-detail&client_slug=moai&preset=last_30d&limit=8', {
          headers: { authorization: `Bearer ${token}` },
        })
        if (resp.status === 501) {
          const j = (await resp.json()) as { note?: string }
          if (!cancelled) { setNote(j.note ?? 'Integração Meta não configurada para MOAI.'); setLoading(false) }
          return
        }
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const body = (await resp.json()) as { ads?: InlineAd[]; account_id?: string }
        if (!cancelled) { setAds((body.ads ?? []).slice(0, 8)); setAccountId(body.account_id ?? ''); setLoading(false) }
      } catch (e) {
        if (!cancelled) { setNote(e instanceof Error ? e.message : 'Falha ao carregar criativos.'); setLoading(false) }
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <section className="overflow-hidden border border-[#DDE3EA] bg-white">
        <div className="flex items-center justify-between border-b border-[#DDE3EA] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[#152033]">Criativos Meta Ads</h2>
            <p className="text-xs text-gray-500">CTR, CPL e investimento sem abrir o painel. Clique para inspecionar.</p>
          </div>
          <Link to="meta" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline">
            Ver todos <ExternalLink size={12} />
          </Link>
        </div>

        {loading && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">Buscando criativos via Meta Graph API…</div>
        )}
        {!loading && note && (
          <div className="px-4 py-6 text-center text-sm text-amber-700">{note}</div>
        )}
        {!loading && !note && ads.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-gray-500">Nenhum criativo encontrado no período.</div>
        )}
        {!loading && !note && ads.length > 0 && (
          <div className="grid grid-cols-2 gap-px bg-[#DDE3EA] sm:grid-cols-3 lg:grid-cols-4">
            {ads.map((ad) => <InlineCreativeCard key={ad.id} ad={ad} onInspect={setInspectId} />)}
          </div>
        )}
      </section>

      {accountId && (
        <MetaAdInspector
          clientSlug="moai"
          adId={inspectId}
          accountId={accountId}
          onClose={() => setInspectId(null)}
        />
      )}
    </>
  )
}

function InlineCreativeCard({ ad, onInspect }: { ad: InlineAd; onInspect: (id: string) => void }) {
  const [imgError, setImgError] = useState(false)
  const thumb = ad.creative.image_url || ad.creative.thumbnail_url
  const isVideo = !!ad.creative.video_id
  const isActive = ad.effective_status === 'ACTIVE'

  return (
    <button
      type="button"
      onClick={() => onInspect(ad.id)}
      className="group flex flex-col bg-white text-left hover:bg-[#F8FAFC] focus:outline-none"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#101828]">
        {thumb && !imgError ? (
          <img src={thumb} alt={ad.name} onError={() => setImgError(true)} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><ImageIcon size={24} className="text-gray-600" /></div>
        )}
        {isVideo && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 transition-colors group-hover:bg-black/80">
              <Play size={14} className="fill-white text-white" />
            </div>
          </div>
        )}
        <span className={`absolute right-2 top-2 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white/80 text-gray-500'}`}>
          {isActive ? 'Ativo' : 'Pausado'}
        </span>
      </div>
      <div className="flex-1 p-2.5">
        <p className="truncate text-xs font-semibold text-[#152033]" title={ad.name}>{ad.name}</p>
        <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
          <span className="truncate text-gray-500">Inv. <strong className="text-[#152033]">{brl(ad.metrics.spend)}</strong></span>
          <span className="truncate text-gray-500">CTR <strong className="text-[#152033]">{ad.metrics.ctr > 0 ? pct(ad.metrics.ctr) : '—'}</strong></span>
          <span className="truncate text-gray-500">
            {ad.metrics.leads > 0
              ? <><>CPL </><strong className="text-emerald-700">{brl2(ad.metrics.cost_per_lead)}</strong></>
              : <><>CPC </><strong className="text-[#152033]">{ad.metrics.cpc > 0 ? brl2(ad.metrics.cpc) : '—'}</strong></>}
          </span>
        </div>
      </div>
    </button>
  )
}

function Segmented({ label, value, items, onChange }: { label: string; value: string; items: Array<[string,string]>; onChange: (value: string) => void }) {
  return <div><div className="mb-1 text-[10px] font-semibold uppercase text-gray-500">{label}</div><div className="flex min-h-10 overflow-x-auto rounded-md border border-[#CBD5E1] bg-white p-0.5">{items.map(([key, text]) => <button key={key} type="button" onClick={() => onChange(key)} className={`whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-semibold ${value === key ? 'bg-[#152033] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{text}</button>)}</div></div>
}
function FunnelStep({ label, value, base }: { label: string; value: number; base: number }) {
  const width = base ? Math.max(8, Math.min(100, (value / base) * 100)) : 8
  return <div><div className="mb-1 flex items-center justify-between text-xs"><span className="text-white/70">{label}</span><strong className="tabular-nums">{integer(value)}</strong></div><div className="h-1.5 bg-white/10"><div className="h-full bg-[#38BFA7]" style={{ width: `${width}%` }} /></div></div>
}
function Action({ title, text, icon, to }: { title: string; text: string; icon: React.ReactNode; to?: string }) {
  const inner = <><div className="flex items-center gap-2 text-sm font-bold text-[#152033]">{icon}{title}</div><p className="mt-2 text-xs leading-5 text-gray-500">{text}</p></>
  if (to) return <Link to={to} className="block bg-white p-4 hover:bg-[#F8FAFC]">{inner}</Link>
  return <div className="bg-white p-4">{inner}</div>
}
