/**
 * GET /api/integrations?op=meta-ads-detail&client_slug=<slug>&preset=last_30d&limit=50
 *
 * Resolve a integração Meta Ads do cliente em client_integrations
 * (provider='meta_ads'), chama o Graph API (v22.0) com:
 *   /act_<id>/ads
 *   ?fields=id,name,status,effective_status,adset_id,campaign_id,
 *           creative{id,name,thumbnail_url,image_url,video_id,title,body,
 *                    call_to_action_type,object_type,object_story_spec},
 *           insights.date_preset(<preset>){spend,impressions,clicks,ctr,cpc,
 *                                          cpm,reach,frequency,actions}
 *
 * Retorna:
 *   {
 *     account_id, account_name, currency,
 *     preset, total_ads, returned,
 *     ads: [{
 *       id, name, status, effective_status, adset_id, campaign_id,
 *       creative: { id, name, thumbnail_url, image_url, video_id,
 *                   title, body, cta, object_type, page_id, instagram_user_id,
 *                   permalink_url? },
 *       metrics: { spend, impressions, clicks, ctr, cpc, cpm, reach, frequency,
 *                  link_clicks, leads, landing_page_views, post_engagement,
 *                  cost_per_lead }
 *     }],
 *     totals: { spend, impressions, clicks, leads, ... }
 *   }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { allowMethods, applyCors, requireUserAuth } from '../../../api/_lib/security.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const GRAPH_BASE = 'https://graph.facebook.com/v22.0'
const CACHE_TTL_MS = 5 * 60 * 1000
const DEFAULT_LIMIT = 50

interface MetaAction {
  action_type: string
  value: string
}

interface MetaInsightsRow {
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  cpm?: string
  reach?: string
  frequency?: string
  actions?: MetaAction[]
}

interface MetaCreativeRaw {
  id?: string
  name?: string
  thumbnail_url?: string
  image_url?: string
  video_id?: string
  title?: string
  body?: string
  call_to_action_type?: string
  object_type?: string
  object_story_spec?: {
    page_id?: string
    instagram_user_id?: string
    link_data?: { name?: string; description?: string; call_to_action?: { type?: string } }
    video_data?: { title?: string; message?: string; call_to_action?: { type?: string } }
  }
}

interface MetaAdRaw {
  id: string
  name: string
  status: string
  effective_status: string
  adset_id?: string
  campaign_id?: string
  creative?: MetaCreativeRaw
  insights?: { data?: MetaInsightsRow[] }
}

interface MetaListResp {
  data: MetaAdRaw[]
  paging?: { next?: string }
  error?: { message: string; code?: number; type?: string }
}

interface AccountResp {
  id?: string
  name?: string
  currency?: string
  account_status?: number
  error?: { message: string; code?: number }
}

interface NormalizedAd {
  id: string
  name: string
  status: string
  effective_status: string
  adset_id: string | null
  campaign_id: string | null
  creative: {
    id: string | null
    name: string | null
    thumbnail_url: string | null
    image_url: string | null
    video_id: string | null
    title: string | null
    body: string | null
    cta: string | null
    object_type: string | null
    page_id: string | null
    instagram_user_id: string | null
  }
  metrics: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    cpc: number
    cpm: number
    reach: number
    frequency: number
    link_clicks: number
    leads: number
    landing_page_views: number
    post_engagement: number
    purchases: number
    cost_per_lead: number
  }
}

const cache = new Map<string, { ts: number; payload: unknown }>()

function actionValue(actions: MetaAction[] | undefined, types: string[]): number {
  if (!actions) return 0
  let sum = 0
  for (const a of actions) {
    if (types.includes(a.action_type)) sum += Number(a.value) || 0
  }
  return sum
}

function normalizeAd(raw: MetaAdRaw): NormalizedAd {
  const ins = raw.insights?.data?.[0] ?? {}
  const spend = Number(ins.spend || 0)
  const clicks = Number(ins.clicks || 0)
  const link_clicks = actionValue(ins.actions, ['link_click'])
  const leads = actionValue(ins.actions, [
    'lead',
    'onsite_conversion.lead_grouped',
    'offsite_conversion.fb_pixel_lead',
    'onsite_conversion.messaging_first_reply',
    'onsite_conversion.messaging_conversation_started_7d',
  ])
  const landing_page_views = actionValue(ins.actions, ['landing_page_view', 'omni_landing_page_view'])
  const post_engagement = actionValue(ins.actions, ['post_engagement'])
  const purchases = actionValue(ins.actions, [
    'purchase',
    'onsite_conversion.purchase',
    'offsite_conversion.fb_pixel_purchase',
  ])

  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    effective_status: raw.effective_status,
    adset_id: raw.adset_id ?? null,
    campaign_id: raw.campaign_id ?? null,
    creative: {
      id: raw.creative?.id ?? null,
      name: raw.creative?.name ?? null,
      thumbnail_url: raw.creative?.thumbnail_url ?? null,
      image_url: raw.creative?.image_url ?? null,
      video_id: raw.creative?.video_id ?? null,
      title: raw.creative?.title ?? raw.creative?.object_story_spec?.link_data?.name ?? raw.creative?.object_story_spec?.video_data?.title ?? null,
      body: raw.creative?.body ?? raw.creative?.object_story_spec?.link_data?.description ?? raw.creative?.object_story_spec?.video_data?.message ?? null,
      cta: raw.creative?.call_to_action_type
        ?? raw.creative?.object_story_spec?.link_data?.call_to_action?.type
        ?? raw.creative?.object_story_spec?.video_data?.call_to_action?.type
        ?? null,
      object_type: raw.creative?.object_type ?? null,
      page_id: raw.creative?.object_story_spec?.page_id ?? null,
      instagram_user_id: raw.creative?.object_story_spec?.instagram_user_id ?? null,
    },
    metrics: {
      spend,
      impressions: Number(ins.impressions || 0),
      clicks,
      ctr: Number(ins.ctr || 0) / 100, // Graph retorna em pontos % (0.5773 = 0.58%) — sim, ali já é "x100"
      cpc: Number(ins.cpc || 0),
      cpm: Number(ins.cpm || 0),
      reach: Number(ins.reach || 0),
      frequency: Number(ins.frequency || 0),
      link_clicks,
      leads,
      landing_page_views,
      post_engagement,
      purchases,
      cost_per_lead: leads > 0 ? spend / leads : 0,
    },
  }
}

export async function runMetaAdsDetail(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['GET'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const slug = String(req.query.client_slug || '').trim()
  if (!slug) return res.status(400).json({ error: 'client_slug required' })

  const preset = String(req.query.preset || 'last_30d').trim()
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || DEFAULT_LIMIT))
  const cacheKey = `${slug}|${preset}|${limit}`

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Resolve cliente + membership
  const { data: client } = await svc
    .from('clients')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle()
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

  // Resolve Meta integration
  const { data: integration } = await svc
    .from('client_integrations')
    .select('external_account_id, external_account_name, access_token, metadata')
    .eq('client_id', clientId)
    .eq('provider', 'meta_ads')
    .eq('status', 'active')
    .maybeSingle()
  if (!integration) {
    return res.status(501).json({
      note: 'Integração Meta Ads não conectada. Configure em Integrações → Meta para ver criativos detalhados.',
    })
  }

  const accountId = (integration as { external_account_id?: string | null }).external_account_id
  const token = (integration as { access_token?: string | null }).access_token
  if (!accountId || !token) {
    return res.status(501).json({ note: 'Credenciais Meta Ads incompletas.' })
  }

  // Cache hit?
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return res.status(200).json({ ...(cached.payload as Record<string, unknown>), cached: true })
  }

  try {
    // 1. Account info
    const acctResp = await fetch(
      `${GRAPH_BASE}/${accountId}?fields=name,currency,account_status&access_token=${encodeURIComponent(token)}`,
    )
    const acct = (await acctResp.json()) as AccountResp
    if (acct.error) {
      return res.status(502).json({ error: 'meta account fetch', detail: acct.error.message })
    }

    // 2. Ads + creative + insights
    const fields = [
      'id',
      'name',
      'status',
      'effective_status',
      'adset_id',
      'campaign_id',
      'creative{id,name,thumbnail_url,image_url,video_id,title,body,call_to_action_type,object_type,object_story_spec}',
      `insights.date_preset(${preset}){spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions}`,
    ].join(',')
    const adsUrl = `${GRAPH_BASE}/${accountId}/ads?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${encodeURIComponent(token)}`
    const adsResp = await fetch(adsUrl)
    const adsJson = (await adsResp.json()) as MetaListResp
    if (adsJson.error) {
      return res.status(502).json({ error: 'meta ads fetch', detail: adsJson.error.message })
    }

    const normalized = (adsJson.data ?? []).map(normalizeAd)
    // Ordenar por spend desc (mais relevante no topo)
    normalized.sort((a, b) => b.metrics.spend - a.metrics.spend)

    // Totais agregados
    const totals = normalized.reduce(
      (s, a) => ({
        spend: s.spend + a.metrics.spend,
        impressions: s.impressions + a.metrics.impressions,
        clicks: s.clicks + a.metrics.clicks,
        link_clicks: s.link_clicks + a.metrics.link_clicks,
        leads: s.leads + a.metrics.leads,
        landing_page_views: s.landing_page_views + a.metrics.landing_page_views,
        post_engagement: s.post_engagement + a.metrics.post_engagement,
        purchases: s.purchases + a.metrics.purchases,
        reach: s.reach + a.metrics.reach,
      }),
      { spend: 0, impressions: 0, clicks: 0, link_clicks: 0, leads: 0, landing_page_views: 0, post_engagement: 0, purchases: 0, reach: 0 },
    )

    const payload = {
      client_slug: slug,
      account_id: accountId,
      account_name: acct.name ?? null,
      currency: acct.currency ?? 'BRL',
      preset,
      returned: normalized.length,
      ads: normalized,
      totals: {
        ...totals,
        ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
        cost_per_lead: totals.leads > 0 ? totals.spend / totals.leads : 0,
      },
      fetched_at: new Date().toISOString(),
    }

    cache.set(cacheKey, { ts: Date.now(), payload })
    return res.status(200).json({ ...payload, cached: false })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(502).json({ error: 'meta fetch failed', detail: msg })
  }
}
