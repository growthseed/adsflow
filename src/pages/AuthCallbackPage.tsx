/**
 * ============================================
 * AUTH CALLBACK PAGE — Google OAuth
 * ============================================
 * Handles the redirect from Google's OAuth consent screen:
 *   /auth/google/callback?code=...&state=...&scope=...
 *
 * Flow:
 *  1. Parse code + state from URL
 *  2. Exchange code for tokens via googleAuthService (Vercel proxy /api/google-ads?action=exchange)
 *  3. Fetch authorized user info (email) from Google
 *  4. Upsert the OAuth connection into public.google_accounts
 *  5. Redirect to /integrations with a success toast (or /login if unauthenticated)
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { googleAuthService, type GooglePlatform } from '@/services/googleAuthService'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Direct REST constants — we bypass supabase-js here because the singleton
// client gets stuck after the Google OAuth redirect, so any call through it
// hangs forever. A raw fetch with the session JWT from localStorage sidesteps
// the entire supabase-js state machine.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const SUPABASE_STORAGE_KEY = 'adsflow-auth'

/** Read the current Supabase session JWT from localStorage. */
function getSupabaseJwt(): string | null {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // supabase-js v2 stores session as { access_token, refresh_token, ... }
    // under various shapes depending on version.
    return (
      parsed?.access_token ||
      parsed?.currentSession?.access_token ||
      parsed?.session?.access_token ||
      null
    )
  } catch {
    return null
  }
}

