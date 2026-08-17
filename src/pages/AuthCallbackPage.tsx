/**
 * ============================================
 * AUTH CALLBACK PAGE — Google OAuth
 * ============================================
 * Handles the redirect from Google's OAuth consent screen:
 *   /auth/google/callback?code=...&state=...&scope=...
 *
 * Flow:
 *  1. Parse code + state from URL
 *  2. Entrega o code ao servidor (/api/google-ads?action=exchange), que troca,
 *     grava em client_integrations e devolve so o resultado sanitizado
 *  3. Redirect to /integrations (ou /login se nao autenticado)
 *
 * O token nunca chega ao browser — a gravacao e server-side com service role,
 * porque client_integrations tem RLS deny-all.
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { googleAuthService, type GooglePlatform } from '@/services/googleAuthService'
import { useAuth } from '@/contexts/AuthContext'

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
      let clientSlugFromState: string | null = null
      if (stateRaw) {
        try {
          const decoded = JSON.parse(atob(stateRaw)) as {
            platforms?: GooglePlatform[]
            clientSlug?: string | null
          }
          if (decoded.platforms?.length) platforms = decoded.platforms
          if (decoded.clientSlug) clientSlugFromState = decoded.clientSlug
        } catch {
          console.warn('[AuthCallback] Could not decode state, using defaults')
        }
      }

      try {
        // O servidor faz tudo: troca o code, identifica a conta Google,
        // grava em client_integrations e devolve so o resultado sanitizado.
        // Nenhum token passa por aqui — era o achado da auditoria.
        setMessage('Concluindo conexão no servidor...')

        if (!clientSlugFromState) {
          throw new Error(
            'Cliente não identificado no retorno do Google. Selecione um cliente e refaça a conexão.',
          )
        }

        const result = await googleAuthService.connect(
          code,
          clientSlugFromState,
          platforms,
        )

        const nomes = result.providers.join(', ')
        setMessage(`Conectado como ${result.google_email} (${nomes}).`)

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-brand-600)] mx-auto mb-4"></div>
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
              className="px-6 py-2 bg-[var(--color-brand-600)] text-white rounded-lg hover:bg-[var(--color-brand-700)] transition-colors"
            >
              Voltar para Integrações
            </button>
          </>
        )}
      </div>
    </div>
  )
}
