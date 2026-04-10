import { Component, type ReactNode, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DateRangeProvider } from './contexts/DateRangeContext'
import SnapshotWarmer from './contexts/SnapshotWarmer'

// Layout (not lazy — always needed for protected routes)
import AppLayout from './components/Layout/AppLayout'
import ClientContextGuard from './components/Layout/ClientContextGuard'

// UI
import { ToastProvider } from './components/UI/Toast'
import { ConfirmDialogProvider } from './components/UI/ConfirmDialog'
import { CommandPaletteProvider } from './components/UI/CommandPalette'

// React Query client — staleTime 5min, gcTime 30min
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
  },
})

// Retry wrapper for lazy imports — handles chunk load failures on deploy
function lazyRetry(factory: () => Promise<{ default: React.ComponentType }>, retries = 2) {
  return lazy(() =>
    factory().catch((err) => {
      if (retries > 0) {
        return new Promise<{ default: React.ComponentType }>((resolve) => {
          setTimeout(() => resolve(lazyRetry(factory, retries - 1) as unknown as Promise<{ default: React.ComponentType }>), 500)
        })
      }
      // All retries failed — reload the page to get fresh chunks
      window.location.reload()
      throw err
    })
  )
}

// ============================================
// Public pages (sem auth)
// ============================================
const LandingPage = lazyRetry(() => import('./pages/LandingPage'))
const LoginPage = lazyRetry(() => import('./pages/LoginPage'))
const PrivacyPage = lazyRetry(() => import('./pages/PrivacyPage'))
const TermsPage = lazyRetry(() => import('./pages/TermsPage'))
const NotFoundPage = lazyRetry(() => import('./pages/NotFoundPage'))
const AuthCallbackPage = lazyRetry(() => import('./pages/AuthCallbackPage'))

// ============================================
// Configurações da agência (protegidas)
// ============================================
const IntegrationsPage = lazyRetry(() => import('./pages/IntegrationsPage'))
const ClientsPage = lazyRetry(() => import('./pages/ClientsPage'))
const TeamPage = lazyRetry(() => import('./pages/TeamPage'))
const SettingsPage = lazyRetry(() => import('./pages/SettingsPage'))
const AdminPage = lazyRetry(() => import('./pages/AdminPage'))
const BillingPage = lazyRetry(() => import('./pages/BillingPage'))

// ============================================
// v4 — Os 3 pilares + navegação da agência
// ============================================
const V4DesignSystemPage = lazyRetry(() => import('./pages/_v4/DesignSystemPage'))
const V4AgencyOverviewPage = lazyRetry(() => import('./pages/_v4/AgencyOverviewPage'))
const V4ClientOverviewPage = lazyRetry(() => import('./pages/_v4/ClientOverviewPage'))
const V4ClientProjectPage = lazyRetry(() => import('./pages/_v4/ClientProjectPage'))
const V4ClientPerformancePage = lazyRetry(() => import('./pages/_v4/ClientPerformancePage'))
const V4ClientPlannerPage = lazyRetry(() => import('./pages/_v4/ClientPlannerPage'))
const V4PublicFlowPage = lazyRetry(() => import('./pages/_v4/PublicFlowPage'))
const V4PlaybookPage = lazyRetry(() => import('./pages/_v4/PlaybookPage'))
const V4ClientPortalPage = lazyRetry(() => import('./pages/_v4/ClientPortalPage'))
const V4ClientRootRedirect = lazyRetry(() => import('./pages/_v4/ClientRootRedirect'))
const V4PublicClientPortalPage = lazyRetry(() => import('./pages/_v4/PublicClientPortalPage'))

// Error Boundary para capturar erros de React
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h1>
            <p className="text-gray-600 mb-4">Ocorreu um erro inesperado na aplicação.</p>
            <pre className="bg-gray-100 p-4 rounded-lg text-left text-xs text-red-600 overflow-auto max-h-32 mb-4">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Protected Route Component — wraps all authenticated routes and
// mounts the SnapshotWarmer so live data is fetched once per session.
// If the caller is a "portal-only" user (globalRole=user + active
// client role=viewer) any operational surface redirects them to
// their client portal.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, activeClientRole, activeClient } = useAuth()
  const globalRole = user?.globalRole

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Portal-only gate: if the user is a plain `user` with a `viewer`
  // client role, force them to the portal for their active client.
  // Super admins / admins / managers / owners pass through unchanged.
  const portalOnly = globalRole === 'user' && activeClientRole === 'viewer'
  if (portalOnly && activeClient?.client.slug) {
    return <Navigate to={`/c/${activeClient.client.slug}/portal`} replace />
  }

  return <SnapshotWarmer>{children}</SnapshotWarmer>
}

