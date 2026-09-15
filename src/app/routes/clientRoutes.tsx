import { Route } from 'react-router-dom'

import AppLayout from '@/components/Layout/AppLayout'
import ClientContextGuard from '@/components/Layout/ClientContextGuard'
import { PortalRoute, ProtectedRoute } from './guards'
import {
  V4ClientRootRedirect,
  V4ClientOverviewPage,
  V4ClientPlannerPage,
  ClientReportsPage,
  V4ClientPerformancePage,
  V4ClientProjectPage,
  V4MetaAdsPage,
  V4CrmFunnelPage,
  V4CrmLossesPage,
  V4ClientPortalPage,
} from './lazy'

/**
 * Rotas por cliente — exigem ClientContextGuard pra resolver o slug
 * e popular o AuthContext.activeClient antes da page montar. Portal
 * usa PortalRoute (shell próprio, sem AppLayout).
 */
const withClient = (page: React.ReactNode) => (
  <ProtectedRoute>
    <ClientContextGuard>
      <AppLayout>{page}</AppLayout>
    </ClientContextGuard>
  </ProtectedRoute>
)

export const clientRoutes = (
  <>
    {/* Short public access — resolve /c/:slug pro landing certo */}
    <Route
      path="/c/:clientSlug"
      element={
        <ProtectedRoute>
          <V4ClientRootRedirect />
        </ProtectedRoute>
      }
    />

    {/* 3 pilares + metas-ads */}
    <Route path="/c/:clientSlug/overview" element={withClient(<V4ClientOverviewPage />)} />
    <Route path="/c/:clientSlug/planner" element={withClient(<V4ClientPlannerPage />)} />
    <Route path="/c/:clientSlug/report" element={withClient(<ClientReportsPage />)} />
    <Route path="/c/:clientSlug/performance" element={withClient(<V4ClientPerformancePage />)} />
    <Route path="/c/:clientSlug/projeto" element={withClient(<V4ClientProjectPage />)} />
    <Route path="/c/:clientSlug/meta-ads" element={withClient(<V4MetaAdsPage />)} />

    {/* CRM */}
    <Route path="/c/:clientSlug/crm/funil" element={withClient(<V4CrmFunnelPage />)} />
    <Route path="/c/:clientSlug/crm/perdas" element={withClient(<V4CrmLossesPage />)} />

    {/* Portal do cliente — shell mínimo, sem AppLayout */}
    <Route
      path="/c/:clientSlug/portal"
      element={
        <PortalRoute>
          <V4ClientPortalPage />
        </PortalRoute>
      }
    />
  </>
)
