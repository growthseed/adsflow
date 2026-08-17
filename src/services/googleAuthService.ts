/**
 * ============================================
 * GOOGLE AUTH SERVICE — OAuth 2.0
 * ============================================
 * Manages Google OAuth flow for Google Ads, GA4, Search Console.
 * Token exchange and refresh go through N8N proxy (client_secret never in frontend).
 *
 * Scopes:
 * - Google Ads: https://www.googleapis.com/auth/adwords
 * - GA4: https://www.googleapis.com/auth/analytics.readonly
 * - Search Console: https://www.googleapis.com/auth/webmasters.readonly
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase'

// =====================================================
// CONFIG
// =====================================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`
const N8N_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://ia-kommo-n8n.xl78rn.easypanel.host/webhook'

/** Vercel serverless proxy for token operations */
const VERCEL_API_URL = `${window.location.origin}/api/google-ads`
const USE_DIRECT_API = import.meta.env.VITE_GOOGLE_ADS_DIRECT !== 'false'

// =====================================================
// TYPES
// =====================================================

/** Retorno sanitizado do connect() — sem nenhuma credencial. */
export interface GoogleConnectResult {
  integrations: Array<{
    id: string
    provider: string
    external_account_id: string
    external_account_name: string | null
    status: string
    has_access_token: boolean
    has_refresh_token: boolean
  }>
  google_email: string
  providers: string[]
}

export type GooglePlatform = 'google_ads' | 'ga4' | 'search_console' | 'youtube' | 'gmb'

export interface GoogleAccount {
  id: string
  client_id: string | null
  user_id: string
  platform: GooglePlatform
  account_id: string
  account_name: string
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  scopes: string[]
  status: 'active' | 'paused' | 'disconnected' | 'error'
  last_sync_at: string | null
  sync_error: string | null
  created_at: string
  updated_at: string
}

export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

// =====================================================
// SCOPE DEFINITIONS
// =====================================================

export const GOOGLE_SCOPES: Record<GooglePlatform, string[]> = {
  google_ads: [
    'https://www.googleapis.com/auth/adwords',
  ],
  ga4: [
    'https://www.googleapis.com/auth/analytics.readonly',
  ],
  search_console: [
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
  youtube: [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
  ],
  gmb: [
    'https://www.googleapis.com/auth/business.manage',
  ],
}

/**
 * Get all scopes for the given platforms
 */
export function getScopesForPlatforms(platforms: GooglePlatform[]): string[] {
  const scopes = new Set<string>([
    'openid',
    'email',
    'profile',
  ])
  for (const platform of platforms) {
    for (const scope of GOOGLE_SCOPES[platform]) {
      scopes.add(scope)
    }
  }
  return Array.from(scopes)
}

// =====================================================
// OAUTH FLOW
// =====================================================

export const googleAuthService = {
  /**
   * Build the Google OAuth2 authorization URL.
   * Redirects user to Google consent screen.
   */
  getAuthUrl(
    platforms: GooglePlatform[],
    clientId?: string,
    clientSlug?: string,
  ): string {
    const scopes = getScopesForPlatforms(platforms)

    // clientSlug e o que o servidor usa para checar membership e gravar a
    // integracao. clientId continua no state so por compatibilidade com
    // links de consentimento ja emitidos.
    const state = JSON.stringify({
      platforms,
      clientId: clientId || null,
      clientSlug: clientSlug || null,
      ts: Date.now(),
    })

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',       // get refresh_token
      prompt: 'consent',            // force consent to always get refresh_token
      state: btoa(state),
      include_granted_scopes: 'true',
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  },

  /**
   * Entrega o authorization code ao servidor, que troca por tokens, grava em
   * client_integrations e devolve so o resultado sanitizado.
   *
   * O token NAO volta para o browser — era exatamente o achado da auditoria
   * ("access_token trafegando pelo frontend") que ficou aberto ate agora.
   */
  async connect(
    code: string,
    clientSlug: string,
    platforms: GooglePlatform[],
  ): Promise<GoogleConnectResult> {
    const { data: sessionData } = await supabase.auth.getSession()
    const jwt = sessionData.session?.access_token
    if (!jwt) {
      throw new Error('Sessão expirada — faça login novamente antes de conectar o Google.')
    }

    const response = await fetch(VERCEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        action: 'exchange',
        code,
        redirect_uri: GOOGLE_REDIRECT_URI,
        client_slug: clientSlug,
        platforms,
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.error || `Falha ao conectar Google: ${response.statusText}`)
    }
    return payload as GoogleConnectResult
  },

  /**
   * Fixa qual property/site/customer o cliente usa, depois que a UI listou
   * as opcoes disponiveis.
   */
  async setAccount(
    clientSlug: string,
    provider: string,
    accountId: string,
    accountName?: string,
  ): Promise<void> {
    const { data: sessionData } = await supabase.auth.getSession()
    const jwt = sessionData.session?.access_token
    if (!jwt) throw new Error('Sessão expirada.')

    const response = await fetch(VERCEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        action: 'set-account',
        client_slug: clientSlug,
        provider,
        account_id: accountId,
        account_name: accountName,
      }),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || 'Falha ao definir a conta.')
    }
  },

  /**
   * Refresh an expired access token.
   * Uses Vercel /api/google-ads proxy (preferred) with N8N fallback.
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    // Try Vercel proxy first. The hardened proxy requires a Supabase JWT.
    if (USE_DIRECT_API) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const jwt = sessionData.session?.access_token
        if (!jwt) throw new Error('no-supabase-session')

        const response = await fetch(VERCEL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            action: 'refresh',
            refresh_token: refreshToken,
          }),
        })
        if (response.ok) return response.json()
      } catch {
        console.warn('[googleAuth] Direct API unavailable for refresh, falling back to N8N')
      }
    }

    // Fallback: N8N
    const response = await fetch(`${N8N_BASE_URL}/adsflow/google-token-refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Google token refresh failed: ${error.message || error.error || response.statusText}`)
    }

    return response.json()
  },

  /**
   * Ensure we have a valid access token. Refreshes if expired.
   */
  async getValidToken(googleAccountId: string): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')

    const { data: account } = await supabase
      .from('google_accounts')
      .select('access_token, refresh_token, token_expires_at')
      .eq('id', googleAccountId)
      .single()

    if (!account?.access_token) throw new Error('No access token found')

    // Check if token is still valid (with 5 min buffer)
    const expiresAt = account.token_expires_at
      ? new Date(account.token_expires_at).getTime()
      : 0
    const fiveMinFromNow = Date.now() + 5 * 60 * 1000

    if (expiresAt > fiveMinFromNow) {
      return account.access_token
    }

    // Refresh token
    if (!account.refresh_token) {
      throw new Error('No refresh token available. Re-authorize the account.')
    }

    try {
      const tokens = await this.refreshAccessToken(account.refresh_token)
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

      await supabase
        .from('google_accounts')
        .update({
          access_token: tokens.access_token,
          token_expires_at: newExpiresAt,
          sync_error: null,
        })
        .eq('id', googleAccountId)

      return tokens.access_token
    } catch (err) {
      await supabase
        .from('google_accounts')
        .update({
          sync_error: 'Token refresh failed',
          status: 'error',
        })
        .eq('id', googleAccountId)
      throw err
    }
  },
}

