/**
 * ============================================
 * KOMMO AUTH SERVICE — OAuth 2.0 + long-lived token
 * ============================================
 * Manages Kommo CRM integration (leads, pipelines, funnels).
 *
 * Two supported flows:
 *   1. OAuth 2.0 — user installs the Ad Flow integration in their Kommo
 *      account. Kommo redirects to our callback with `?code=X&referer=SUBDOMAIN.kommo.com`.
 *      We exchange the code via /api/kommo/oauth-callback
 *      (client_secret stays on the server).
 *      Access tokens expire in 24h; we also store the refresh token (3 months).
 *   2. Long-lived API token — user pastes a manual token + subdomain.
 *
 * Kommo OAuth quirks:
 *   - The token exchange endpoint is per-subdomain:
 *     https://{subdomain}.kommo.com/oauth2/access_token
 *   - The authorization URL uses the global kommo.com domain and requires
 *     `mode=post_message` (for popup) or omit mode for top-level redirect.
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase'

// =====================================================
// CONFIG
// =====================================================

const KOMMO_CLIENT_ID = import.meta.env.VITE_KOMMO_CLIENT_ID || ''
const KOMMO_REDIRECT_URI =
  import.meta.env.VITE_KOMMO_REDIRECT_URI ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/integrations`
    : '')

const OAUTH_CALLBACK_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/api/kommo/oauth-callback`
    : '/api/kommo/oauth-callback'

export const isKommoOAuthConfigured = Boolean(KOMMO_CLIENT_ID)

// =====================================================
// TYPES
// =====================================================

export interface KommoConfig {
  id: string
  client_id: string | null
  user_id: string
  api_token: string
  subdomain: string
  pipeline_ids: string[]
  status: 'active' | 'disconnected' | 'error'
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface KommoAccount {
  id: number
  name: string
  subdomain: string
  currency: string
  current_user_id?: number
}

export interface KommoPipeline {
  id: number
  name: string
  sort: number
  is_main?: boolean
  is_archive?: boolean
  stages?: Array<{ id: number; name: string; color?: string; sort?: number }>
}

export interface KommoTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface OAuthExchangeResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  subdomain: string
  account: KommoAccount | null
  pipelines: KommoPipeline[]
}

// =====================================================
// OAUTH FLOW
// =====================================================

interface KommoOAuthState {
  provider: 'kommo'
  clientId: string | null
  ts: number
}

export const kommoAuthService = {
  /**
   * Build Kommo's authorization URL. User approves, Kommo redirects back
   * with `?code=X&referer=SUBDOMAIN.kommo.com&state=Y`.
   */
  getAuthUrl(appClientId?: string): string {
    if (!KOMMO_CLIENT_ID) {
      throw new Error(
        'Kommo OAuth não configurado. Defina VITE_KOMMO_CLIENT_ID.',
      )
    }

    const state: KommoOAuthState = {
      provider: 'kommo',
      clientId: appClientId || null,
      ts: Date.now(),
    }

    const params = new URLSearchParams({
      client_id: KOMMO_CLIENT_ID,
      redirect_uri: KOMMO_REDIRECT_URI,
      state: btoa(JSON.stringify(state)),
      mode: 'post_message',
    })

    return `https://www.kommo.com/oauth?${params.toString()}`
  },

  decodeState(state: string | null | undefined): KommoOAuthState | null {
    if (!state) return null
    try {
      return JSON.parse(atob(state)) as KommoOAuthState
    } catch {
      return null
    }
  },

  /**
   * Exchange the authorization code (Kommo sends it along with the subdomain
   * via the `referer` query param) for tokens and pull account/pipelines.
   * Everything goes through the serverless proxy — client_secret stays safe.
   */
  async exchangeCodeForToken(input: {
    code: string
    subdomain: string
  }): Promise<OAuthExchangeResponse> {
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
        code: input.code,
        subdomain: input.subdomain,
        redirect_uri: KOMMO_REDIRECT_URI,
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
   * Refresh an expired access token via the serverless proxy.
   */
  async refreshAccessToken(input: {
    refreshToken: string
    subdomain: string
  }): Promise<KommoTokenResponse> {
    const { data: sessionData } = await supabase.auth.getSession()
    const jwt = sessionData.session?.access_token
    if (!jwt) throw new Error('Sessão Supabase ausente.')

    const response = await fetch(OAUTH_CALLBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        action: 'refresh',
        refresh_token: input.refreshToken,
        subdomain: input.subdomain,
        redirect_uri: KOMMO_REDIRECT_URI,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(
        err?.error || err?.message || `Kommo refresh falhou (${response.status}).`,
      )
    }
    return response.json()
  },

  /**
   * Verify a manually-pasted long-lived token + subdomain combo. Returns
   * the account info and the list of pipelines so the UI can confirm it
   * is talking to the right Kommo workspace.
   */
  async verifyToken(input: {
    subdomain: string
    token: string
  }): Promise<{ account: KommoAccount | null; pipelines: KommoPipeline[] }> {
    const subdomain = normalizeSubdomain(input.subdomain)
    if (!subdomain) throw new Error('Informe o subdomínio Kommo.')
    const token = input.token.trim()
    if (!token) throw new Error('Informe o token de API Kommo.')

    const base = `https://${subdomain}.kommo.com/api/v4`
    const headers = { Authorization: `Bearer ${token}` }

    const [accountRes, pipelinesRes] = await Promise.all([
      fetch(`${base}/account`, { headers }),
      fetch(`${base}/leads/pipelines`, { headers }),
    ])

    if (accountRes.status === 401) {
      throw new Error('Token inválido ou expirado.')
    }
    if (!accountRes.ok) {
      throw new Error(`Kommo API retornou ${accountRes.status} em /account.`)
    }

    const account = (await accountRes.json()) as KommoAccount | null

    let pipelines: KommoPipeline[] = []
    if (pipelinesRes.ok) {
      const p = (await pipelinesRes.json()) as {
        _embedded?: { pipelines?: KommoPipeline[] }
      }
      pipelines = p._embedded?.pipelines ?? []
    }

    return { account, pipelines }
  },
}