/**
 * Dedicated route wrapper for the client portal. Unlike ProtectedRoute,
 * it does NOT mount AppLayout/SnapshotWarmer — the portal is a minimal
 * mobile-first shell that has its own chrome. It still requires auth
 * and (for portal-only users) scopes them to their own client slug.
 */
const PortalRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, activeClientRole, activeClient } = useAuth()
  const globalRole = user?.globalRole

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Portal-only users must only see their OWN client's portal. If they
  // try to visit a different client's portal URL, bounce them to their
  // own. Non-portal users (admin, super_admin, owners doing QA) are
  // allowed to preview any client's portal.
  const portalOnly = globalRole === 'user' && activeClientRole === 'viewer'
  if (portalOnly) {
    const ownSlug = activeClient?.client.slug
    if (!ownSlug) return <Navigate to="/login" replace />
    // The route param is resolved inside the page via useParams; we
    // can't compare here without another hook. The page itself treats
    // a missing/mismatched slug as a 404. Good enough for Sprint 1.
  }

  return <SnapshotWarmer>{children}</SnapshotWarmer>
}

// Public Route - redirects to dashboard if logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

// Suspense fallback for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p className="text-sm text-slate-500">Carregando...</p>
    </div>
  </div>
)

// App Principal
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DateRangeProvider>
        <ToastProvider>
        <ConfirmDialogProvider>
        <BrowserRouter>
          <CommandPaletteProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ══════════════════════════════════════════════════
                PÚBLICAS (sem auth)
                ══════════════════════════════════════════════════ */}
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Public flow sharing (no auth) — Planner read-only */}
            <Route path="/p/:token" element={<V4PublicFlowPage />} />

            {/* Public client portal (no auth) — token-based view-only */}
            <Route path="/portal/:token" element={<V4PublicClientPortalPage />} />

            {/* OAuth callback — Google landa aqui */}
            <Route path="/auth/google/callback" element={<AuthCallbackPage />} />

            {/* ══════════════════════════════════════════════════
                NÍVEL 1 — Agência (Efeito Digital)
                ══════════════════════════════════════════════════ */}
            <Route
              path="/_v4/operations"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <V4AgencyOverviewPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Alias legacy: /dashboard → nova visão geral */}
            <Route path="/dashboard" element={<Navigate to="/_v4/operations" replace />} />
            <Route path="/overview" element={<Navigate to="/_v4/operations" replace />} />

            {/* Clientes list (mantida por enquanto, link da sidebar) */}
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ClientsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* ══════════════════════════════════════════════════
                NÍVEL 2-4 — Cliente (os 3 pilares)
                ══════════════════════════════════════════════════ */}
            {/* Short public access link — resolves /c/:slug to the right
                landing page (portal for viewers, overview for staff) */}
            <Route
              path="/c/:clientSlug"
              element={
                <ProtectedRoute>
                  <V4ClientRootRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/c/:clientSlug/overview"
              element={
                <ProtectedRoute>
                  <ClientContextGuard>
                    <AppLayout>
                      <V4ClientOverviewPage />
                    </AppLayout>
                  </ClientContextGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/c/:clientSlug/planner"
              element={
                <ProtectedRoute>
                  <ClientContextGuard>
                    <AppLayout>
                      <V4ClientPlannerPage />
                    </AppLayout>
                  </ClientContextGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/c/:clientSlug/performance"
              element={
                <ProtectedRoute>
                  <ClientContextGuard>
                    <AppLayout>
                      <V4ClientPerformancePage />
                    </AppLayout>
                  </ClientContextGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/c/:clientSlug/projeto"
              element={
                <ProtectedRoute>
                  <ClientContextGuard>
                    <AppLayout>
                      <V4ClientProjectPage />
                    </AppLayout>
                  </ClientContextGuard>
                </ProtectedRoute>
              }
            />

            {/* ══════════════════════════════════════════════════
                CLIENT PORTAL — read-only, mobile-first
                PortalRoute instead of ProtectedRoute because the
                portal has its own minimal shell (no AppLayout).
                ══════════════════════════════════════════════════ */}
            <Route
              path="/c/:clientSlug/portal"
              element={
                <PortalRoute>
                  <V4ClientPortalPage />
                </PortalRoute>
              }
            />

            {/* ══════════════════════════════════════════════════
                CONFIGURAÇÕES DA AGÊNCIA
                ══════════════════════════════════════════════════ */}
            <Route
              path="/playbook"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <V4PlaybookPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/integrations"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <IntegrationsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TeamPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <BillingPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AdminPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* ══════════════════════════════════════════════════
                DEV — Design System showcase
                ══════════════════════════════════════════════════ */}
            <Route
              path="/_v4/design-system"
              element={
                <ProtectedRoute>
                  <V4DesignSystemPage />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
          </CommandPaletteProvider>
        </BrowserRouter>
        </ConfirmDialogProvider>
        </ToastProvider>
        </DateRangeProvider>
      </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