/** Fetch wrapper with AbortController timeout. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

const MCC_ID = '1011817676' // Efeito Digital MCC (101-181-7676)
const MCC_NAME = 'Efeito Digital (MCC 101-181-7676)'

type Status = 'processing' | 'success' | 'error'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [status, setStatus] = useState<Status>('processing')
  const [message, setMessage] = useState('Processando autorização do Google...')
  const processedRef = useRef(false)

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return

    // Guard against React StrictMode double-invocation in dev
    if (processedRef.current) return
    processedRef.current = true

    const handleCallback = async () => {
      // Parse URL params
      const code = searchParams.get('code')
      const stateRaw = searchParams.get('state')
      const errorParam = searchParams.get('error')
      const scopeParam = searchParams.get('scope') || ''

      // Google returned an error
      if (errorParam) {
        setStatus('error')
        setMessage(`Google retornou erro: ${errorParam}`)
        return
      }

      if (!code) {
        setStatus('error')
        setMessage('Código de autorização ausente na URL.')
        return
      }

      // Decode state (base64 JSON: { platforms, clientId, ts })
      let platforms: GooglePlatform[] = ['google_ads']
      let clientIdFromState: string | null = null
      if (stateRaw) {
        try {
          const decoded = JSON.parse(atob(stateRaw)) as {
            platforms?: GooglePlatform[]
            clientId?: string | null
          }
          if (decoded.platforms?.length) platforms = decoded.platforms
          if (decoded.clientId) clientIdFromState = decoded.clientId
        } catch {
          console.warn('[AuthCallback] Could not decode state, using defaults')
        }
      }

      try {
        // 1) Exchange code → tokens via Vercel proxy
        setMessage('Trocando código por tokens de acesso...')
        const tokens = await googleAuthService.exchangeCodeForTokens(code)

        if (!tokens.access_token) {
          throw new Error('Resposta inválida do servidor (sem access_token).')
        }

        // 2) Fetch authorized user email from Google userinfo
        setMessage('Identificando conta Google autorizada...')
        let googleEmail = ''
        try {
          const userinfoResp = await fetch(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            { headers: { Authorization: `Bearer ${tokens.access_token}` } },
          )
          if (userinfoResp.ok) {
            const userinfo = await userinfoResp.json()
            googleEmail = userinfo.email || ''
          }
        } catch {
          // Non-fatal — continue without email
        }

        // 3) Save to Supabase (one row per platform authorized)
        if (!isSupabaseConfigured) {
          throw new Error('Supabase não configurado.')
        }
        if (!user?.id) {
          throw new Error('Usuário não autenticado — faça login antes de conectar o Google.')
        }

        setMessage('Salvando conexão no banco de dados...')
        console.log('[AuthCallback] Supabase user.id:', user.id)
        console.log('[AuthCallback] Platforms to save:', platforms)

        // Read JWT directly from localStorage — bypass supabase-js auth state.
        const jwt = getSupabaseJwt()
        console.log('[AuthCallback] jwt present:', !!jwt, 'length:', jwt?.length ?? 0)
        if (!jwt) {
          throw new Error(
            'Sessão Supabase ausente no localStorage — faça logout e login no AdFlow antes de conectar.',
          )
        }

        const expiresAt = new Date(
          Date.now() + (tokens.expires_in || 3600) * 1000,
        ).toISOString()

        const scopesArray = scopeParam ? scopeParam.split(' ').filter(Boolean) : []

        for (const platform of platforms) {
          // account_id strategy:
          // - google_ads  → MCC id (child accounts discovered on first sync)
          // - ga4         → placeholder 'pending' (property picked later in UI)
          // - search_console → placeholder 'pending' (site picked later in UI)
          const accountId = platform === 'google_ads' ? MCC_ID : 'pending'
          const accountName =
            platform === 'google_ads'
              ? MCC_NAME + (googleEmail ? ` — ${googleEmail}` : '')
              : `${platform} — ${googleEmail || 'pending'}`

          const row = {
            user_id: user.id,
            client_id: clientIdFromState,
            platform,
            account_id: accountId,
            account_name: accountName,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null,
            token_expires_at: expiresAt,
            scopes: scopesArray,
            status: 'active',
            sync_error: null,
          }

          console.log(`[AuthCallback] upsert ${platform}…`, {
            user_id: row.user_id,
            platform: row.platform,
            account_id: row.account_id,
            scopes_count: row.scopes.length,
          })

          // Direct fetch to PostgREST. Uses `Prefer: resolution=merge-duplicates`
          // which is how supabase-js implements upsert under the hood, plus
          // `return=representation` so we get the inserted row back.
          const url =
            `${SUPABASE_URL}/rest/v1/google_accounts` +
            `?on_conflict=user_id,platform,account_id`

          const response = await fetchWithTimeout(
            url,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${jwt}`,
                Prefer: 'resolution=merge-duplicates,return=representation',
              },
              body: JSON.stringify(row),
            },
            15000,
          )

          const bodyText = await response.text()
          let parsed: unknown = null
          try {
            parsed = bodyText ? JSON.parse(bodyText) : null
          } catch {
            parsed = bodyText
          }

          console.log(`[AuthCallback] upsert ${platform} response:`, {
            status: response.status,
            ok: response.ok,
            body: parsed,
          })

          if (!response.ok) {
            const msg =
              typeof parsed === 'object' && parsed !== null && 'message' in parsed
                ? (parsed as { message?: string }).message
                : bodyText
            throw new Error(
              `Erro ao salvar conexão (${platform}) — HTTP ${response.status}: ${msg}`,
            )
          }
          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error(
              `Upsert ${platform} não retornou linhas — RLS policy pode estar bloqueando.`,
            )
          }
        }

        setStatus('success')
        setMessage('Conta Google conectada com sucesso! Redirecionando...')

        // Hard redirect (NOT SPA navigate) to force a full page reload.
        // The supabase-js singleton gets into a broken state after the OAuth
        // redirect handshake, so any query through it hangs. A full reload
        // reinitializes the client cleanly, letting the IntegrationsPage
        // fetch the new connection and show "Conectado".
        setTimeout(() => {
          window.location.href = '/integrations'
        }, 1500)
      } catch (err) {
        console.error('[AuthCallback] Error:', err)
        setStatus('error')
        setMessage(
          err instanceof Error
            ? err.message
            : 'Erro desconhecido ao processar autorização do Google.',
        )
      }
    }

    handleCallback()
  }, [searchParams, navigate, user, authLoading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Conectando Google</h1>
            <p className="text-gray-600 text-sm">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Conectado!</h1>
            <p className="text-gray-600 text-sm">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Erro na autorização</h1>
            <p className="text-gray-600 text-sm mb-4">{message}</p>
            <button
              onClick={() => navigate('/integrations', { replace: true })}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voltar para Integrações
            </button>
          </>
        )}
      </div>
    </div>
  )
}
