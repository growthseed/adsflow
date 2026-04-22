/**
 * Public Client Portal — rota pública `/portal/:token` (sem auth).
 *
 * Handoff V2 · Leva 2 spec #8: o link colado no grupo de WhatsApp do
 * cliente abre o MESMO shell mobile-first que `/c/:slug/portal`, em
 * modo read-only e sem thread de comentários (sem auth → sem autor).
 *
 * Fluxo:
 *   1. Resolve o token via RPC `resolve_portal_token` (server-side,
 *      RLS-safe, só devolve slug + nome + logo + indústria).
 *   2. Passa o slug para `PortalV2Shell` com `clientId: null`, que
 *      automaticamente desabilita o CTA de comentar.
 *
 * Segurança: token de 32 caracteres hex (128 bits). Revogável pelo
 * gestor (invalida em todos os membros do grupo simultaneamente).
 */

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'

import supabase from '@/lib/supabase'
import { PortalV2Shell } from '@/features/portal-v2/PortalV2Shell'

interface ResolvedClient {
  slug: string
  name: string
  logo_url: string | null
  industry: string | null
}

export default function PublicClientPortalPage() {
  const { token } = useParams<{ token: string }>()
  const [client, setClient] = useState<ResolvedClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Link inválido.')
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc('resolve_portal_token', {
          p_token: token,
        })
        if (cancelled) return
        if (rpcError) throw rpcError
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setError('Link expirado ou desativado. Fale com a agência.')
          return
        }
        const row = Array.isArray(data) ? data[0] : data
        setClient(row as ResolvedClient)
      } catch (err) {
        console.error('[PublicPortal] resolve_portal_token failed:', err)
        setError('Erro ao carregar o painel. Tente novamente.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50">
        <div className="flex items-center gap-2 text-neutral-500 text-sm">
          <Loader2 size={16} className="animate-spin" /> Carregando painel…
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 px-6 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-error-50 text-error-600 grid place-items-center">
            <AlertCircle size={18} />
          </div>
          <div className="text-sm font-semibold text-neutral-900 mb-1">
            Link indisponível
          </div>
          <p className="text-xs text-neutral-500">
            {error ?? 'Tente novamente em instantes.'}
          </p>
        </div>
      </div>
    )
  }

  /*
   * clientId é null de propósito — em rota pública não temos auth user,
   * então a thread de comentários fica escondida (o próprio shell detecta
   * e omite os botões). Tudo mais (resumo, metas, timeline, próxima call)
   * renderiza normalmente, igual à rota autenticada.
   */
  return (
    <PortalV2Shell
      clientSlug={client.slug}
      clientId={null}
      readerMode
    />
  )
}
