import { Route } from 'react-router-dom'

import AppLayout from '@/components/Layout/AppLayout'
import { ProtectedRoute, AgencyRoute } from './guards'
import {
  IntegrationsPage,
  TeamPage,
  SettingsPage,
  AdminPage,
  BillingPage,
  V4DesignSystemPage,
} from './lazy'

// Integrações/Equipe/Billing/Admin são internos da agência (tokens de API
// por cliente, folha de staff, cobrança) — nunca abertos pra quem só tem
// acesso de portal. `/settings` fica de fora: é perfil pessoal do usuário
// logado (nome/senha), qualquer autenticado pode ver o próprio.
const withAgency = (page: React.ReactNode) => (
  <AgencyRoute>
    <AppLayout>{page}</AppLayout>
  </AgencyRoute>
)

const withProfile = (page: React.ReactNode) => (
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
    <Route path="/settings" element={withProfile(<SettingsPage />)} />
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
