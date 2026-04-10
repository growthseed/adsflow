/**
 * ClientRootRedirect
 *
 * Handles bare `/c/:clientSlug` URLs (the "access link" format we
 * share with clients via email/WhatsApp). Resolves to the best
 * landing page for the caller:
 *
 *  - Portal-only viewer  → /c/:slug/portal
 *  - Any staff / member  → /c/:slug/overview
 *
 * This is what you put in the WhatsApp/email link: short, legible,
 * branded — `adsflow.efeito.digital/c/dr-euvaldo-tomaz`.
 */

import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function ClientRootRedirect() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const { user, activeClientRole } = useAuth()

  if (!clientSlug) return <Navigate to="/_v4/operations" replace />

  const portalOnly =
    user?.globalRole === 'user' && activeClientRole === 'viewer'

  const target = portalOnly
    ? `/c/${clientSlug}/portal`
    : `/c/${clientSlug}/overview`

  return <Navigate to={target} replace />
}
