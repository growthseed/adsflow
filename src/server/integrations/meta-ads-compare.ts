/**
 * GET /api/integrations?op=meta-ads-compare&client_slug=<slug>&preset=last_30d
 *
 * Compara performance Meta entre período atual e período anterior do
 * mesmo tamanho (last_30d → 30 dias antes; last_7d → 7 dias antes; etc).
 *
 * Faz 2 chamadas paralelas a /act_X/insights?level=campaign&time_range={...}
 * e junta os resultados por campaign_id.
 *
 * Retorna:
 *   {
 *     account_id, currency,
 *     current_range: { since, until }, previous_range: { since, until },
 *     totals: { current: {...}, previous: {...}, delta: { abs, pct } },
 *     campaigns: [{
 *       campaign_id, campaign_name,
 *       current: { spend, impressions, clicks, leads, ctr, cpc, cpm, cost_per_lead },
 *       previous: { same shape },
 *       delta: { spend_abs, spend_pct, leads_abs, leads_pct, ... },
 *     }],
 *   }
 *
 * Estratégia "Ofensores" do PBI:
 *   ordenar campanhas pela maior magnitude de variação na métrica escolhida
 *   (atual − anterior). Negativos = "ofensores" (caiu). Positivos = "ganhos".
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { allowMethods, applyCors, requireUserAuth } from '../../../api/_lib/security.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const GRAPH_BASE = 'https://graph.facebook.com/v22.0'
const CACHE_TTL_MS = 5 * 60 * 1000

interface Action { action_type: string; value: string }
interface InsightRow {
  campaign_id?: string
  campaign_name?: string
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  cpm?: string
  reach?: string
  frequency?: string
  actions?: Action[]
}

interface PeriodMetrics {
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

const ZERO_METRICS: PeriodMetrics = {
  spend: 0, impressions: 0, clicks: 0, link_clicks: 0, leads: 0,
  reach: 0, ctr: 0, cpc: 0, cpm: 0, cost_per_lead: 0,
}

const cache = new Map<string, { ts: number; payload: unknown }>()

// ---- Date helpers ----

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function presetToRange(preset: string, now = new Date()): { since: string; until: string; days: number } | null {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = 86400000

  const fromOffset = (daysBack: number): { since: string; until: string; days: number } => {
    const until = new Date(today.getTime() - day) // ontem
    const since = new Date(until.getTime() - (daysBack - 1) * day)
    return { since: ymd(since), until: ymd(until), days: daysBack }
  }

  switch (preset) {
    case 'today': return { since: ymd(today), until: ymd(today), days: 1 }
    case 'yesterday': {
      const y = new Date(today.getTime() - day)
      return { since: ymd(y), until: ymd(y), days: 1 }
    }
    case 'last_7d': return fromOffset(7)
    case 'last_14d': return fromOffset(14)
    case 'last_30d': return fromOffset(30)
    case 'last_90d': return fromOffset(90)
    case 'this_month': {
      const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      const days = Math.ceil((today.getTime() - since.getTime()) / day) + 1
      return { since: ymd(since), until: ymd(today), days }
    }
    case 'last_month': {
      const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
      const until = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
      const days = Math.round((until.getTime() - since.getTime()) / day) + 1
      return { since: ymd(since), until: ymd(until), days }
    }
    default: return null
  }
}

function previousRange(cur: { since: string; until: string; days: number }): { since: string; until: string } {
  const day = 86400000
  const sinceCur = new Date(cur.since + 'T00:00:00Z').getTime()
  const since = new Date(sinceCur - cur.days * day)
  const until = new Date(sinceCur - day)
  return { since: ymd(since), until: ymd(until) }
}

// ---- Aggregators ----

function actionValue(actions: Action[] | undefined, types: string[]): number {
  if (!actions) return 0
  let sum = 0
  for (const a of actions) {
    if (types.includes(a.action_type)) sum += Number(a.value) || 0
  }
  return sum
}

function fromRow(row: InsightRow): PeriodMetrics {
  const spend = Number(row.spend || 0)
  const impressions = Number(row.impressions || 0)
  const clicks = Number(row.clicks || 0)
  const link_clicks = actionValue(row.actions, ['link_click'])
  const leads = actionValue(row.actions, [
    'lead',
    'onsite_conversion.lead_grouped',
    'offsite_conversion.fb_pixel_lead',
    'onsite_conversion.messaging_first_reply',
    'onsite_conversion.messaging_conversation_started_7d',
  ])
  return {
    spend,
    impressions,
    clicks,
    link_clicks,
    leads,
    reach: Number(row.reach || 0),
    ctr: impressions > 0 ? clicks / impressions : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cost_per_lead: leads > 0 ? spend / leads : 0,
  }
}

function delta(curr: PeriodMetrics, prev: PeriodMetrics): { spend_abs: number; spend_pct: number; leads_abs: number; leads_pct: number; impressions_abs: number; impressions_pct: number; clicks_abs: number; clicks_pct: number } {
  const pct = (a: number, b: number) => (b > 0 ? (a - b) / b : a > 0 ? 1 : 0)
  return {
    spend_abs: curr.spend - prev.spend,
    spend_pct: pct(curr.spend, prev.spend),
    leads_abs: curr.leads - prev.leads,
    leads_pct: pct(curr.leads, prev.leads),
    impressions_abs: curr.impressions - prev.impressions,
    impressions_pct: pct(curr.impressions, prev.impressions),
    clicks_abs: curr.clicks - prev.clicks,
    clicks_pct: pct(curr.clicks, prev.clicks),
  }
}

async function fetchInsights(accountId: string, token: string, since: string, until: string): Promise<InsightRow[]> {
  const fields = 'campaign_id,campaign_name,spend,impressions,clicks,actions,reach,frequency'
  const tr = encodeURIComponent(JSON.stringify({ since, until }))
  const url = `${GRAPH_BASE}/${accountId}/insights?level=campaign&fields=${fields}&time_range=${tr}&limit=500&access_token=${encodeURIComponent(token)}`
  const r = await fetch(url)
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`Graph insights ${r.status}: ${t.slice(0, 200)}`)
  }
  const j = (await r.json()) as { data?: InsightRow[]; error?: { message: string } }
  if (j.error) throw new Error(j.error.message)
  return j.data ?? []
}

// ---- Handler ----

export async function runMetaAdsCompare(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['GET'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const slug = String(req.query.client_slug || '').trim()
  if (!slug) return res.status(400).json({ error: 'client_slug required' })

  const preset = String(req.query.preset || 'last_30d').trim()
  const range = presetToRange(preset)
  if (!range) return res.status(400).json({ error: `unknown preset ${preset}` })
  const prev = previousRange(range)
  const cacheKey = `${slug}|${preset}`

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: client } = await svc.from('clients').select('id, name').eq('slug', slug).maybeSingle()
  if (!client) return res.status(404).json({ error: 'client not found' })

  const clientId = (client as { id: string }).id
  const { data: member } = await svc
    .from('client_members')
    .select('user_id')
    .eq('client_id', clientId)
    .eq('user_id', auth.user.id)
    .maybeSingle()
  const isSuperAdmin = auth.globalRole === 'super_admin' || auth.globalRole === 'admin'
  if (!member && !isSuperAdmin) return res.status(403).json({ error: 'forbidden' })

  const { data: integration } = await svc
    .from('client_integrations')
    .select('external_account_id, access_token')
    .eq('client_id', clientId)
    .eq('provider', 'meta_ads')
    .eq('status', 'active')
    .maybeSingle()
  if (!integration) return res.status(501).json({ note: 'Integração Meta Ads não conectada.' })

  const accountId = (integration as { external_account_id?: string | null }).external_account_id
  const token = (integration as { access_token?: string | null }).access_token
  if (!accountId || !token) return res.status(501).json({ note: 'Credenciais Meta incompletas.' })

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return res.status(200).json({ ...(cached.payload as Record<string, unknown>), cached: true })
  }

  try {
    const [curRows, prevRows] = await Promise.all([
      fetchInsights(accountId, token, range.since, range.until),
      fetchInsights(accountId, token, prev.since, prev.until),
    ])

    // Index por campaign_id
    const map = new Map<string, { campaign_id: string; campaign_name: string; current: PeriodMetrics; previous: PeriodMetrics }>()
    for (const r of curRows) {
      const id = r.campaign_id ?? '__unknown__'
      map.set(id, {
        campaign_id: id,
        campaign_name: r.campaign_name ?? '(sem nome)',
        current: fromRow(r),
        previous: ZERO_METRICS,
      })
    }
    for (const r of prevRows) {
      const id = r.campaign_id ?? '__unknown__'
      const existing = map.get(id)
      if (existing) existing.previous = fromRow(r)
      else map.set(id, {
        campaign_id: id,
        campaign_name: r.campaign_name ?? '(sem nome)',
        current: ZERO_METRICS,
        previous: fromRow(r),
      })
    }

    const campaigns = Array.from(map.values()).map((c) => ({
      ...c,
      delta: delta(c.current, c.previous),
    }))
    // Ordem padrão: maior magnitude de variação em spend
    campaigns.sort((a, b) => Math.abs(b.delta.spend_abs) - Math.abs(a.delta.spend_abs))

    const sumPeriod = (rows: PeriodMetrics[]): PeriodMetrics => {
      const acc = rows.reduce((s, r) => ({
        spend: s.spend + r.spend,
        impressions: s.impressions + r.impressions,
        clicks: s.clicks + r.clicks,
        link_clicks: s.link_clicks + r.link_clicks,
        leads: s.leads + r.leads,
        reach: s.reach + r.reach,
        ctr: 0, cpc: 0, cpm: 0, cost_per_lead: 0,
      }), { ...ZERO_METRICS })
      acc.ctr = acc.impressions > 0 ? acc.clicks / acc.impressions : 0
      acc.cpc = acc.clicks > 0 ? acc.spend / acc.clicks : 0
      acc.cpm = acc.impressions > 0 ? (acc.spend / acc.impressions) * 1000 : 0
      acc.cost_per_lead = acc.leads > 0 ? acc.spend / acc.leads : 0
      return acc
    }
    const currTotals = sumPeriod(campaigns.map((c) => c.current))
    const prevTotals = sumPeriod(campaigns.map((c) => c.previous))

    const payload = {
      client_slug: slug,
      account_id: accountId,
      currency: 'BRL',
      preset,
      current_range: { since: range.since, until: range.until },
      previous_range: prev,
      totals: {
        current: currTotals,
        previous: prevTotals,
        delta: delta(currTotals, prevTotals),
      },
      campaigns,
      fetched_at: new Date().toISOString(),
    }

    cache.set(cacheKey, { ts: Date.now(), payload })
    return res.status(200).json({ ...payload, cached: false })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(502).json({ error: 'meta compare failed', detail: msg })
  }
}
