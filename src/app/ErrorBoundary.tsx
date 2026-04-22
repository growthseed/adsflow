import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Captura erros de render de React e mostra tela de fallback.
 * Log vai no console; integração com Sentry/similar fica pra depois.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error:', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-error-100 grid place-items-center text-error-600">
            <AlertTriangle size={26} strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Ops! Algo deu errado</h1>
          <p className="text-neutral-600 mb-4">Ocorreu um erro inesperado na aplicação.</p>
          <pre className="bg-neutral-100 p-4 rounded-lg text-left text-xs text-error-600 overflow-auto max-h-32 mb-4">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Recarregar página
          </button>
        </div>
      </div>
    )
  }
}
