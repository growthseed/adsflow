/**
 * Client Portal V2 · rota autenticada /c/:clientSlug/portal
 * Handoff V2 — Leva 2.
 *
 * Usa o mesmo shell da rota pública (/portal/:token) pra garantir
 * paridade visual. Aqui temos auth user → comentários habilitados.
 */

import { useMemo } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import { PortalV2Shell } from '@/features/portal-v2/PortalV2Shell'

export default function ClientPortalPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const { clients, activeClient, user, activeClientRole, signOut } = useAuth()
  const navigate = useNavigate()

  const clientId = useMemo(() => {
    if (!clientSlug) return null
    const match = clients.find((m) => m.client.slug === clientSlug)
    return match?.client.id ?? activeClient?.client.id ?? null
  }, [clientSlug, clients, activeClient])

  const readerMode =
    user?.globalRole === 'user' && activeClientRole === 'viewer'

  if (!clientSlug) return <Navigate to="/login" replace />

  return (
    <PortalV2Shell
      clientSlug={clientSlug}
      clientId={clientId}
      readerMode={readerMode}
      onExit={async () => {
        if (readerMode) {
          await signOut()
          navigate('/login', { replace: true })
        } else {
          navigate(`/c/${clientSlug}/overview`)
        }
      }}
    />
  )
}
