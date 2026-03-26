/**
 * GOALS SERVICE
 * Efeito Digital - Ads Flow
 *
 * Service layer para Controle de Metas (Goals).
 * CRUD de metas, snapshots de progresso, timeline de marketing.
 */

import supabase from '@/lib/supabase'

// =====================================================
// TYPES
// =====================================================

export interface MetricGoal {
  id: string
  client_id: string
  metric: string
  platform: string | null
  target_value: number
  period: string
  alert_threshold_pct: number
  alert_enabled: boolean
  alert_email: boolean
  alert_whatsapp: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GoalSnapshot {
  id: string
  goal_id: string
  client_id: string
  date: string
  actual_value: number
  target_value: number
  progress_pct: number
  created_at: string
}

export interface TimelineEvent {
  id: string
  client_id: string
  title: string
  description: string | null
  type: string
  date: string
  created_by: string | null
  created_at: string
}

export interface GoalWithProgress extends MetricGoal {
  current_value: number
  progress_pct: number
  trend: number // % change vs previous period
  snapshots: GoalSnapshot[]
}

export type CreateGoalData = Pick<
  MetricGoal,
  'client_id' | 'metric' | 'platform' | 'target_value' | 'period' | 'alert_threshold_pct' | 'alert_enabled' | 'alert_email' | 'alert_whatsapp'
> & { created_by?: string }

export type UpdateGoalData = Partial<
  Pick<MetricGoal, 'target_value' | 'period' | 'alert_threshold_pct' | 'alert_enabled' | 'alert_email' | 'alert_whatsapp'>
>

export type CreateTimelineData = Pick<TimelineEvent, 'client_id' | 'title' | 'description' | 'type' | 'date'> & {
  created_by?: string
}

// =====================================================
// GOALS CRUD
// =====================================================

export const goalsService = {
  /**
   * List all goals for a client
   */
  async getGoals(clientId: string): Promise<MetricGoal[]> {
    const { data, error } = await supabase
      .from('client_metric_goals')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar metas:', error)
      throw error
    }
    return (data || []) as MetricGoal[]
  },

  /**
   * Create a new goal
   */
  async createGoal(goalData: CreateGoalData): Promise<MetricGoal> {
    const { data, error } = await supabase
      .from('client_metric_goals')
      .insert(goalData)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar meta:', error)
      throw error
    }
    return data as MetricGoal
  },

  /**
   * Update an existing goal
   */
  async updateGoal(id: string, updates: UpdateGoalData): Promise<MetricGoal> {
    const { data, error } = await supabase
      .from('client_metric_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar meta:', error)
      throw error
    }
    return data as MetricGoal
  },

  /**
   * Delete a goal
   */
  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase
      .from('client_metric_goals')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir meta:', error)
      throw error
    }
  },

  /**
   * Get goal progress (snapshots) for a date range
   */
  async getGoalProgress(
    goalId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<GoalSnapshot[]> {
    const { data, error } = await supabase
      .from('goal_snapshots')
      .select('*')
      .eq('goal_id', goalId)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('date', { ascending: true })

    if (error) {
      console.error('Erro ao carregar progresso:', error)
      throw error
    }
    return (data || []) as GoalSnapshot[]
  },

  /**
   * Get all goals with current progress vs target (summary)
   */
  async getGoalsSummary(clientId: string): Promise<GoalWithProgress[]> {
    const goals = await this.getGoals(clientId)

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0]
    const today = now.toISOString().split('T')[0]

    // previous month for trend
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0]
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split('T')[0]

    const results: GoalWithProgress[] = []

    for (const goal of goals) {
      // Current period snapshots
      const snapshots = await this.getGoalProgress(goal.id, firstOfMonth, today)
      const latestSnapshot = snapshots[snapshots.length - 1]
      const currentValue = latestSnapshot?.actual_value || 0
      const progressPct =
        goal.target_value > 0 ? (currentValue / goal.target_value) * 100 : 0

      // Previous period for trend
      const prevSnapshots = await this.getGoalProgress(
        goal.id,
        prevStart,
        prevEnd
      )
      const prevLatest = prevSnapshots[prevSnapshots.length - 1]
      const prevValue = prevLatest?.actual_value || 0
      const trend =
        prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0

      results.push({
        ...goal,
        current_value: currentValue,
        progress_pct: Math.round(progressPct * 10) / 10,
        trend: Math.round(trend * 10) / 10,
        snapshots,
      })
    }

    return results
  },

  // =====================================================
  // TIMELINE
  // =====================================================

  /**
   * Add a timeline event / milestone
   */
  async addTimelineEvent(data: CreateTimelineData): Promise<TimelineEvent> {
    const { data: result, error } = await supabase
      .from('marketing_timeline')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar evento na timeline:', error)
      throw error
    }
    return result as TimelineEvent
  },

  /**
   * Get timeline events for a client in a date range
   */
  async getTimeline(
    clientId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<TimelineEvent[]> {
    let query = supabase
      .from('marketing_timeline')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })

    if (dateFrom) query = query.gte('date', dateFrom)
    if (dateTo) query = query.lte('date', dateTo)

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar timeline:', error)
      throw error
    }
    return (data || []) as TimelineEvent[]
  },

  /**
   * Delete a timeline event
   */
  async deleteTimelineEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('marketing_timeline')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir evento:', error)
      throw error
    }
  },
}
