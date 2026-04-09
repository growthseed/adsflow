/**
 * CLIENTS & TEAM SERVICE
 * Efeito Digital - Ads Flow
 *
 * Service layer para gestão de clientes e membros da equipe.
 * CRUD de clientes, membros, convites e perfil do usuário.
 */

import supabase from '@/lib/supabase'
import type { ClientRole } from '@/contexts/AuthContext'

// =====================================================
// TYPES
// =====================================================

export interface Client {
  id: string
  name: string
  slug: string
  logo_url: string | null
  industry: string | null
  website: string | null
  phone: string | null
  status: string
  plan: string | null
  created_at: string
  updated_at: string
}

export interface ClientMember {
  id: string
  client_id: string
  user_id: string
  role: ClientRole
  invited_by: string | null
  joined_at: string
  user?: {
    id: string
    email: string
    name: string
    avatar_url: string | null
    is_active: boolean
  }
}

export interface TeamInvite {
  id: string
  client_id: string
  email: string
  role: ClientRole
  invited_by: string
  status: string
  expires_at: string
  created_at: string
  inviter?: {
    name: string
    email: string
  }
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  phone: string | null
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

// =====================================================
// CLIENTS SERVICE
// =====================================================

export const clientsService = {
  /**
   * Lista clientes do usuário (via client_members)
   */
  async list(userId: string): Promise<(Client & { member_count: number; my_role: ClientRole })[]> {
    // Buscar IDs dos clientes onde o usuário é membro
    const { data: memberships, error: memError } = await supabase
      .from('client_members')
      .select('client_id, role')
      .eq('user_id', userId)

    if (memError) throw memError
    if (!memberships || memberships.length === 0) return []

    const clientIds = memberships.map((m) => m.client_id)
    const roleMap = new Map(memberships.map((m) => [m.client_id, m.role as ClientRole]))

    // Buscar dados dos clientes
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .in('id', clientIds)
      .order('name')

    if (clientError) throw clientError

    // Buscar contagem de membros por cliente
    const { data: counts, error: countError } = await supabase
      .from('client_members')
      .select('client_id')
      .in('client_id', clientIds)

    if (countError) throw countError

    const countMap = new Map<string, number>()
    for (const c of counts || []) {
      countMap.set(c.client_id, (countMap.get(c.client_id) || 0) + 1)
    }

    return (clients || []).map((c) => ({
      ...c,
      member_count: countMap.get(c.id) || 0,
      my_role: roleMap.get(c.id) || 'viewer',
    })) as (Client & { member_count: number; my_role: ClientRole })[]
  },

  /**
   * Busca um cliente por ID
   */
  async get(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Client
  },

  /**
   * Cria um novo cliente e adiciona o criador como owner
   */
  async create(
    userId: string,
    client: {
      name: string
      slug?: string
      industry?: string
      website?: string
      phone?: string
      logo_url?: string
    }
  ): Promise<Client> {
    const slug = client.slug || client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        slug,
        industry: client.industry || null,
        website: client.website || null,
        phone: client.phone || null,
        logo_url: client.logo_url || null,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    // Adicionar criador como owner
    const { error: memberError } = await supabase
      .from('client_members')
      .insert({
        client_id: data.id,
        user_id: userId,
        role: 'owner',
      })

    if (memberError) {
      // Rollback: delete o client criado
      await supabase.from('clients').delete().eq('id', data.id)
      throw memberError
    }

    return data as Client
  },

  /**
   * Atualiza um cliente
   */
  async update(
    id: string,
    updates: Partial<Pick<Client, 'name' | 'slug' | 'industry' | 'website' | 'phone' | 'logo_url' | 'status'>>
  ): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Client
  },

  /**
   * Deleta um cliente (cascade deleta membros)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Conta ad_accounts vinculadas ao cliente
   */
  async getAdAccountCount(clientId: string): Promise<number> {
    const { count, error } = await supabase
      .from('ad_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (error) return 0
    return count || 0
  },
}

// =====================================================
// MEMBERS SERVICE
// =====================================================

export const membersService = {
  /**
   * Lista membros de um cliente
   */
  async list(clientId: string): Promise<ClientMember[]> {
    const { data, error } = await supabase
      .from('client_members')
      .select(`
        id,
        client_id,
        user_id,
        role,
        invited_by,
        joined_at:created_at,
        user:users!client_members_user_id_fkey (
          id,
          email,
          name,
          avatar_url,
          is_active
        )
      `)
      .eq('client_id', clientId)
      .order('created_at')

    if (error) throw error

    // Supabase returns the `user` join as an array when the FK target is
    // ambiguous. Normalize to a single object before casting.
    type RawMember = Omit<ClientMember, 'user'> & {
      user: ClientMember['user'] | ClientMember['user'][]
    }
    return (data || []).map((m: RawMember) => ({
      ...m,
      user: Array.isArray(m.user) ? m.user[0] : m.user,
    })) as ClientMember[]
  },

  /**
   * Atualiza role de um membro
   */
  async updateRole(memberId: string, role: ClientRole): Promise<void> {
    const { error } = await supabase
      .from('client_members')
      .update({ role })
      .eq('id', memberId)

    if (error) throw error
  },

  /**
   * Remove um membro do cliente
   */
  async remove(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('client_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error
  },

  /**
   * Adiciona um membro diretamente (por user_id)
   */
  async add(clientId: string, userId: string, role: ClientRole, invitedBy: string): Promise<void> {
    const { error } = await supabase
      .from('client_members')
      .insert({
        client_id: clientId,
        user_id: userId,
        role,
        invited_by: invitedBy,
      })

    if (error) throw error
  },
}

// =====================================================
// INVITES SERVICE
// =====================================================

export const invitesService = {
  /**
   * Lista convites pendentes de um cliente
   */
  async list(clientId: string): Promise<TeamInvite[]> {
    const { data, error } = await supabase
      .from('team_invites')
      .select(`
        id,
        client_id,
        email,
        role,
        invited_by,
        status,
        expires_at,
        created_at
      `)
      .eq('client_id', clientId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as TeamInvite[]
  },

  /**
   * Cria um convite para email
   */
  async create(invite: {
    client_id: string
    email: string
    role: ClientRole
    invited_by: string
  }): Promise<TeamInvite> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 dias

    const { data, error } = await supabase
      .from('team_invites')
      .insert({
        ...invite,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data as TeamInvite
  },

  /**
   * Cancela um convite
   */
  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('team_invites')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Aceita um convite (busca por email do user logado)
   */
  async accept(inviteId: string, userId: string): Promise<void> {
    // Buscar convite
    const { data: invite, error: fetchError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !invite) throw new Error('Convite não encontrado ou já expirado')

    // Verificar expiração
    if (new Date(invite.expires_at) < new Date()) {
      await supabase.from('team_invites').update({ status: 'expired' }).eq('id', inviteId)
      throw new Error('Convite expirado')
    }

    // Adicionar como membro
    await membersService.add(invite.client_id, userId, invite.role, invite.invited_by)

    // Marcar convite como aceito
    await supabase.from('team_invites').update({ status: 'accepted' }).eq('id', inviteId)
  },
}

// =====================================================
// PROFILE SERVICE
// =====================================================

export const profileService = {
  /**
   * Busca perfil do usuário
   */
  async get(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) return null
    return data as UserProfile
  },

  /**
   * Atualiza perfil do usuário
   */
  async update(
    userId: string,
    updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'avatar_url'>>
  ): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as UserProfile
  },

  /**
   * Altera senha do usuário
   */
  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  /**
   * Altera email do usuário
   */
  async changeEmail(newEmail: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) throw error
  },
}
