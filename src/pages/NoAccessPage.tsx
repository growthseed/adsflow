/**
 * NO ACCESS PAGE
 * Efeito Digital - Ads Flow
 *
 * Destino terminal (NÃO envolto em PublicRoute) para um usuário autenticado
 * cujo cliente/role não pôde ser resolvido — seja porque a conta realmente
 * não está vinculada a nenhum cliente, seja porque o fetch de profile/
 * memberships deu timeout. Antes disso não existia — os guards mandavam
 * esse caso para /login, que por sua vez manda usuário autenticado de volta
 * para /dashboard, formando um loop de redirect infinito (ver AgencyRoute,
 * PortalRoute, ClientContextGuard).
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, RotateCw, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function NoAccessPage() {
  const { signOut, refreshSession } = useAuth()
  const navigate = useNavigate()
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  const retryAccess = async () => {
    setRetrying(true)
    setRetryError(null)
    try {
      await refreshSession()
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.warn('[NoAccessPage] access retry failed:', error)
      setRetryError('A sessão expirou ou o servidor ainda não respondeu. Entre novamente para continuar.')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Não foi possível carregar seu acesso</h1>
        <p className="text-slate-500 mb-8">
          Sua conta pode não estar vinculada a nenhum cliente ainda, ou a conexão com o
          servidor demorou para responder. Tente novamente ou fale com o administrador
          da agência.
        </p>
        {retryError && <p role="alert" className="mb-4 text-sm text-red-600">{retryError}</p>}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={retryAccess}
            disabled={retrying}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-lg hover:bg-[var(--color-brand-700)]"
          >
            <RotateCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Consultando...' : 'Tentar novamente'}
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
