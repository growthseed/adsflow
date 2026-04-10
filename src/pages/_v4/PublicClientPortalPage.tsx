/**
 * ============================================
 * PUBLIC CLIENT PORTAL — token-based, no auth required
 * ============================================
 * Route: /portal/:token
 *
 * This is the link the gestor shares with the client via WhatsApp
 * or email. The token resolves to a client slug via Supabase RPC
 * (resolve_portal_token). No login needed — the token IS the auth.
 *
 * The page shows the same content as the authenticated portal
 * (MobileKPIHeader + TaskTimeline + progress bar) but uses the
 * snapshot data directly (no auth context).
 *
 * Security model:
 *   - Token is a 32-char hex string (128 bits of entropy)
 *   - RPC returns only slug + name + logo_url + industry (no secrets)
 *   - Snapshot data is the same pre-built mock/live data any viewer sees
 *   - If the client shares the link, it's their responsibility
 *   - The gestor can disable the token (portal_enabled = false) anytime
 * ============================================
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import supabase from '@/lib/supabase'
import { getClientPortalBundle } from '@/services/clientPortalService'
import { getClientSnapshot } from '@/data/clientDashboardSnapshots'
import { humanizeSnapshot } from '@/lib/humanizeSnapshot'
import MobileKPIHeader from '@/components/ClientPortal/MobileKPIHeader'
import TaskTimeline from '@/components/ClientPortal/TaskTimeline'
import PortalEmptyState from '@/components/ClientPortal/PortalEmptyState'
import { ClientBrand } from '@/components/canonical'

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

    ;(async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc(
          'resolve_portal_token',
          { p_token: token },
        )
        if (rpcError) throw rpcError
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setError('Link expirado ou desativado. Entre em contato com a Efeito Digital.')
          return
        }
        const row = Array.isArray(data) ? data[0] : data
        setClient(row as ResolvedClient)
      } catch (err) {
        console.error('[PublicPortal] resolve_portal_token failed:', err)
        setError('Erro ao carregar o painel. Tente novamente.')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const bundle = useMemo(
    () => (client?.slug ? getClientPortalBundle(client.slug) : null),
    [client],
  )

  const snapshot = useMemo(
    () => (client?.slug ? getClientSnapshot(client.slug) : null),
    [client],
  )

  const welcome = useMemo(
    () => (snapshot ? humanizeSnapshot(snapshot) : null),
    [snapshot],
  )

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando seu painel...</p>
        </div>
      </div>
    )
  }

  // --- Error state ---
  if (error || !client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 mb-2">
            {error || 'Painel não encontrado'}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Se você recebeu esse link de um gestor da Efeito Digital e acredita
            que deveria funcionar, entre em contato.
          </p>
          <a
            href="mailto:jw@efeito.digital"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Falar com a Efeito Digital
          </a>
        </div>
      </div>
    )
  }

  const roadmap = bundle?.roadmap
  const kpi = bundle?.kpis ?? null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- HEADER -------------------------------------------------- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <ClientBrand
            name={client.name}
            slug={client.slug}
            logoUrl={client.logo_url}
            size="md"
            subtitle={client.industry ?? undefined}
          />
          <a
            href="mailto:jw@efeito.digital"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1"
          >
            Falar com meu gestor
          </a>
        </div>

        {/* KPI strip */}
        <MobileKPIHeader kpi={kpi} />
      </header>

      {/* --- WELCOME ------------------------------------------------- */}
      {welcome && snapshot && (
        <div className="max-w-3xl mx-auto px-4 pt-5">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-5 text-white shadow-lg">
            <div className="text-xs font-medium uppercase tracking-wider text-blue-200 mb-1">
              {snapshot.period.label}
            </div>
            <h2 className="text-xl font-bold mb-2">{welcome.greeting}</h2>
            <div className="space-y-1.5 text-sm text-blue-50 leading-relaxed">
              {welcome.body.map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- CONTENT ------------------------------------------------- */}
      <main className="max-w-3xl mx-auto pb-24">
        {roadmap && roadmap.tasks.length > 0 ? (
          <>
            {/* Progress bar */}
            <div className="px-4 pt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600">
                  Progresso do projeto
                </span>
                <span className="text-xs font-semibold tabular-nums text-slate-900">
                  {roadmap.progress_percentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${roadmap.progress_percentage}%` }}
                />
              </div>
            </div>

            <TaskTimeline tasks={roadmap.tasks} />
          </>
        ) : (
          <PortalEmptyState
            title="Nada por aqui ainda"
            description="Seu projeto está começando. As entregas aparecem aqui automaticamente."
          />
        )}

        {/* Footer branding */}
        <div className="text-center py-8 px-6">
          <p className="text-[11px] text-slate-400">
            Painel de acompanhamento gerenciado pela Efeito Digital
          </p>
          <a
            href="https://efeito.digital"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-500 hover:text-blue-700"
          >
            efeito.digital
          </a>
        </div>
      </main>
    </div>
  )
}
