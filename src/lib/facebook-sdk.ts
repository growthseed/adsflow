/**
 * ============================================
 * FACEBOOK SDK - OAuth & Ad Accounts
 * ============================================
 * Data: 2026-02-17
 * Carrega o Facebook JS SDK e gerencia OAuth
 * para conectar contas do Meta Ads.
 *
 * Flow: FB.login popup → short-lived token →
 * fetch ad accounts → user picks → save to Supabase
 */

// =====================================================
// TYPES
// =====================================================

declare global {
  interface Window {
    fbAsyncInit: () => void
    FB: {
      init: (params: {
        appId: string
        cookie: boolean
        xfbml: boolean
        version: string
      }) => void
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options?: { scope: string; return_scopes?: boolean }
      ) => void
      logout: (callback: () => void) => void
      getLoginStatus: (
        callback: (response: FacebookLoginResponse) => void
      ) => void
      api: (
        path: string,
        params: Record<string, unknown> | ((response: unknown) => void),
        callback?: (response: unknown) => void
      ) => void
    }
  }
}

export interface FacebookAuthResponse {
  accessToken: string
  expiresIn: number
  signedRequest: string
  userID: string
  grantedScopes?: string
}

export interface FacebookLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse: FacebookAuthResponse | null
}

export interface MetaAdAccount {
  id: string // "act_123456789"
  account_id: string // "123456789"
  name: string
  account_status: number // 1=ACTIVE, 2=DISABLED, etc.
  currency: string
  timezone_name: string
  business_name?: string
  amount_spent?: string
}

export interface MetaPage {
  id: string
  name: string
  category: string
  access_token: string // Page-specific token
  fan_count?: number
  picture?: { data: { url: string } }
  instagram_business_account?: { id: string }
}

export interface MetaInstagramAccount {
  id: string
  name: string
  username: string
  profile_picture_url?: string
  followers_count?: number
  media_count?: number
  biography?: string
}

/** Todos os assets que o usuário tem acesso após OAuth */
export interface MetaConnectedAssets {
  adAccounts: MetaAdAccount[]
  pages: MetaPage[]
  instagramAccounts: MetaInstagramAccount[]
  fbUser: { id: string; name: string; email?: string }
}

// =====================================================
// CONFIG
// =====================================================

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || ''
const FB_API_VERSION = 'v22.0'

const META_ADS_SCOPES = [
  'ads_management',
  'ads_read',
  'read_insights',
  'business_management',
  'pages_show_list',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_insights',
].join(',')

// =====================================================
// SDK LOADER
// =====================================================

let sdkReady: Promise<void> | null = null

/**
 * Carrega o Facebook JS SDK de forma assíncrona.
 * Retorna Promise que resolve quando FB.init() completa.
 */
export function loadFacebookSDK(): Promise<void> {
  if (sdkReady) return sdkReady

  sdkReady = new Promise<void>((resolve, reject) => {
    if (!FB_APP_ID) {
      reject(new Error('VITE_FACEBOOK_APP_ID não configurado. Adicione no .env'))
      return
    }

    // Se SDK já carregou (hot reload)
    if (window.FB) {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: FB_API_VERSION,
      })
      resolve()
      return
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: FB_API_VERSION,
      })
      resolve()
    }

    // Inject script tag
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/pt_BR/sdk.js'
      script.async = true
      script.defer = true
      script.onerror = () => reject(new Error('Falha ao carregar Facebook SDK'))
      document.body.appendChild(script)
    }
  })

  return sdkReady
}

/**
 * Verifica se o Facebook App ID está configurado
 */
export function isFacebookConfigured(): boolean {
  return Boolean(FB_APP_ID)
}

// =====================================================
// AUTH
// =====================================================

/**
 * Abre popup do Facebook OAuth pedindo permissões de Ads.
 * DEVE ser chamado de um click handler direto do usuário.
 */
export function facebookLogin(): Promise<FacebookLoginResponse> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK não carregado'))
      return
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          resolve(response)
        } else {
          reject(new Error('Login cancelado pelo usuário.'))
        }
      },
      {
        scope: META_ADS_SCOPES,
        return_scopes: true,
      }
    )
  })
}

/**
 * Verifica se o usuário já está logado no Facebook.
 */
export function getFacebookLoginStatus(): Promise<FacebookLoginResponse> {
  return new Promise((resolve) => {
    if (!window.FB) {
      resolve({ status: 'unknown', authResponse: null })
      return
    }
    window.FB.getLoginStatus((response) => resolve(response))
  })
}

/**
 * Faz logout do Facebook.
 */
export function facebookLogout(): Promise<void> {
  return new Promise((resolve) => {
    if (!window.FB) {
      resolve()
      return
    }
    window.FB.logout(() => resolve())
  })
}

// =====================================================
// GRAPH API HELPERS
// =====================================================

/**
 * Chama a Graph API do Facebook.
 */
