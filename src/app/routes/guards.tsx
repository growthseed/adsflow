import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import SnapshotWarmer from '@/contexts/SnapshotWarmer'
import LoadingScreen from '@/components/UI/LoadingScreen'

/**
 * Gate padrão das rotas autenticadas. Redireciona users portal-only
 * (globalRole=user + activeClientRole=viewer) pro próprio portal
 * e monta o SnapshotWarmer pra dados de sessão.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, activeClientRole, activeClient } = useAuth()
  const globalRole = user?.globalRole

  if (loading) return <LoadingScreen variant="fullscreen" />
  if (!user) return <Navigate to="/login" replace />

  const portalOnly = globalRole === 'user' && activeClientRole === 'viewer'
  if (portalOnly && activeClient?.client.slug) {
    return <Navigate to={`/c/${activeClient.client.slug}/portal`} replace />
  }

  return <SnapshotWarmer>{children}</SnapshotWarmer>
}

/**
 * Shell mínimo pro portal do cliente — sem AppLayout (a própria page
 * traz o chrome). Ainda exige auth; scoping por slug é validado na page.
 */
export function PortalRoute({ children }: { children: ReactNode }) {
  const { user, loading, activeClientRole, activeClient } = useAuth()
  const globalRole = user?.globalRole

  if (loading) return <LoadingScreen variant="fullscreen" />
  if (!user) return <Navigate to="/login" replace />

  const portalOnly = globalRole === 'user' && activeClientRole === 'viewer'
  if (portalOnly && !activeClient?.client.slug) {
    return <Navigate to="/login" replace />
  }

  return <SnapshotWarmer>{children}</SnapshotWarmer>
}

/**
 * Quem já tem sessão não precisa ver landing/login — bounce pro app.
 */
export function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen variant="fullscreen" />
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>
}
