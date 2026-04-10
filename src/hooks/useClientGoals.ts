/**
 * ============================================
 * useClientGoals — CRUD for client KPI goals
 * ============================================
 * Reads/writes to public.client_kpi_goals. Goals are keyed by
 * (client_id, kpi_key) and hold the target value + type (meta vs
 * expectativa) + improvement direction.
 *
 * The hook loads all goals for the active client on mount and
 * provides an `upsertGoal` function for inline editing.
 * ============================================
 */

import { useState, useEffect, useCallback } from 'react'
import supabase from '@/lib/supabase'

export interface KpiGoal {
  kpi_key: string
  goal_value: number
  goal_type: 'meta' | 'expectativa'
  improvement_direction: 'higher_better' | 'lower_better'
}

export function useClientGoals(clientId: string | undefined) {
  const [goals, setGoals] = useState<Record<string, KpiGoal>>({})
  const [loading, setLoading] = useState(false)

  // Load goals for this client
  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    setLoading(true)

    ;(async () => {
      const { data, error } = await supabase
        .from('client_kpi_goals')
        .select('kpi_key, goal_value, goal_type, improvement_direction')
        .eq('client_id', clientId)

      if (!cancelled && data && !error) {
        const map: Record<string, KpiGoal> = {}
        for (const row of data) {
          map[row.kpi_key] = row as KpiGoal
        }
        setGoals(map)
      }
      if (!cancelled) setLoading(false)
    })()

    return () => { cancelled = true }
  }, [clientId])

  // Upsert a goal (insert or update)
  const upsertGoal = useCallback(
    async (
      kpiKey: string,
      goalValue: number,
      goalType: 'meta' | 'expectativa' = 'meta',
      direction: 'higher_better' | 'lower_better' = 'higher_better',
    ) => {
      if (!clientId) return

      const { error } = await supabase
        .from('client_kpi_goals')
        .upsert(
          {
            client_id: clientId,
            kpi_key: kpiKey,
            goal_value: goalValue,
            goal_type: goalType,
            improvement_direction: direction,
          },
          { onConflict: 'client_id,kpi_key' },
        )

      if (error) {
        console.error('[useClientGoals] upsert failed:', error.message)
        return
      }

      // Update local state
      setGoals((prev) => ({
        ...prev,
        [kpiKey]: {
          kpi_key: kpiKey,
          goal_value: goalValue,
          goal_type: goalType,
          improvement_direction: direction,
        },
      }))
    },
    [clientId],
  )

  const getGoal = useCallback(
    (kpiKey: string): KpiGoal | undefined => goals[kpiKey],
    [goals],
  )

  return { goals, loading, upsertGoal, getGoal }
}
