import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import { allowMethods, applyCors, requireUserAuth, type AuthContext } from '../../../api/_lib/security.js'

export const PLANNER_BUCKET = 'client-logos'
const MAX_BYTES = 2 * 1024 * 1024

export function decodeLogo(value: unknown) {
  if (typeof value !== 'string' || value.length > 2800000) throw new Error('Imagem excede 2 MB.')
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) throw new Error('Use PNG, JPEG ou WebP.')
  const bytes = Buffer.from(match[2], 'base64')
  const signature = match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : match[1] === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  if (!signature || bytes.length < 12 || bytes.length > MAX_BYTES) throw new Error('Imagem invalida ou maior que 2 MB.')
  return { bytes, ext: match[1] === 'jpeg' ? 'jpg' : match[1], contentType: `image/${match[1]}` }
}

export interface PlannerClient { id: string; name: string; logo_url: string | null }
export type PlannerAuthorization = { ok: true; client: PlannerClient } | { ok: false; status: number; error: string }

/**
 * Autoriza o usuario autenticado a ler/escrever recursos do Planner de um
 * cliente: precisa estar ativo, o cliente precisa existir e estar ativo, e —
 * salvo admins da agencia — o usuario precisa ser membro do cliente com a
 * permissao `planner:<action>` (override por cliente vence o template do papel).
 */
export async function authorizePlanner(auth: AuthContext, slug: unknown, action: 'read' | 'write'): Promise<PlannerAuthorization> {
  if (typeof slug !== 'string' || !slug) return { ok: false, status: 400, error: 'Cliente obrigatorio.' }
  const { data: profile } = await auth.serviceClient.from('users').select('is_active').eq('id', auth.user.id).maybeSingle()
  if (profile?.is_active !== true) return { ok: false, status: 403, error: 'Acesso inativo.' }
  const { data: client } = await auth.serviceClient.from('clients').select('id, name, logo_url').eq('slug', slug).eq('status', 'active').maybeSingle()
  if (!client) return { ok: false, status: 404, error: 'Cliente nao encontrado.' }
  const staff = auth.globalRole === 'admin' || auth.globalRole === 'super_admin'
  if (staff) return { ok: true, client }
  const { data: member } = await auth.serviceClient.from('client_members').select('role').eq('user_id', auth.user.id).eq('client_id', client.id).maybeSingle()
  if (!member) return { ok: false, status: 403, error: 'Sem permissao para esta biblioteca.' }
  const { data: permission, error: permissionError } = await auth.serviceClient.from('permissions').select('id').eq('module', 'planner').eq('action', action).maybeSingle()
  if (permissionError || !permission) return { ok: false, status: 403, error: 'Permissao indisponivel.' }
  const { data: override, error: overrideError } = await auth.serviceClient.from('client_role_overrides').select('is_granted').eq('client_id', client.id).eq('role_name', member.role).eq('permission_id', permission.id).maybeSingle()
  if (overrideError) return { ok: false, status: 403, error: 'Permissao indisponivel.' }
  let granted = override?.is_granted === true
  if (!override) {
    const { data: template, error: templateError } = await auth.serviceClient.from('role_permissions').select('permission_id').eq('role_name', member.role).eq('permission_id', permission.id).maybeSingle()
    granted = !templateError && !!template
  }
  if (!granted) return { ok: false, status: 403, error: 'Sem permissao para esta biblioteca.' }
  return { ok: true, client }
}

export async function runPlannerAssets(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (!applyCors(req, res) || !allowMethods(req, res, ['GET', 'POST'])) return
  const auth = await requireUserAuth(req, res)
  if (!auth) return
  const authorization = await authorizePlanner(auth, req.query.client_slug, req.method === 'POST' ? 'write' : 'read')
  if (!authorization.ok) return res.status(authorization.status).json({ error: authorization.error })
  const { client } = authorization
  const bucket = auth.serviceClient.storage.from(PLANNER_BUCKET)
  const prefix = `${client.id}/planner`
  const publicUrl = (name: string) => bucket.getPublicUrl(`${prefix}/${name}`).data.publicUrl
  if (req.method === 'POST') {
    let image: ReturnType<typeof decodeLogo>
    try { image = decodeLogo(req.body?.image) } catch (error) { return res.status(400).json({ error: (error as Error).message }) }
    const label = String(req.body?.name || 'Logo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9 -]/g, '').trim().slice(0, 60) || 'Logo'
    const name = `${randomUUID()}_${label}.${image.ext}`
    const { error } = await bucket.upload(`${prefix}/${name}`, image.bytes, { contentType: image.contentType, upsert: false })
    if (error) return res.status(500).json({ error: 'Falha ao salvar imagem na biblioteca.' })
    return res.status(201).json({ asset: { id: name, name: label, url: publicUrl(name) } })
  }
  const { data, error } = await bucket.list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) return res.status(500).json({ error: 'Falha ao carregar biblioteca.' })
  const assets = (data ?? []).filter(file => file.id).map(file => ({ id: file.name, name: file.name.slice(37).replace(/\.[^.]+$/, ''), url: publicUrl(file.name) }))
  if (client.logo_url) assets.unshift({ id: 'client-logo', name: client.name, url: client.logo_url })
  return res.status(200).json({ assets })
}
