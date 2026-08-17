/**
 * ============================================
 * ClientContextGuard
 * ============================================
 * Wraps every route under `/c/:clientSlug/*` and makes sure:
 *
 *  1. The slug in the URL exists (bounces to /_v4/operations otherwise).
 *  2. The slug in the URL is the `activeClient` in AuthContext —
 *     if the user navigates directly to /c/other-client/overview,
 *     we auto-switch the active client to "other-client" so the
 *     sidebar, header badge, and KPI data all stay in sync.
 *  3. Portal-only users (globalRole=user + viewer) can only access
 *     their OWN client. Any attempt to visit another client's slug
 *     redirects to their allowed portal.
 *
 * Used in App.tsx:
 *
 *   <Route
 *     path="/c/:clientSlug/overview"
 *     element={
 *       <ProtectedRoute>
 *         <ClientContextGuard>
 *           <AppLayout><ClientOverviewPage /></AppLayout>
 *         </ClientContextGuard>
 *       </ProtectedRoute>
 *     }
 *   />
 * ============================================
 */

import { useEffect, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'

interface ClientContextGuardProps {
  children: ReactNode
}

export default function ClientContextGuard({ children }: ClientContextGuardProps) {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const {
    clients,
    activeClient,
    setActiveClient,
    user,
    activeClientRole,
    isGlobalAdmin,
  } = useAuth()

  // Is the user a portal-only caller? (Sprint 1 definition)
  const portalOnly =
    user?.globalRole === 'user' && activeClientRole === 'viewer'

  // Find the membership entry that matches the URL slug, if any
  const matchingMembership = clients.find(
    (m) => m.client.slug === clientSlug,
  )

  // Auto-switch: if the URL points to a client we're a member of but
  // it's not the active one, flip the active client. This happens in
  // an effect so React state updates don't clash with render.
  useEffect(() => {
    if (
      matchingMembership &&
      matchingMembership.client_id !== activeClient?.client_id
    ) {
      setActiveClient(matchingMembership.client_id)
    }
  }, [matchingMembership, activeClient, setActiveClient])

  // --- Guards ---
  //
  // IMPORTANT: `/_v4/operations` is the AGENCY zone. Non-staff (anyone who
  // isn't admin/super_admin) must never be bounced there — that's exactly
  // the "salada" bug where a client user's session hiccup dropped them into
  // internal agency nav. Non-staff always fall back to their own client
  // portal (or /login if we don't even know who they are).
  const nonStaffFallback = () => {
    const ownSlug = activeClient?.client.slug
    // IMPORTANT: nunca /login para um usuário já autenticado — /login está
    // dentro de PublicRoute, que redireciona qualquer `user` de volta pra
    // /dashboard → /_v4/operations → AgencyRoute → (sem ownSlug) → aqui de
    // novo. Isso é exatamente o loop de "Maximum update depth exceeded" +
    // throttling de navegação visto em produção. /no-access é terminal.
    return ownSlug
      ? <Navigate to={`/c/${ownSlug}/portal`} replace />
      : <Navigate to="/no-access" replace />
  }
  const bounceOut = () => (isGlobalAdmin
    ? <Navigate to="/_v4/operations" replace />
    : nonStaffFallback())

  if (!clientSlug) {
    // Shouldn't happen (route always has :clientSlug) but be safe
    return bounceOut()
  }

  // Slug doesn't exist in the local AgencyClient snapshot — bail.
  // Staff can still navigate freely, so only bounce if the slug
  // is structurally invalid (no matching snapshot at all).
  const knownClient = getClientBySlug(clientSlug)
  if (!knownClient) {
    return bounceOut()
  }

  // Portal-only users can ONLY visit their own client. Any other
  // slug → redirect to their allowed portal.
  if (portalOnly) {
    const ownSlug = activeClient?.client.slug
    if (!ownSlug) return <Navigate to="/login" replace />
    if (clientSlug !== ownSlug) {
      return <Navigate to={`/c/${ownSlug}/portal`} replace />
    }
  }

  // Staff (admin/super_admin) can access any client even without an
  // explicit client_members row. End-users must have a membership.
  if (!isGlobalAdmin && !matchingMembership) {
    return nonStaffFallback()
  }

  return <>{children}</>
}
