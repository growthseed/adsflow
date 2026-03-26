/**
 * ============================================
 * SHARED DASHBOARD PAGE — Client Portal
 * ============================================
 * Public page accessible via /share/:token.
 * No authentication required.
 * Renders a dashboard in read-only mode.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react'
import supabase from '@/lib/supabase'
import type { Dashboard } from '@/types/dashboard'
import { DashboardGrid } from '@/components/DashboardBuilder'

// =====================================================
// MAIN PAGE
// =====================================================

export default function SharedDashboardPage() {
  const { token } = useParams<{ token: string }>()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token inválido.')
      setLoading(false)
      return
    }

    const fetchDashboard = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('dashboards')
          .select('*, widgets:dashboard_widgets(*)')
          .eq('share_token', token)
          .eq('is_public', true)
          .single()

        if (dbError || !data) {
          setError('Dashboard não encontrado ou link expirado.')
          return
        }

        setDashboard(data as Dashboard)
      } catch {
        setError('Erro ao carregar dashboard.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [token])

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Dashboard indisponível</h1>
          <p className="text-slate-500 mb-6">
            {error || 'Este link pode ter expirado ou o dashboard foi removido.'}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Ads Flow</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Render Dashboard ──
  const clientName = (dashboard as Dashboard & { client?: { name?: string; logo_url?: string } })
    ?.client?.name

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: branding */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900">
                  {dashboard.name}
                </span>
                {clientName && (
                  <span className="text-xs text-slate-400 ml-2">
                    — {clientName}
                  </span>
                )}
              </div>
            </div>

            {/* Right: powered by */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Powered by</span>
              <span className="font-semibold text-blue-600">Ads Flow</span>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Description */}
        {dashboard.description && (
          <p className="text-sm text-slate-500 mb-4">{dashboard.description}</p>
        )}

        {/* Grid (read-only) */}
        {dashboard.widgets && dashboard.widgets.length > 0 ? (
          <DashboardGrid
            widgets={dashboard.widgets}
            layouts={dashboard.layout as Record<string, unknown>}
            globalFilters={dashboard.global_filters}
            editing={false}
            onLayoutChange={() => {}}
          />
        ) : (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-700 mb-1">
              Dashboard vazio
            </h2>
            <p className="text-sm text-slate-400">
              Este dashboard ainda não possui widgets configurados.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dashboard compartilhado via Ads Flow</span>
            <span className="mx-1">·</span>
            <span>Efeito Digital</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
