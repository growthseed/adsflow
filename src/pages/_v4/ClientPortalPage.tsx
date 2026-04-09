/**
 * ============================================
 * CLIENT PORTAL PAGE — Sprint 1 (read-only, mobile-first)
 * ============================================
 * Route: /c/:clientSlug/portal
 *
 * This is the first end-client-facing surface in AdFlow. It intentionally
 * has no sidebar, no command palette, no CRM access — just a sticky KPI
 * header and a simplified task timeline. Read-only by product design.
 *
 * Access control (applied in App.tsx, not here):
 *   - globalRole === 'user' + activeClientRole === 'viewer'
 *     → forced to /c/:clientSlug/portal, CANNOT access operational routes
 *   - super_admin / admin / owner / manager
 *     → CAN access for QA / onboarding, full navigation still works
 *
 * The portal shell is rendered inline (no layout wrapper) so we keep
 * the chrome minimal — just an avatar + client name + period label.
 * ============================================
 */

import { useMemo } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import { getClientPortalBundle } from '@/services/clientPortalService'
import MobileKPIHeader from '@/components/ClientPortal/MobileKPIHeader'
import TaskTimeline from '@/components/ClientPortal/TaskTimeline'
import PortalEmptyState from '@/components/ClientPortal/PortalEmptyState'

export default function ClientPortalPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  // Resolve the bundle from the cached snapshots. No async work happens
  // here — it's a synchronous read of JSON data already warmed by the
  // SnapshotWarmer. When Sprint 2 migrates to a live Edge Function this
  // becomes a React Query fetch, but the UI contract stays identical.
  const bundle = useMemo(
    () => (clientSlug ? getClientPortalBundle(clientSlug) : null),
    [clientSlug],
  )

  if (!clientSlug) return <Navigate to="/login" replace />

  const roadmap = bundle?.roadmap
  const kpi = bundle?.kpis ?? null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- MINIMAL HEADER ---------------------------------------- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {(roadmap?.client_name || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {roadmap?.client_name || 'Portal do Cliente'}
              </h1>
              {user?.email && (
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await signOut()
              navigate('/login', { replace: true })
            }}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1"
          >
            Sair
          </button>
        </div>

        {/* --- STICKY KPI STRIP ----------------------------------- */}
        <MobileKPIHeader kpi={kpi} />
      </header>

      {/* --- TASK TIMELINE ----------------------------------------- */}
      <main className="max-w-3xl mx-auto pb-24">
        {roadmap && roadmap.tasks.length > 0 ? (
          <>
            <ProgressBar percentage={roadmap.progress_percentage} />
            <TaskTimeline tasks={roadmap.tasks} />
          </>
        ) : (
          <PortalEmptyState
            title="Nada por aqui ainda"
            description="Seu projeto está começando. Assim que as primeiras entregas forem lançadas, elas aparecem aqui automaticamente."
          />
        )}
      </main>
    </div>
  )
}

// =============================================================
// PROGRESS BAR
// =============================================================

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="px-4 sm:px-6 pt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600">Progresso do projeto</span>
        <span className="text-xs font-semibold tabular-nums text-slate-900">
          {percentage}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