function fbApi<T = unknown>(
  path: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK não carregado'))
      return
    }
    window.FB.api(path, params, (response: unknown) => {
      const r = response as { error?: { message?: string } } | null
      if (r && !r.error) {
        resolve(response as T)
      } else {
        reject(
          new Error(
            r?.error?.message || 'Erro desconhecido na Graph API'
          )
        )
      }
    })
  })
}

/**
 * Busca todas as contas de anúncio que o usuário tem acesso.
 * Retorna lista paginada.
 */
export async function fetchMetaAdAccounts(): Promise<MetaAdAccount[]> {
  const allAccounts: MetaAdAccount[] = []
  let nextUrl: string | null = '/me/adaccounts'
  const fields =
    'id,account_id,name,account_status,currency,timezone_name,business_name,amount_spent'

  while (nextUrl) {
    const response: { data: MetaAdAccount[]; paging?: { next?: string; cursors?: { after?: string } } } = await fbApi<{
      data: MetaAdAccount[]
      paging?: { next?: string; cursors?: { after?: string } }
    }>(nextUrl, nextUrl === '/me/adaccounts' ? { fields, limit: 100 } : {})

    allAccounts.push(...response.data)

    // Pagination via cursors
    if (response.paging?.cursors?.after && response.data.length === 100) {
      nextUrl = `/me/adaccounts?fields=${fields}&limit=100&after=${response.paging.cursors.after}`
    } else {
      nextUrl = null
    }
  }

  return allAccounts
}

/**
 * Busca informações do usuário do Facebook.
 */
export async function fetchFacebookUser(): Promise<{
  id: string
  name: string
  email?: string
}> {
  return fbApi('/me', { fields: 'id,name,email' })
}

/**
 * Busca todas as Facebook Pages que o usuário gerencia.
 */
export async function fetchMetaPages(): Promise<MetaPage[]> {
  try {
    const response = await fbApi<{ data: MetaPage[] }>('/me/accounts', {
      fields:
        'id,name,category,access_token,fan_count,picture,instagram_business_account',
      limit: 100,
    })
    return response.data || []
  } catch {
    return []
  }
}

/**
 * Busca contas Instagram Business vinculadas às Pages.
 */
export async function fetchInstagramAccounts(
  pages: MetaPage[]
): Promise<MetaInstagramAccount[]> {
  const accounts: MetaInstagramAccount[] = []

  for (const page of pages) {
    if (!page.instagram_business_account?.id) continue
    try {
      const ig = await fbApi<MetaInstagramAccount>(
        `/${page.instagram_business_account.id}`,
        {
          fields:
            'id,name,username,profile_picture_url,followers_count,media_count,biography',
        }
      )
      accounts.push(ig)
    } catch {
      // Skip pages where IG fetch fails
    }
  }

  return accounts
}

/**
 * Busca TODOS os assets de uma vez após OAuth:
 * Ad Accounts + Pages + Instagram + User info
 */
export async function fetchAllMetaAssets(): Promise<MetaConnectedAssets> {
  const [fbUser, adAccounts, pages] = await Promise.all([
    fetchFacebookUser(),
    fetchMetaAdAccounts(),
    fetchMetaPages(),
  ])

  const instagramAccounts = await fetchInstagramAccounts(pages)

  return { fbUser, adAccounts, pages, instagramAccounts }
}

// =====================================================
// TOKEN EXCHANGE (via N8N ou Supabase Edge Function)
// =====================================================

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ''

/**
 * Troca short-lived token por long-lived token (60 dias)
 * via N8N webhook backend (que tem o App Secret).
 *
 * Se N8N não estiver configurado, retorna o short-lived token.
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  if (!N8N_WEBHOOK_URL) {
    console.warn('N8N webhook não configurado. Usando short-lived token.')
    return { accessToken: shortLivedToken, expiresIn: 3600 }
  }

  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/adsflow/meta-token-exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ short_lived_token: shortLivedToken }),
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      accessToken: data.access_token || shortLivedToken,
      expiresIn: data.expires_in || 3600,
    }
  } catch (err) {
    console.warn('Token exchange falhou, usando short-lived token:', err)
    return { accessToken: shortLivedToken, expiresIn: 3600 }
  }
}

// =====================================================
// ACCOUNT STATUS HELPERS
// =====================================================

export const ACCOUNT_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Ativa', color: 'text-green-700 bg-green-100' },
  2: { label: 'Desabilitada', color: 'text-red-700 bg-red-100' },
  3: { label: 'Pendente', color: 'text-yellow-700 bg-yellow-100' },
  7: { label: 'Em Revisão', color: 'text-orange-700 bg-orange-100' },
  9: { label: 'Período de Graça', color: 'text-yellow-700 bg-yellow-100' },
  100: { label: 'Fechando', color: 'text-red-700 bg-red-100' },
  101: { label: 'Fechada', color: 'text-slate-500 bg-slate-100' },
}

export function getAccountStatusInfo(status: number) {
  return ACCOUNT_STATUS_MAP[status] || { label: `Status ${status}`, color: 'text-slate-500 bg-slate-100' }
}
