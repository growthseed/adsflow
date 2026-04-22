import { ErrorBoundary } from '@/app/ErrorBoundary'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRoutes } from '@/app/routes'

/**
 * Root do app — deliberadamente raso. Toda lógica de routing mora em
 * `src/app/routes/*` e providers em `src/app/providers/*`. Mantenha este
 * arquivo curto; adicione grupos novos de rota em arquivos dedicados.
 */
export default function App() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('adsflow-theme')
    document.documentElement.classList.toggle('dark', saved === 'dark')
  }

  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </ErrorBoundary>
  )
}
