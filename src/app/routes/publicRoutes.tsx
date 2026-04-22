import { Route } from 'react-router-dom'

import { PublicRoute } from './guards'
import {
  LandingPage,
  LoginPage,
  PrivacyPage,
  TermsPage,
  AuthCallbackPage,
  V4PublicFlowPage,
  V4PublicClientPortalPage,
} from './lazy'

/**
 * Grupo público (sem auth). Emitido como fragment de <Route> pra ser
 * composto dentro de <Routes> na raiz. NÃO renderiza <Routes> aqui —
 * isso permite concatenar grupos sem aninhar routers.
 */
export const publicRoutes = (
  <>
    <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/terms" element={<TermsPage />} />

    {/* Public flow sharing — Planner read-only */}
    <Route path="/p/:token" element={<V4PublicFlowPage />} />

    {/* Public client portal (token-based, sem auth) */}
    <Route path="/portal/:token" element={<V4PublicClientPortalPage />} />

    {/* OAuth callback — Google landa aqui */}
    <Route path="/auth/google/callback" element={<AuthCallbackPage />} />
  </>
)
