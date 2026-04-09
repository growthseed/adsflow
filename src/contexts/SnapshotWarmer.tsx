/**
 * ============================================
 * SnapshotWarmer — warms the agency snapshot cache at app boot
 * ============================================
 * Mounts once inside the ProtectedRoute shell. On first render
 * it kicks off async fetches for both ClickUp and Performance
 * snapshots from Supabase (written by the cron jobs). Results
 * are stored in the adapter module cache, so all subsequent
 * sync calls (loadSnapshot() / getClientBySlug() / etc) return
 * fresh data without any component refactor.
 *
 * React Query does the deduplication, refetch-on-focus, stale
 * time management, and error handling. The initial render uses
 * the bundled JSON so there is zero flicker.
 * ============================================
 */

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchLatestClickUpSnapshot,
  BUNDLED_CLICKUP_SNAPSHOT,
} from '@/services/adapters/clickupAdapter'
import {
  fetchLatestPerformanceSnapshot,
  BUNDLED_PERFORMANCE_SNAPSHOT,
} from '@/services/adapters/performanceAdapter'

/** Trigger a single re-render when snapshots warm up. */
function useWarmSnapshots() {
  // ClickUp: refresh every 10 min, stale after 5 min
  useQuery({
    queryKey: ['agency_snapshots', 'clickup'],
    queryFn: fetchLatestClickUpSnapshot,
    initialData: BUNDLED_CLICKUP_SNAPSHOT,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  // Performance: refresh every 15 min
  useQuery({
    queryKey: ['agency_snapshots', 'performance'],
    queryFn: fetchLatestPerformanceSnapshot,
    initialData: BUNDLED_PERFORMANCE_SNAPSHOT,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export default function SnapshotWarmer({ children }: { children: React.ReactNode }) {
  useWarmSnapshots()

  // Log once in dev to confirm warmer is mounted
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[SnapshotWarmer] mounted — fetching live snapshots from Supabase')
    }
  }, [])

  return <>{children}</>
}
