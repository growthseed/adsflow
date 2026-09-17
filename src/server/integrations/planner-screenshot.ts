import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'node:crypto'
import { allowMethods, applyCors, requireUserAuth } from '../../../api/_lib/security.js'
import { authorizePlanner, PLANNER_BUCKET } from './planner-assets.js'

const PROVIDER_TIMEOUT_MS = 28000
const MAX_IMAGE_BYTES = 6 * 1024 * 1024
type FetchLike = typeof fetch

/** Só aceita http(s) públicos: nada de localhost, IPs privados ou esquemas exóticos. */
export function normalizePageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  let parsed: URL
  try { parsed = new URL(value.trim()) } catch { return null }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  const host = parsed.hostname.toLowerCase()
  if (!host.includes('.') || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return null
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.startsWith('[')) return null
  parsed.hash = ''
  return parsed.toString()
}

export function screenshotKey(url: string) {
  return createHash('sha1').update(url).digest('hex').slice(0, 24)
}

/**
 * Captura a pagina via Microlink (renderiza em Chrome headless) e devolve os
 * bytes do JPEG. O download da imagem so e aceito de hosts *.microlink.io.
 */
export async function captureViaMicrolink(url: string, fetchImpl: FetchLike = fetch) {
  const api = new URL('https://api.microlink.io/')
  api.searchParams.set('url', url)
  api.searchParams.set('screenshot', 'true')
  api.searchParams.set('meta', 'true')
  api.searchParams.set('viewport.width', '1280')
  api.searchParams.set('viewport.height', '800')
  api.searchParams.set('screenshot.type', 'jpeg')
  api.searchParams.set('waitUntil', 'networkidle2')
  const response = await fetchImpl(api, { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS), headers: { Accept: 'application/json' } })
  const payload = await response.json().catch(() => null) as { status?: string; statusCode?: number | null; data?: { url?: string; screenshot?: { url?: string } }; message?: string } | null
  const shot = payload?.data?.screenshot?.url
  if (!response.ok || payload?.status !== 'success' || !shot) throw new Error(payload?.message || `Provedor de screenshot respondeu ${response.status}.`)
  // Sem isso a miniatura vira a tela de erro do Chrome ("This page isn't working"):
  // paginas 4xx/5xx e redirecionamentos que nao saem do lugar (www -> www) sao recusados.
  const pageStatus = payload.statusCode ?? 200
  if (pageStatus >= 400) throw new Error(`a pagina respondeu HTTP ${pageStatus}.`)
  if (pageStatus >= 300 && (!payload.data?.url || payload.data.url === url)) throw new Error(`a pagina redireciona em loop (HTTP ${pageStatus}). Tente a URL sem "www" ou o endereco final.`)
  const shotUrl = new URL(shot)
  if (shotUrl.protocol !== 'https:' || !(shotUrl.hostname === 'microlink.io' || shotUrl.hostname.endsWith('.microlink.io'))) throw new Error('Origem da imagem nao confiavel.')
  const image = await fetchImpl(shotUrl, { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) })
  if (!image.ok) throw new Error(`Download da miniatura falhou (${image.status}).`)
  const bytes = Buffer.from(await image.arrayBuffer())
  if (bytes.length < 1000 || bytes.length > MAX_IMAGE_BYTES || bytes[0] !== 255 || bytes[1] !== 216) throw new Error('Miniatura invalida.')
  return bytes
}

/**
 * GET /api/integrations?op=planner-screenshot&client_slug=...&url=...&refresh=1
 * Devolve a URL publica da miniatura da pagina, reaproveitando o cache no
 * storage do cliente (`<client>/planner/shots/<hash>.jpg`) a menos que
 * `refresh=1`. Exige permissao `planner:read` (ou `planner:write` para refresh).
 */
export async function runPlannerScreenshot(req: VercelRequest, res: VercelResponse, fetchImpl: FetchLike = fetch) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (!applyCors(req, res) || !allowMethods(req, res, ['GET'])) return
  const auth = await requireUserAuth(req, res)
  if (!auth) return
  const refresh = req.query.refresh === '1'
  const authorization = await authorizePlanner(auth, req.query.client_slug, refresh ? 'write' : 'read')
  if (!authorization.ok) return res.status(authorization.status).json({ error: authorization.error })
  const url = normalizePageUrl(req.query.url)
  if (!url) return res.status(400).json({ error: 'Informe uma URL publica http(s).' })
  const bucket = auth.serviceClient.storage.from(PLANNER_BUCKET)
  const folder = `${authorization.client.id}/planner/shots`
  const name = `${screenshotKey(url)}.jpg`
  const path = `${folder}/${name}`
  const publicUrl = (version: string) => `${bucket.getPublicUrl(path).data.publicUrl}?v=${encodeURIComponent(version)}`
  if (!refresh) {
    const { data } = await bucket.list(folder, { limit: 1, search: name })
    const existing = (data ?? []).find(file => file.name === name)
    if (existing) return res.status(200).json({ url: publicUrl(existing.updated_at || existing.created_at || '1'), cached: true, capturedAt: existing.updated_at || existing.created_at || null })
  }
  let bytes: Buffer
  try { bytes = await captureViaMicrolink(url, fetchImpl) } catch (error) {
    return res.status(502).json({ error: `Nao foi possivel capturar a pagina: ${(error as Error).message}` })
  }
  const { error } = await bucket.upload(path, bytes, { contentType: 'image/jpeg', upsert: true, cacheControl: '86400' })
  if (error) return res.status(500).json({ error: 'Falha ao guardar a miniatura.' })
  const capturedAt = new Date().toISOString()
  return res.status(200).json({ url: publicUrl(capturedAt), cached: false, capturedAt })
}
