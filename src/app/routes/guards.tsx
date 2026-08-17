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
 * Gate das rotas de AGÊNCIA (`/clients`, `/reports`, `/pacing`, `/ai`, etc).
 *
 * Antes essas rotas só passavam por `ProtectedRoute` — qualquer usuário
 * autenticado, incluindo um cliente portal-only, conseguia acessar
 * diretamente por URL mesmo o item nunca aparecendo no menu dele (a
 * sidebar só escondia o LINK, não bloqueava a ROTA). Isso vazava a
 * carteira inteira de clientes pra quem não deveria ver.
 *
 * Regra: só quem é staff da agência (globalRole admin/super_admin) entra.
 * Todo mundo mais é devolvido pro próprio portal.
 */
export function AgencyRoute({ children }: { children: ReactNode }) {
  const { user, loading, isGlobalAdmin, activeClient } = useAuth()

  if (loading) return <LoadingScreen variant="fullscreen" />
  if (!user) return <Navigate to="/login" replace />

  if (!isGlobalAdmin) {
    const ownSlug = activeClient?.client.slug
    // IMPORTANT: nunca mandar um usuário JÁ autenticado pra /login — ela é
    // envolta em PublicRoute, que manda qualquer `user` de volta pra
    // /dashboard, que redireciona pra cá (AgencyRoute). Loop infinito
    // (React "Maximum update depth exceeded" + router throttling a
    // navegação). /no-access é o destino terminal, fora de PublicRoute.
    return ownSlug
      ? <Navigate to={`/c/${ownSlug}/portal`} replace />
      : <Navigate to="/no-access" replace />
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
    // Mesmo motivo do AgencyRoute acima: usuário autenticado sem slug
    // resolvido não pode ir pra /login (PublicRoute manda de volta pro
    // /dashboard e recria o loop).
    return <Navigate to="/no-access" replace />
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
