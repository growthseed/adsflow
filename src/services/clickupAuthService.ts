/**
 * ============================================
 * CLICKUP AUTH SERVICE — OAuth 2.0 + API key fallback
 * ============================================
 * Manages ClickUp integration for Project Reports and Task sync.
 *
 * Two supported flows:
 *   1. OAuth 2.0 — user authorizes Ad Flow on ClickUp, we exchange code via
 *      /api/clickup/oauth-callback (client_secret stays on the server).
 *   2. Personal API token — user pastes their ClickUp API key from
 *      Settings → Apps. Stored the same way; no refresh needed.
 *
 * ClickUp OAuth quirks:
 *   - Tokens do NOT expire. No refresh_token.
 *   - Authorization URL: https://app.clickup.com/api (not /oauth/authorize).
 *   - Token exchange:   https://api.clickup.com/api/v2/oauth/token
 *   - Auth header on API calls is the raw token (no "Bearer " prefix).
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase'

// =====================================================
// CONFIG
// =====================================================

const CLICKUP_CLIENT_ID = import.meta.env.VITE_CLICKUP_CLIENT_ID || ''
const CLICKUP_REDIRECT_URI =
  import.meta.env.VITE_CLICKUP_REDIRECT_URI ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/integrations`
    : '')

const OAUTH_CALLBACK_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/api/clickup/oauth-callback`
    : '/api/clickup/oauth-callback'

export const isClickUpOAuthConfigured = Boolean(CLICKUP_CLIENT_ID)

// =====================================================
// TYPES
// =====================================================

export interface ClickUpConfig {
  id: string
  client_id: string | null
  user_id: string
  api_token: string
  team_id: string
  team_name: string
  status: 'active' | 'disconnected' | 'error'
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface ClickUpTeam {
  id: string
  name: string
  color?: string
  avatar?: string | null
  members?: number
}

export interface ClickUpUser {
  id: number
  username: string
  email: string
  color?: string
  profilePicture?: string | null
}

interface OAuthExchangeResponse {
  access_token: string
  teams: ClickUpTeam[]
  user: ClickUpUser | null
}

// =====================================================
// OAUTH FLOW
// =====================================================

interface ClickUpOAuthState {
  provider: 'clickup'
  clientId: string | null
  ts: number
}

export const clickupAuthService = {
  /**
   * Build ClickUp's authorization URL. User is redirected here, signs in on
   * ClickUp, approves, and is redirected back to `redirect_uri` with `?code=...`.
   */
  getAuthUrl(appClientId?: string): string {
    if (!CLICKUP_CLIENT_ID) {
      throw new Error(
        'ClickUp OAuth não configurado. Defina VITE_CLICKUP_CLIENT_ID.',
      )
    }

    const state: ClickUpOAuthState = {
      provider: 'clickup',
      clientId: appClientId || null,
      ts: Date.now(),
    }

    const params = new URLSearchParams({
      client_id: CLICKUP_CLIENT_ID,
      redirect_uri: CLICKUP_REDIRECT_URI,
      state: btoa(JSON.stringify(state)),
    })

    return `https://app.clickup.com/api?${params.toString()}`
  },

  /**
   * Decode the OAuth state param we sent on getAuthUrl. Tolerant to
   * malformed payloads (returns null).
   */
  decodeState(state: string | null | undefined): ClickUpOAuthState | null {
    if (!state) return null
    try {
      return JSON.parse(atob(state)) as ClickUpOAuthState
    } catch {
      return null
    }
  },

  /**
   * Exchange an authorization code for an access token and fetch the user's
   * teams/workspaces. The token is never exposed — our serverless proxy holds
   * the CLICKUP_CLIENT_SECRET.
   */
  async exchangeCodeForToken(code: string): Promise<OAuthExchangeResponse> {
    const { data: sessionData } = await supabase.auth.getSession()
    const jwt = sessionData.session?.access_token
    if (!jwt) {
      throw new Error('Sessão Supabase ausente. Faça login novamente.')
    }

    const response = await fetch(OAUTH_CALLBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        action: 'exchange',
        code,
        redirect_uri: CLICKUP_REDIRECT_URI,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(
        err?.error ||
          err?.message ||
          `Falha ao trocar code por token (${response.status}).`,
      )
    }

    return response.json()
  },

  /**
   * Verify a manually-pasted ClickUp personal API token. Calls /team which
   * returns the workspaces the token has access to. Throws on invalid token.
   */
  async verifyApiToken(apiToken: string): Promise<{
    teams: ClickUpTeam[]
    user: ClickUpUser | null
  }> {
    const cleanToken = apiToken.trim()
    if (!cleanToken) throw new Error('Informe um token de API válido.')

    const [teamsRes, userRes] = await Promise.all([
      fetch('https://api.clickup.com/api/v2/team', {
        headers: { Authorization: cleanToken },
      }),
      fetch('https://api.clickup.com/api/v2/user', {
        headers: { Authorization: cleanToken },
      }),
    ])

    if (teamsRes.status === 401) {
      throw new Error('Token inválido ou revogado.')
    }
    if (!teamsRes.ok) {
      throw new Error(`ClickUp API retornou ${teamsRes.status}.`)
    }

    const teamsJson = (await teamsRes.json()) as {
      teams?: Array<{
        id: string
        name: string
        color?: string
        avatar?: string | null
        members?: Array<unknown>
      }>
    }

    const userJson = userRes.ok
      ? ((await userRes.json()) as { user?: ClickUpUser })
      : { user: null }

    const teams = (teamsJson.teams || []).map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      avatar: t.avatar ?? null,
      members: Array.isArray(t.members) ? t.members.length : undefined,
    }))

    return { teams, user: userJson.user ?? null }
  },
}

// =====================================================
// CONFIG CRUD
// =====================================================

export const clickupConfigsService = {
  /**
   * List configs for a user (optionally scoped to a client).
   */
  async list(userId: string, clientId?: string | null): Promise<ClickUpConfig[]> {
    if (!isSupabaseConfigured) return []

    let query = supabase
      .from('clickup_configs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (clientId) query = query.eq('client_id', clientId)

    const { data, error } = await query
    if (error) throw error
    return (data || []) as ClickUpConfig[]
  },

  async listByClient(clientId: string): Promise<ClickUpConfig[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
      .from('clickup_configs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as ClickUpConfig[]
  },

  /**
   * Insert or update a config. Uniqueness is (user_id, client_id) in the
   * migration, so we upsert on that conflict.
   */
  async save(input: {
    userId: string
    clientId?: string | null
    apiToken: string
    teamId: string
    teamName: string
  }): Promise<ClickUpConfig> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado')

    const { data, error } = await supabase
      .from('clickup_configs')
      .upsert(
        {
          user_id: input.userId,
          client_id: input.clientId ?? null,
          api_token: input.apiToken,
          team_id: input.teamId,
          team_name: input.teamName,
          status: 'active',
        },
        { onConflict: 'user_id,client_id' },
      )
      .select()
      .single()

    if (error) throw error
    return data as ClickUpConfig
  },

  async disconnect(id: string): Promise<void> {
    if (!isSupabaseConfigured) return
    const { error } = await supabase
      .from('clickup_configs')
      .update({ status: 'disconnected', api_token: '' })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) return
    const { error } = await supabase
      .from('clickup_configs')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
