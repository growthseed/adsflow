import { useCallback, useEffect, useRef, useState } from 'react'

import { supabase } from '@/lib/supabase'
import {
  BUNDLED_CLICKUP_SNAPSHOT,
  fetchLatestClickUpSnapshot,
} from '@/services/adapters/clickupAdapter'
import type { AgencySnapshot } from '@/services/adapters/clickupTypes'

interface UseLiveSnapshot {
  snapshot: AgencySnapshot
  capturedAt: Date
  loading: boolean
  refreshing: boolean
  /** Força re-fetch imediato (botão "Atualizar agora") */
  refresh: () => Promise<void>
  /** Dispara /api/sync/clickup com a sessao de um administrador ativo. */
  forceResync: () => Promise<{ ok: boolean; detail?: string }>
}

/**
 * Hook de snapshot ClickUp "live":
 *   1. Monta e busca o snapshot mais novo de `agency_snapshots`
 *   2. Escuta Realtime do Supabase — novo insert → refresh automático
 *   3. Re-busca quando a aba volta a ficar visível (focus)
 *   4. Expõe `forceResync()` que chama o endpoint de sync pra puxar
 *      direto da API do ClickUp agora.
 */
export function useLiveClickUpSnapshot(): UseLiveSnapshot {
  const [snapshot, setSnapshot] = useState<AgencySnapshot>(BUNDLED_CLICKUP_SNAPSHOT)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const fresh = await fetchLatestClickUpSnapshot()
      if (mounted.current) setSnapshot(fresh)
    } finally {
      if (mounted.current) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    ;(async () => {
      try {
        const fresh = await fetchLatestClickUpSnapshot()
        if (mounted.current) setSnapshot(fresh)
      } finally {
        if (mounted.current) setLoading(false)
      }
    })()

    // Realtime — novo snapshot insert → refresh
    const channel = supabase
      .channel('agency_snapshots:clickup')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agency_snapshots', filter: 'kind=eq.clickup' },
        () => {
          void refresh()
        },
      )
      .subscribe()

    // Re-fetch quando tab volta ao foco
    const onFocus = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      mounted.current = false
      document.removeEventListener('visibilitychange', onFocus)
      supabase.removeChannel(channel)
    }
  }, [refresh])

  /**
   * Chama `/api/sync/clickup` para forçar sync imediato (gestor clica
   * "Atualizar agora"). Requer sessao de administrador ativo.
   */
  const forceResync = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      const resp = await fetch('/api/sync/clickup', {
        method: 'POST',
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      })
      if (!resp.ok) {
        const body = await resp.text().catch(() => '')
        return { ok: false, detail: body.slice(0, 200) || `HTTP ${resp.status}` }
      }
      await refresh()
      return { ok: true }
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : String(e) }
    }
  }, [refresh])

  return {
    snapshot,
    capturedAt: new Date(snapshot.captured_at),
    loading,
    refreshing,
    refresh,
    forceResync,
  }
}
