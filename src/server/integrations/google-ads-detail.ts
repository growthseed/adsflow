/**
 * GET /api/integrations?op=google-ads-detail&client_slug=<slug>&preset=last_30d
 *
 * Resolve a integração Google Ads do cliente (provider='google_ads'),
 * refresca access_token via OAuth2, e chama Google Ads API v21 (GAQL)
 * com login-customer-id (MCC) quando aplicável.
 *
 * Retorna:
 *   {
 *     account_id, account_name, currency,
 *     preset, returned,
 *     campaigns: [{
 *       id, name, status, channel_type, budget_micros,
 *       metrics: { spend, impressions, clicks, conversions, ctr, cpc, cpm, cost_per_conversion, search_impression_share },
 *     }],
 *     totals: {...},
 *   }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { allowMethods, applyCors, requireUserAuth } from '../../../api/_lib/security.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || ''
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || ''
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || ''
const GADS_API = 'https://googleads.googleapis.com/v21'
const CACHE_TTL_MS = 5 * 60 * 1000

interface GaqlRow {
  campaign?: {
    id?: string
    name?: string
    status?: string
    advertisingChannelType?: string
  }
  campaignBudget?: { amountMicros?: string }
  metrics?: {
    costMicros?: string
    impressions?: string
    clicks?: string
    conversions?: number | string
    conversionsValue?: number | string
    ctr?: number | string
    averageCpc?: string
    averageCpm?: string
    costPerConversion?: string
    searchImpressionShare?: number | string
  }
}

interface GaqlBatch { results?: GaqlRow[] }

const cache = new Map<string, { ts: number; payload: unknown }>()

const PRESET_TO_DURING: Record<string, string> = {
  today: 'TODAY',
  yesterday: 'YESTERDAY',
  last_7d: 'LAST_7_DAYS',
  last_14d: 'LAST_14_DAYS',
  last_30d: 'LAST_30_DAYS',
  last_90d: 'LAST_90_DAYS',
  this_month: 'THIS_MONTH',
  last_month: 'LAST_MONTH',
}

async function refreshAccessToken(
  refreshToken: string,
  clientIdOverride?: string,
  clientSecretOverride?: string,
): Promise<string> {
  // O refresh_token está vinculado ao OAuth client que o emitiu. Se a
  // integração foi seedada de um arquivo de secrets cujo client_id é
  // diferente do GOOGLE_ADS_CLIENT_ID do .env, o Google rejeita com
  // 401 "unauthorized_client". Aceitamos override do metadata.
  const cid = clientIdOverride || CLIENT_ID
  const csec = clientSecretOverride || CLIENT_SECRET
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cid,
      client_secret: csec,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`Google OAuth refresh ${r.status}: ${t.slice(0, 200)}`)
  }
  const j = (await r.json()) as { access_token?: string; error?: string; error_description?: string }
  if (!j.access_token) throw new Error(`OAuth sem access_token: ${j.error_description ?? j.error ?? 'unknown'}`)
  return j.access_token
}

async function gaqlQuery(
  customerId: string,
  accessToken: string,
  query: string,
  loginCustomerId?: string | null,
): Promise<GaqlRow[]> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
  }
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId.replace(/-/g, '')
  const cleanCid = customerId.replace(/-/g, '')
  const r = await fetch(`${GADS_API}/customers/${cleanCid}/googleAds:searchStream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`GAQL ${r.status}: ${t.slice(0, 400)}`)
  }
  const data = (await r.json()) as GaqlBatch[]
  const out: GaqlRow[] = []
  if (Array.isArray(data)) {
    for (const batch of data) {
      if (batch.results) out.push(...batch.results)
    }
  }
  return out
}

function microsToReais(n: string | number | undefined): number {
  return Number(n || 0) / 1_000_000
}

interface CampaignNormalized {
  id: string
  name: string
  status: string
  channel_type: string
  budget_daily: number
  metrics: {
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
}

function normalizeRow(r: GaqlRow): CampaignNormalized {
  const m = r.metrics ?? {}
  const spend = microsToReais(m.costMicros)
  const impressions = Number(m.impressions || 0)
  const clicks = Number(m.clicks || 0)
  const conv = Number(m.conversions || 0)
  return {
    id: r.campaign?.id ?? '',
    name: r.campaign?.name ?? '(sem nome)',
    status: r.campaign?.status ?? 'UNKNOWN',
    channel_type: r.campaign?.advertisingChannelType ?? 'UNKNOWN',
    budget_daily: microsToReais(r.campaignBudget?.amountMicros),
    metrics: {
      spend,
      impressions,
      clicks,
      conversions: conv,
      conversions_value: Number(m.conversionsValue || 0),
      ctr: impressions > 0 ? clicks / impressions : 0,
      cpc: microsToReais(m.averageCpc),
      cpm: microsToReais(m.averageCpm),
      cost_per_conversion: microsToReais(m.costPerConversion),
      search_impression_share: Number(m.searchImpressionShare || 0),
    },
  }
}

export async function runGoogleAdsDetail(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['GET'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  if (!DEVELOPER_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'GOOGLE_ADS_* env vars not configured' })
  }

  const slug = String(req.query.client_slug || '').trim()
  if (!slug) return res.status(400).json({ error: 'client_slug required' })

  const preset = String(req.query.preset || 'last_30d').trim()
  const during = PRESET_TO_DURING[preset]
  if (!during) return res.status(400).json({ error: `unknown preset ${preset}` })
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
    .select('external_account_id, external_account_name, external_workspace_id, refresh_token, metadata')
    .eq('client_id', clientId)
    .eq('provider', 'google_ads')
    .eq('status', 'active')
    .maybeSingle()
  if (!integration) return res.status(501).json({ note: 'Integração Google Ads não conectada.' })

  const accountId = (integration as { external_account_id?: string | null }).external_account_id
  const accountName = (integration as { external_account_name?: string | null }).external_account_name
  const loginCustomerId = (integration as { external_workspace_id?: string | null }).external_workspace_id
  const refreshToken = (integration as { refresh_token?: string | null }).refresh_token
  const meta = (integration as { metadata?: { client_id?: string; client_secret?: string } | null }).metadata ?? {}
  if (!accountId || !refreshToken) {
    return res.status(501).json({ note: 'Credenciais Google Ads incompletas (account_id ou refresh_token).' })
  }

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return res.status(200).json({ ...(cached.payload as Record<string, unknown>), cached: true })
  }

  try {
    const accessToken = await refreshAccessToken(refreshToken, meta.client_id, meta.client_secret)

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm,
        metrics.cost_per_conversion,
        metrics.search_impression_share
      FROM campaign
      WHERE segments.date DURING ${during}
      ORDER BY metrics.cost_micros DESC
      LIMIT 200
    `

    const rows = await gaqlQuery(accountId, accessToken, query, loginCustomerId ?? undefined)
    const campaigns = rows.map(normalizeRow)

    // Totais
    const totals = campaigns.reduce(
      (s, c) => ({
        spend: s.spend + c.metrics.spend,
        impressions: s.impressions + c.metrics.impressions,
        clicks: s.clicks + c.metrics.clicks,
        conversions: s.conversions + c.metrics.conversions,
        conversions_value: s.conversions_value + c.metrics.conversions_value,
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversions_value: 0 },
    )

    const payload = {
      client_slug: slug,
      account_id: accountId,
      account_name: accountName,
      currency: 'BRL',
      preset,
      returned: campaigns.length,
      campaigns,
      totals: {
        ...totals,
        ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
        cost_per_conversion: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
        roas: totals.spend > 0 ? totals.conversions_value / totals.spend : 0,
      },
      fetched_at: new Date().toISOString(),
    }

    cache.set(cacheKey, { ts: Date.now(), payload })
    return res.status(200).json({ ...payload, cached: false })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(502).json({ error: 'google ads fetch failed', detail: msg })
  }
}