// =====================================================
// ACCOUNT MANAGEMENT (CRUD)
// =====================================================

export const googleAccountsService = {
  /**
   * List all google_accounts for a client
   */
  async getConnectedAccounts(clientId: string): Promise<GoogleAccount[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
      .from('google_accounts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as GoogleAccount[]
  },

  /**
   * List accounts by user
   */
  async listByUser(userId: string): Promise<GoogleAccount[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
      .from('google_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as GoogleAccount[]
  },

  /**
   * List accounts by platform
   */
  async listByPlatform(userId: string, platform: GooglePlatform): Promise<GoogleAccount[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
      .from('google_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as GoogleAccount[]
  },

  /**
   * Connect a new Google account
   */
  async connectAccount(
    userId: string,
    clientId: string | null,
    platform: GooglePlatform,
    accountId: string,
    accountName: string,
    tokens: GoogleTokenResponse,
  ): Promise<GoogleAccount> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    const scopes = tokens.scope ? tokens.scope.split(' ') : []

    const { data, error } = await supabase
      .from('google_accounts')
      .upsert({
        user_id: userId,
        client_id: clientId,
        platform,
        account_id: accountId,
        account_name: accountName,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: expiresAt,
        scopes,
        status: 'active',
        sync_error: null,
      }, {
        onConflict: 'user_id,platform,account_id',
      })
      .select()
      .single()

    if (error) throw error
    return data as GoogleAccount
  },

  /**
   * Disconnect (soft delete) — clears tokens, sets status
   */
  async disconnectAccount(id: string): Promise<void> {
    if (!isSupabaseConfigured) return

    const { error } = await supabase
      .from('google_accounts')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
        sync_error: null,
      })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Delete permanently (cascades to all data)
   */
  async deleteAccount(id: string): Promise<void> {
    if (!isSupabaseConfigured) return

    const { error } = await supabase
      .from('google_accounts')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Update account metadata
   */
  async updateAccount(id: string, updates: Partial<GoogleAccount>): Promise<void> {
    if (!isSupabaseConfigured) return

    const { error } = await supabase
      .from('google_accounts')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Persist the set of sub-assets (e.g. customer accounts under an MCC)
   * the user picked for a connected google_accounts row. Replaces the
   * previous selection for that account.
   */
  async saveSelectedAssets(
    accountId: string,
    assets: { account_id: string; account_name: string }[],
  ): Promise<void> {
    if (!isSupabaseConfigured) return

    await supabase.from('google_selected_assets').delete().eq('account_id', accountId)

    if (assets.length === 0) return

    const { error } = await supabase.from('google_selected_assets').insert(
      assets.map((a) => ({
        account_id: accountId,
        asset_account_id: a.account_id,
        asset_account_name: a.account_name,
      })),
    )

    if (error) throw error
  },
}
