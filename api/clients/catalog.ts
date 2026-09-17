import type { VercelRequest, VercelResponse } from '@vercel/node'
import { allowMethods, applyCors, requireUserAuth } from '../_lib/security.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (!applyCors(req, res) || !allowMethods(req, res, ['GET'])) return
  const auth = await requireUserAuth(req, res)
  if (!auth) return
  if (auth.globalRole !== 'admin' && auth.globalRole !== 'super_admin') {
    return res.status(403).json({ error: 'Agency administrator required' })
  }
  const { data: profile, error: profileError } = await auth.serviceClient
    .from('users').select('is_active').eq('id', auth.user.id).maybeSingle()
  if (profileError || profile?.is_active !== true) {
    return res.status(403).json({ error: 'Active administrator required' })
  }
  // An explicit staff-only read, not an RLS change or a browser service key.
  const { data: clients, error } = await auth.serviceClient.from('clients')
    .select('id, name, slug, logo_url, industry, website, phone:contact_phone, status, created_at, updated_at, service_tier, active_scope, portal_token')
    .eq('status', 'active').order('name')
  if (error) return res.status(500).json({ error: 'Unable to load client catalogue' })
  if (!clients?.length) return res.status(200).json({ clients: [] })
  const { data: members, error: membersError } = await auth.serviceClient.from('client_members')
    .select('client_id, user_id, role').in('client_id', clients.map(client => client.id))
  if (membersError) return res.status(500).json({ error: 'Unable to load client memberships' })
  return res.status(200).json({ clients: clients.map(client => ({
    ...client,
    plan: null,
    member_count: (members ?? []).filter(member => member.client_id === client.id).length,
    my_role: members?.find(member => member.client_id === client.id && member.user_id === auth.user.id)?.role ?? 'admin',
  })) })
}
