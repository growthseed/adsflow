import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import LoadingScreen from '@/components/UI/LoadingScreen'
import { publicRoutes } from './publicRoutes'
import { agencyRoutes } from './agencyRoutes'
import { clientRoutes } from './clientRoutes'
import { settingsRoutes } from './settingsRoutes'
import { NotFoundPage } from './lazy'

const PageLoader = () => <LoadingScreen variant="inline" />

/**
 * Compositor central de rotas. Cada grupo vive em seu próprio arquivo
 * e expõe um fragmento de <Route>. A estrutura é pensada pra escalar —
 * conforme features crescem, adicionar novo grupo (ex. adminRoutes).
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {publicRoutes}
        {agencyRoutes}
        {clientRoutes}
        {settingsRoutes}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
