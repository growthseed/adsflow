import { Navigate, Route } from 'react-router-dom'

import AppLayout from '@/components/Layout/AppLayout'
import { AgencyRoute } from './guards'
import {
  V4AgencyOverviewPage,
  ClientsPage,
  V4PlaybookPage,
  PacingPage,
  ReportsPage,
  AlertsPage,
  AIChatPage,
  OnboardingPage,
  AnomaliesPage,
} from './lazy'

/**
 * Rotas de nível "Agência" — todas usam AppLayout completo.
 * Aqui vivem: Home (Hoje/Comparador/Micro-cards), Clientes, Playbook,
 * e as novas features V2 (Pacing, Relatórios, Alertas, AI, Onboarding).
 */
const withAgency = (page: React.ReactNode) => (
  <AgencyRoute>
    <AppLayout>{page}</AppLayout>
  </AgencyRoute>
)

export const agencyRoutes = (
  <>
    {/* Home — Hoje / Comparador / Micro-cards (tabs internos) */}
    <Route path="/_v4/operations" element={withAgency(<V4AgencyOverviewPage />)} />
    <Route path="/dashboard" element={<Navigate to="/_v4/operations" replace />} />
    <Route path="/overview" element={<Navigate to="/_v4/operations" replace />} />

    {/* Workspace da agência — novas features V2 */}
    <Route path="/clients" element={withAgency(<ClientsPage />)} />
    <Route path="/pacing" element={withAgency(<PacingPage />)} />
    <Route path="/reports" element={withAgency(<ReportsPage />)} />
    <Route path="/alerts" element={withAgency(<AlertsPage />)} />
    <Route path="/anomalies" element={withAgency(<AnomaliesPage />)} />
    <Route path="/ai" element={withAgency(<AIChatPage />)} />
    <Route path="/onboarding" element={withAgency(<OnboardingPage />)} />
    <Route path="/playbook" element={withAgency(<V4PlaybookPage />)} />
  </>
)
