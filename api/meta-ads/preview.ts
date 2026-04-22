/**
 * GET /api/meta-ads/preview?ad_id=<fb_ad_id>
 *
 * Proxy para Meta Graph API — retorna preview (image_url + body + title)
 * de um ad específico. Usa o META_ACCESS_TOKEN global da agência, ou o
 * access_token do client_integrations se configurado.
 *
 * Retornos:
 *   200 { previewUrl, imageUrl, title, body } · preview disponível
 *   404 { note } · ad não encontrado na Graph API (pode ser archived)
 *   501 { note } · META_ACCESS_TOKEN não configurado (modal usa snapshot local)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

import { applyCors, allowMethods } from '../_lib/security'

const META_API_VERSION = process.env.VITE_META_API_VERSION || 'v23.0'
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || ''

interface GraphAdResponse {
  id?: string
  creative?: {
    id?: string
    image_url?: string
    thumbnail_url?: string
    title?: string
    body?: string
    object_story_spec?: {
      link_data?: { name?: string; description?: string; image_hash?: string; picture?: string }
      video_data?: { title?: string; message?: string; image_url?: string }
    }
  }
  preview_shareable_link?: string
  effective_status?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['GET'])) return

  const adId = String(req.query.ad_id || '').trim()
  if (!adId) {
    return res.status(400).json({ error: 'ad_id is required' })
  }

  if (!META_ACCESS_TOKEN) {
    return res.status(501).json({
      note:
        'META_ACCESS_TOKEN não configurado no servidor. Configure a integração Meta em Configurações → Integrações.',
    })
  }

  try {
    const fields = [
      'preview_shareable_link',
      'effective_status',
      'creative{id,image_url,thumbnail_url,title,body,object_story_spec}',
    ].join(',')
    const url = `https://graph.facebook.com/${META_API_VERSION}/${encodeURIComponent(adId)}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`
    const r = await fetch(url)
    if (r.status === 404) {
      return res.status(404).json({ note: 'Ad não encontrado na Graph API (pode estar archived ou ser ID interno).' })
    }
    if (!r.ok) {
      const body = await r.text().catch(() => '')
      return res.status(502).json({ error: `Graph API error ${r.status}`, detail: body.slice(0, 400) })
    }
    const data = (await r.json()) as GraphAdResponse
    const cr = data.creative
    const linkData = cr?.object_story_spec?.link_data
    const videoData = cr?.object_story_spec?.video_data

    return res.status(200).json({
      previewUrl: data.preview_shareable_link,
      imageUrl: cr?.image_url ?? cr?.thumbnail_url ?? linkData?.picture ?? videoData?.image_url,
      title: cr?.title ?? linkData?.name ?? videoData?.title,
      body: cr?.body ?? linkData?.description ?? videoData?.message,
      effectiveStatus: data.effective_status,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return res.status(500).json({ error: 'preview fetch failed', detail: msg })
  }
}