// =====================================================
// CONFIG CRUD
// =====================================================

export const kommoConfigsService = {
  async list(userId: string, clientId?: string | null): Promise<KommoConfig[]> {
    if (!isSupabaseConfigured) return []

    let q = supabase
      .from('kommo_configs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (clientId) q = q.eq('client_id', clientId)

    const { data, error } = await q
    if (error) throw error
    return (data || []) as KommoConfig[]
  },

  async listByClient(clientId: string): Promise<KommoConfig[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
      .from('kommo_configs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as KommoConfig[]
  },

  async save(input: {
    userId: string
    clientId?: string | null
    apiToken: string
    subdomain: string
    pipelineIds?: string[]
  }): Promise<KommoConfig> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado')

    const subdomain = normalizeSubdomain(input.subdomain)
    if (!subdomain) throw new Error('Subdomínio inválido.')

    const { data, error } = await supabase
      .from('kommo_configs')
      .upsert(
        {
          user_id: input.userId,
          client_id: input.clientId ?? null,
          api_token: input.apiToken,
          subdomain,
          pipeline_ids: input.pipelineIds ?? [],
          status: 'active',
        },
        { onConflict: 'user_id,client_id' },
      )
      .select()
      .single()

    if (error) throw error
    return data as KommoConfig
  },

  async disconnect(id: string): Promise<void> {
    if (!isSupabaseConfigured) return
    const { error } = await supabase
      .from('kommo_configs')
      .update({ status: 'disconnected', api_token: '' })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) return
    const { error } = await supabase.from('kommo_configs').delete().eq('id', id)
    if (error) throw error
  },
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Strip protocol / trailing `.kommo.com` and whitespace so users can paste
 * either `foo`, `foo.kommo.com`, or `https://foo.kommo.com` and we store
 * the canonical form (`foo`).
 */
export function normalizeSubdomain(input: string): string {
  let s = input.trim().toLowerCase()
  s = s.replace(/^https?:\/\//, '')
  s = s.replace(/\.kommo\.com\/?.*$/, '')
  s = s.replace(/\/$/, '')
  return s
}
