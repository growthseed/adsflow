import { Route } from 'react-router-dom'

import AppLayout from '@/components/Layout/AppLayout'
import { ProtectedRoute } from './guards'
import {
  IntegrationsPage,
  TeamPage,
  SettingsPage,
  AdminPage,
  BillingPage,
  V4DesignSystemPage,
} from './lazy'

const withAgency = (page: React.ReactNode) => (
  <ProtectedRoute>
    <AppLayout>{page}</AppLayout>
  </ProtectedRoute>
)

/**
 * Configurações top-level (não-cliente-específicas). Mantidas aqui por
 * isolamento — se um dia virar sub-dashboard de billing/admin, mover.
 */
export const settingsRoutes = (
  <>
    <Route path="/integrations" element={withAgency(<IntegrationsPage />)} />
    <Route path="/team" element={withAgency(<TeamPage />)} />
    <Route path="/billing" element={withAgency(<BillingPage />)} />
    <Route path="/settings" element={withAgency(<SettingsPage />)} />
    <Route path="/admin" element={withAgency(<AdminPage />)} />

    {/* Dev-only — showcase do design system */}
    <Route
      path="/_v4/design-system"
      element={
        <ProtectedRoute>
          <V4DesignSystemPage />
        </ProtectedRoute>
      }
    />
  </>
)
