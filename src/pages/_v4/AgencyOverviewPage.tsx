/**
 * Agency Overview — Home V2 (Leva 1)
 * Rota: /_v4/operations
 *
 * Host de 3 views navegáveis:
 *   · Hoje         → hub diário (anomalias, tarefas, metas, agenda)
 *   · Comparador   → seleção de 2-6 clientes lado a lado (Sprint 2)
 *   · Micro-cards  → galeria de KPIs plugáveis (Sprint 3)
 *
 * A view ativa é persistida em ?view=... (deep link) e em localStorage.
 */

import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, GitCompareArrows, LayoutGrid } from 'lucide-react'

import { ViewTabs } from '@/components/primitives'
import type { ViewTabItem } from '@/components/primitives'
import LoadingScreen from '@/components/UI/LoadingScreen'
import { DashboardHoje } from '@/features/dashboard-hoje/DashboardHoje'

const ComparadorView = lazy(() => import('@/features/comparador/ComparadorView'))
const MicroCardsView = lazy(() => import('@/features/microcards/MicroCardsView'))

type ViewKey = 'hoje' | 'comparador' | 'cards'
const LS_KEY = 'adsflow:home:view'
const validKeys: ViewKey[] = ['hoje', 'comparador', 'cards']

function readStoredView(): ViewKey {
  if (typeof window === 'undefined') return 'hoje'
  const stored = window.localStorage.getItem(LS_KEY)
  return stored && (validKeys as string[]).includes(stored) ? (stored as ViewKey) : 'hoje'
}

export default function AgencyOverviewPage() {
  const [search, setSearch] = useSearchParams()
  const urlView = search.get('view') as ViewKey | null
  const initial: ViewKey =
    urlView && (validKeys as string[]).includes(urlView) ? urlView : readStoredView()
  const [view, setView] = useState<ViewKey>(initial)

  useEffect(() => {
    window.localStorage.setItem(LS_KEY, view)
    if (search.get('view') !== view) {
      const next = new URLSearchParams(search)
      next.set('view', view)
      setSearch(next, { replace: true })
    }
  }, [view, search, setSearch])

  const tabs = useMemo<ViewTabItem<ViewKey>[]>(
    () => [
      { key: 'hoje', label: 'Hoje', icon: <CalendarClock size={14} /> },
      { key: 'comparador', label: 'Comparador', icon: <GitCompareArrows size={14} /> },
      { key: 'cards', label: 'Micro-cards', icon: <LayoutGrid size={14} /> },
    ],
    [],
  )

  const handleChange = useCallback((k: ViewKey) => setView(k), [])

  return (
    <div className="min-h-screen">
      <div className="max-w-layout mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <ViewTabs items={tabs} value={view} onChange={handleChange} ariaLabel="Views da Home" />
      </div>
      <div className="max-w-layout mx-auto px-4 sm:px-6 pb-8">
        <Suspense fallback={<LoadingScreen variant="inline" />}>
          {view === 'hoje' && <DashboardHoje />}
          {view === 'comparador' && <ComparadorView />}
          {view === 'cards' && <MicroCardsView />}
        </Suspense>
      </div>
    </div>
  )
}
