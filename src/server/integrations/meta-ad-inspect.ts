/**
 * GET /api/integrations?op=meta-ad-inspect&client_slug=<slug>&ad_id=<id>
 *
 * Inspector de criativo Meta — devolve previews oficiais do Facebook
 * (iframes nativos com vídeo/imagem em alta) prontos pra embed dentro
 * do AdsFlow, sem o usuário precisar abrir Ad Library / Gerenciador.
 *
 * Returns:
 *   {
 *     ad_id, name, status, effective_status,
 *     creative: { id, name, image_url, thumbnail_url, video_id, title, body, cta, page_id, instagram_user_id, instagram_permalink_url, effective_object_story_id },
 *     previews: [{
 *       format: "MOBILE_FEED_STANDARD",
 *       label: "Feed mobile",
 *       iframe_src: "https://business.facebook.com/...",
 *       width: 335,
 *       height: 450,
 *     }, ...],
 *     metrics: { spend, impressions, clicks, leads, ... },
 *   }
 *
 * Cada iframe é o player nativo do Facebook — vídeos com som/autoplay
 * conforme a plataforma, imagens em alta, exatamente como o usuário
 * final vê. Não precisamos baixar nem hospedar mídia.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { allowMethods, applyCors, requireUserAuth } from '../../../api/_lib/security.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const GRAPH_BASE = 'https://graph.facebook.com/v22.0'
const CACHE_TTL_MS = 10 * 60 * 1000

// Formatos cobertos — labels canônicos da Marketing API. Cada um renderiza
// o ad como apareceria naquele placement. Width/height são os recomendados
// pela documentação do Facebook (matem o aspect ratio do placement real).
const PREVIEW_FORMATS = [
  { format: 'MOBILE_FEED_STANDARD', label: 'Feed mobile', width: 335, height: 450 },
  { format: 'DESKTOP_FEED_STANDARD', label: 'Feed desktop', width: 540, height: 690 },
  { format: 'INSTAGRAM_STANDARD', label: 'Instagram feed', width: 320, height: 488 },
  { format: 'INSTAGRAM_STORY', label: 'IG Story', width: 320, height: 570 },
  { format: 'INSTAGRAM_REELS', label: 'IG Reels', width: 320, height: 570 },
  { format: 'FACEBOOK_REELS_MOBILE', label: 'FB Reels', width: 320, height: 570 },
  { format: 'FACEBOOK_STORY_MOBILE', label: 'FB Story', width: 320, height: 570 },
] as const

interface CreativeRaw {
  id?: string
  name?: string
  image_url?: string
  thumbnail_url?: string
  video_id?: string
  title?: string
  body?: string
  call_to_action_type?: string
  object_type?: string
  instagram_permalink_url?: string
  effective_object_story_id?: string
  object_story_spec?: {
    page_id?: string
    instagram_user_id?: string
    link_data?: { name?: string; description?: string; message?: string; call_to_action?: { type?: string } }
    video_data?: { title?: string; message?: string; call_to_action?: { type?: string } }
  }
}

interface AdRaw {
  id?: string
  name?: string
  status?: string
  effective_status?: string
  adcreatives?: { data?: CreativeRaw[] }
  insights?: { data?: Array<{ spend?: string; impressions?: string; clicks?: string; ctr?: string; cpc?: string; cpm?: string; reach?: string; frequency?: string; actions?: Array<{ action_type: string; value: string }> }> }
  error?: { message?: string }
}

interface PreviewResp { data?: Array<{ body?: string }>; error?: { message?: string; code?: number } }

const cache = new Map<string, { ts: number; payload: unknown }>()

function extractIframeSrc(html: string | undefined): string | null {
  if (!html) return null
  const m = /src=["']([^"']+)["']/i.exec(html)
  if (!m) return null
  return m[1].replace(/&amp;/g, '&')
}

function actionValue(actions: Array<{ action_type: string; value: string }> | undefined, types: string[]): number {
  if (!actions) return 0
  let sum = 0
  for (const a of actions) if (types.includes(a.action_type)) sum += Number(a.value) || 0
  return sum
}

export async function runMetaAdInspect(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['GET'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const slug = String(req.query.client_slug || '').trim()
  const adId = String(req.query.ad_id || '').trim()
  if (!slug) return res.status(400).json({ error: 'client_slug required' })
  if (!adId) return res.status(400).json({ error: 'ad_id required' })

  const cacheKey = `${slug}|${adId}`

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
    .select('access_token, external_account_id')
    .eq('client_id', clientId)
    .eq('provider', 'meta_ads')
    .eq('status', 'active')
    .maybeSingle()
  if (!integration) return res.status(501).json({ note: 'Integração Meta Ads não conectada.' })
  const token = (integration as { access_token?: string | null }).access_token
  if (!token) return res.status(501).json({ note: 'Token Meta ausente.' })

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return res.status(200).json({ ...(cached.payload as Record<string, unknown>), cached: true })
  }

  try {
    // 1. Ad details + creative + insights last_30d (paralelo)
    const adFields = [
      'id', 'name', 'status', 'effective_status',
      'adcreatives{id,name,image_url,thumbnail_url,video_id,title,body,call_to_action_type,object_type,instagram_permalink_url,effective_object_story_id,object_story_spec}',
      'insights.date_preset(last_30d){spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions}',
    ].join(',')

    const adUrl = `${GRAPH_BASE}/${adId}?fields=${encodeURIComponent(adFields)}&access_token=${encodeURIComponent(token)}`

    // 2. Previews em paralelo (uma chamada por formato)
    const previewUrls = PREVIEW_FORMATS.map((f) =>
      `${GRAPH_BASE}/${adId}/previews?ad_format=${f.format}&access_token=${encodeURIComponent(token)}`,
    )

    const [adResp, ...previewResps] = await Promise.all([
      fetch(adUrl),
      ...previewUrls.map((u) => fetch(u)),
    ])

    const ad = (await adResp.json()) as AdRaw
    if (ad.error) {
      return res.status(502).json({ error: 'meta ad fetch failed', detail: ad.error.message })
    }
    const cr = ad.adcreatives?.data?.[0] ?? {}
    const ins = ad.insights?.data?.[0] ?? {}

    const previewResults = await Promise.all(previewResps.map((r) => r.json() as Promise<PreviewResp>))
    interface PreviewOut { format: string; label: string; iframe_src: string; width: number; height: number }
    const previews: PreviewOut[] = []
    for (let idx = 0; idx < previewResults.length; idx++) {
      const f = PREVIEW_FORMATS[idx]
      const src = extractIframeSrc(previewResults[idx].data?.[0]?.body)
      if (src) previews.push({ format: f.format, label: f.label, iframe_src: src, width: f.width, height: f.height })
    }

    const spend = Number(ins.spend || 0)
    const link_clicks = actionValue(ins.actions, ['link_click'])
    const leads = actionValue(ins.actions, [
      'lead',
      'onsite_conversion.lead_grouped',
      'offsite_conversion.fb_pixel_lead',
      'onsite_conversion.messaging_first_reply',
      'onsite_conversion.messaging_conversation_started_7d',
    ])
    const landing_page_views = actionValue(ins.actions, ['landing_page_view', 'omni_landing_page_view'])

    const payload = {
      ad_id: ad.id,
      name: ad.name,
      status: ad.status,
      effective_status: ad.effective_status,
      creative: {
        id: cr.id ?? null,
        name: cr.name ?? null,
        image_url: cr.image_url ?? null,
        thumbnail_url: cr.thumbnail_url ?? null,
        video_id: cr.video_id ?? null,
        title: cr.title ?? cr.object_story_spec?.link_data?.name ?? cr.object_story_spec?.video_data?.title ?? null,
        body: cr.body ?? cr.object_story_spec?.link_data?.description ?? cr.object_story_spec?.video_data?.message ?? cr.object_story_spec?.link_data?.message ?? null,
        cta: cr.call_to_action_type
          ?? cr.object_story_spec?.link_data?.call_to_action?.type
          ?? cr.object_story_spec?.video_data?.call_to_action?.type
          ?? null,
        object_type: cr.object_type ?? null,
        page_id: cr.object_story_spec?.page_id ?? null,
        instagram_user_id: cr.object_story_spec?.instagram_user_id ?? null,
        instagram_permalink_url: cr.instagram_permalink_url ?? null,
        effective_object_story_id: cr.effective_object_story_id ?? null,
      },
      previews,
      metrics: {
        spend,
        impressions: Number(ins.impressions || 0),
        clicks: Number(ins.clicks || 0),
        ctr: Number(ins.ctr || 0) / 100,
        cpc: Number(ins.cpc || 0),
        cpm: Number(ins.cpm || 0),
        reach: Number(ins.reach || 0),
        frequency: Number(ins.frequency || 0),
        link_clicks,
        leads,
        landing_page_views,
        cost_per_lead: leads > 0 ? spend / leads : 0,
      },
      fetched_at: new Date().toISOString(),
    }

    cache.set(cacheKey, { ts: Date.now(), payload })
    return res.status(200).json({ ...payload, cached: false })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(502).json({ error: 'meta inspect failed', detail: msg })
  }
}
