import supabase from '@/lib/supabase'
import type { Client } from './clientsService'
import type { ClientRole } from '@/contexts/AuthContext'
import type { ClientServiceTier } from '@/types/metrics'

export interface AgencyCatalogClient extends Client {
  service_tier: ClientServiceTier | null
  active_scope: string | null
  portal_token: string | null
  member_count: number
  my_role: ClientRole
}

export async function fetchAgencyCatalog(): Promise<AgencyCatalogClient[]> {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new Error('Sessao indisponivel')
  const response = await fetch('/api/integrations?op=agency-catalog', {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`Falha ao carregar catalogo (${response.status})`)
  const body = await response.json() as { clients: AgencyCatalogClient[] }
  return body.clients
}
