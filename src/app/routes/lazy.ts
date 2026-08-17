/**
 * Centralized lazy-loaded page imports with chunk-retry.
 * Mantém todos os `React.lazy` em um único lugar — evita poluir App.tsx
 * e facilita code-splitting analítico.
 */

import { lazy } from 'react'
import type { ComponentType } from 'react'

type Importer = () => Promise<{ default: ComponentType }>

function lazyRetry(factory: Importer, retries = 2) {
  // Importante: `lazy()` só pode ser chamado UMA vez por componente — o
  // retry precisa reexecutar `factory()` (o import puro) e resolver com o
  // MESMO formato `{ default: Component }`, nunca com outro `lazy(...)`.
  // Bug anterior: o catch resolvia com `lazyRetry(...)` (um componente lazy,
  // objeto `{ $$typeof: Symbol(react.lazy), ... }`) em vez de um módulo —
  // React então derrubava com "lazy: Expected the result of a dynamic
  // import() call. Instead received: [object Object]" a cada retry.
  function importWithRetry(attemptsLeft: number): Promise<{ default: ComponentType }> {
    return factory().catch((err) => {
      if (attemptsLeft > 0) {
        return new Promise<{ default: ComponentType }>((resolve, reject) => {
          setTimeout(() => {
            importWithRetry(attemptsLeft - 1).then(resolve, reject)
          }, 500)
        })
      }
      window.location.reload()
      throw err
    })
  }

  return lazy(() => importWithRetry(retries))
}

/* Publicas */
export const LandingPage = lazyRetry(() => import('@/pages/LandingPage'))
export const LoginPage = lazyRetry(() => import('@/pages/LoginPage'))
export const PrivacyPage = lazyRetry(() => import('@/pages/PrivacyPage'))
export const TermsPage = lazyRetry(() => import('@/pages/TermsPage'))
export const NotFoundPage = lazyRetry(() => import('@/pages/NotFoundPage'))
export const NoAccessPage = lazyRetry(() => import('@/pages/NoAccessPage'))
export const AuthCallbackPage = lazyRetry(() => import('@/pages/AuthCallbackPage'))

/* Configuracoes da agencia */
export const IntegrationsPage = lazyRetry(() => import('@/pages/IntegrationsPage'))
export const ClientsPage = lazyRetry(() => import('@/pages/ClientsPage'))
export const TeamPage = lazyRetry(() => import('@/pages/TeamPage'))
export const SettingsPage = lazyRetry(() => import('@/pages/SettingsPage'))
export const AdminPage = lazyRetry(() => import('@/pages/AdminPage'))
export const BillingPage = lazyRetry(() => import('@/pages/BillingPage'))

/* v4 nucleo da agencia e clientes */
export const V4DesignSystemPage = lazyRetry(() => import('@/pages/_v4/DesignSystemPage'))
export const V4AgencyOverviewPage = lazyRetry(() => import('@/pages/_v4/AgencyOverviewPage'))
export const V4ClientOverviewPage = lazyRetry(() => import('@/pages/_v4/ClientOverviewPage'))
export const V4ClientProjectPage = lazyRetry(() => import('@/pages/_v4/ClientProjectPage'))
export const V4ClientPerformancePage = lazyRetry(() => import('@/pages/_v4/ClientPerformancePage'))
export const V4ClientPlannerPage = lazyRetry(() => import('@/pages/_v4/ClientPlannerPage'))
export const V4PublicFlowPage = lazyRetry(() => import('@/pages/_v4/PublicFlowPage'))
export const V4PlaybookPage = lazyRetry(() => import('@/pages/_v4/PlaybookPage'))
export const V4ClientPortalPage = lazyRetry(() => import('@/pages/_v4/ClientPortalPage'))
export const V4ClientRootRedirect = lazyRetry(() => import('@/pages/_v4/ClientRootRedirect'))
export const V4PublicClientPortalPage = lazyRetry(() => import('@/pages/_v4/PublicClientPortalPage'))
export const V4PublicClientPortalV3Page = lazyRetry(() => import('@/pages/_v4/PublicClientPortalV3Page'))
export const V4CrmFunnelPage = lazyRetry(() => import('@/pages/_v4/CrmFunnelPage'))
export const V4CrmLossesPage = lazyRetry(() => import('@/pages/_v4/CrmLossesPage'))
export const V4MetaAdsPage = lazyRetry(() => import('@/pages/_v4/MetaAdsPage'))

/* V2 novas features (Levas 1-4) */
export const PacingPage = lazyRetry(() => import('@/features/pacing/PacingPage'))
export const ReportsPage = lazyRetry(() => import('@/features/reports/ReportsPage'))
export const AlertsPage = lazyRetry(() => import('@/features/alerts/AlertsPage'))
export const AIChatPage = lazyRetry(() => import('@/features/ai-chat/AIChatPage'))
export const OnboardingPage = lazyRetry(() => import('@/features/onboarding/OnboardingPage'))
export const AnomaliesPage = lazyRetry(() => import('@/features/dashboard-hoje/AnomaliesPage'))
