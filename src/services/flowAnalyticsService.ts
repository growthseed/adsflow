/**
 * FLOW ANALYTICS SERVICE
 * Efeito Digital - Ads Flow
 *
 * Funnelytics intelligence: node metrics, goals (meta vs realizado),
 * edge metrics and drop-off rates for the Flow Editor.
 */

import supabase from '@/lib/supabase'

// =====================================================
// TYPES
// =====================================================

export interface DateRange {
  from: string // ISO date 'YYYY-MM-DD'
  to: string
}

export interface NodeMetrics {
  flow_id: string
  node_id: string
  date: string
  visits: number
  unique_visitors: number
  leads: number
  conversions: number
  revenue: number
  bounce_rate: number
  avg_time_seconds: number
  source_meta: number
  source_google: number
  source_organic: number
  source_direct: number
  source_other: number
}

export interface NodeGoal {
  id: string
  flow_id: string
  node_id: string
  client_id: string | null
  metric: string
  target_value: number
  period: string
}

export interface EdgeMetrics {
  flow_id: string
  source_node_id: string
  target_node_id: string
  date: string
  transitions: number
  drop_offs: number
  conversion_rate: number
}

export interface NodePerformance {
  flow_id: string
  node_id: string
  client_id: string | null
  total_visits: number
  total_unique: number
  total_leads: number
  total_conversions: number
  total_revenue: number
  avg_bounce_rate: number
  goal_value: number | null
  goal_metric: string | null
  actual_value: number
  goal_percentage: number
}

export interface AggregatedNodeMetrics {
  node_id: string
  visits: number
  unique_visitors: number
  leads: number
  conversions: number
  revenue: number
  bounce_rate: number
}

export interface DropOffData {
  source_node_id: string
  target_node_id: string
  total_transitions: number
  total_drop_offs: number
  drop_off_rate: number
}

// =====================================================
// SERVICE METHODS
// =====================================================

/**
 * Fetch node metrics for a specific node within a date range.
 */
export async function getNodeMetrics(
  flowId: string,
  nodeId: string,
  dateRange: DateRange
): Promise<NodeMetrics[]> {
  const { data, error } = await supabase
    .from('flow_node_metrics')
    .select('*')
    .eq('flow_id', flowId)
    .eq('node_id', nodeId)
    .gte('date', dateRange.from)
    .lte('date', dateRange.to)
    .order('date', { ascending: false })

  if (error) {
    console.error('[flowAnalytics] getNodeMetrics error:', error)
    return []
  }
  return (data as NodeMetrics[]) || []
}

/**
 * Fetch all goals for a given node.
 */
export async function getNodeGoals(
  flowId: string,
  nodeId: string
): Promise<NodeGoal[]> {
  const { data, error } = await supabase
    .from('flow_node_goals')
    .select('*')
    .eq('flow_id', flowId)
    .eq('node_id', nodeId)

  if (error) {
    console.error('[flowAnalytics] getNodeGoals error:', error)
    return []
  }
  return (data as NodeGoal[]) || []
}

/**
 * Upsert a goal for a node (insert or update on conflict).
 */
export async function setNodeGoal(
  flowId: string,
  nodeId: string,
  metric: string,
  targetValue: number,
  period: string = 'monthly',
  clientId?: string
): Promise<NodeGoal | null> {
  const { data, error } = await supabase
    .from('flow_node_goals')
    .upsert(
      {
        flow_id: flowId,
        node_id: nodeId,
        metric,
        target_value: targetValue,
        period,
        client_id: clientId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'flow_id,node_id,metric' }
    )
    .select()
    .single()

  if (error) {
    console.error('[flowAnalytics] setNodeGoal error:', error)
    return null
  }
  return data as NodeGoal
}

/**
 * Delete a specific goal.
 */
export async function deleteNodeGoal(goalId: string): Promise<boolean> {
  const { error } = await supabase
    .from('flow_node_goals')
    .delete()
    .eq('id', goalId)

  if (error) {
    console.error('[flowAnalytics] deleteNodeGoal error:', error)
    return false
  }
  return true
}

/**
 * Fetch all edge metrics for a flow within a date range.
 */
export async function getEdgeMetrics(
  flowId: string,
  dateRange: DateRange
): Promise<EdgeMetrics[]> {
  const { data, error } = await supabase
    .from('flow_edge_metrics')
    .select('*')
    .eq('flow_id', flowId)
    .gte('date', dateRange.from)
    .lte('date', dateRange.to)
    .order('date', { ascending: false })

  if (error) {
    console.error('[flowAnalytics] getEdgeMetrics error:', error)
    return []
  }
  return (data as EdgeMetrics[]) || []
}

/**
 * Fetch performance data from vw_flow_node_performance view.
 */
export async function getFlowPerformance(
  flowId: string,
  _dateRange?: DateRange
): Promise<NodePerformance[]> {
  const { data, error } = await supabase
    .from('vw_flow_node_performance')
    .select('*')
    .eq('flow_id', flowId)

  if (error) {
    console.error('[flowAnalytics] getFlowPerformance error:', error)
    return []
  }
  return (data as NodePerformance[]) || []
}

/**
 * Calculate drop-off rates between connected nodes.
 * Aggregates edge metrics over the date range and computes drop-off percentage.
 */
export async function getDropOffRates(
  flowId: string,
  dateRange: DateRange
): Promise<DropOffData[]> {
  const edgeMetrics = await getEdgeMetrics(flowId, dateRange)

  // Aggregate by source-target pair
  const aggregated = new Map<string, { transitions: number; dropOffs: number }>()

  for (const em of edgeMetrics) {
    const key = `${em.source_node_id}::${em.target_node_id}`
    const existing = aggregated.get(key) || { transitions: 0, dropOffs: 0 }
    existing.transitions += em.transitions
    existing.dropOffs += em.drop_offs
    aggregated.set(key, existing)
  }

  const result: DropOffData[] = []
  for (const [key, value] of aggregated.entries()) {
    const [source, target] = key.split('::')
    const total = value.transitions + value.dropOffs
    result.push({
      source_node_id: source,
      target_node_id: target,
      total_transitions: value.transitions,
      total_drop_offs: value.dropOffs,
      drop_off_rate: total > 0 ? Math.round((value.dropOffs / total) * 100 * 10) / 10 : 0,
    })
  }

  return result
}

/**
 * Fetch aggregated metrics for ALL nodes in a flow (summed over date range).
 * Used by NodeStatsOverlay to show mini stats on every node.
 */
export async function getFlowNodeMetricsAggregated(
  flowId: string,
  dateRange: DateRange
): Promise<AggregatedNodeMetrics[]> {
  const { data, error } = await supabase
    .from('flow_node_metrics')
    .select('*')
    .eq('flow_id', flowId)
    .gte('date', dateRange.from)
    .lte('date', dateRange.to)

  if (error) {
    console.error('[flowAnalytics] getFlowNodeMetricsAggregated error:', error)
    return []
  }

  // Aggregate per node
  const byNode = new Map<string, AggregatedNodeMetrics>()

  for (const row of (data || []) as NodeMetrics[]) {
    const existing = byNode.get(row.node_id) || {
      node_id: row.node_id,
      visits: 0,
      unique_visitors: 0,
      leads: 0,
      conversions: 0,
      revenue: 0,
      bounce_rate: 0,
    }
    existing.visits += row.visits || 0
    existing.unique_visitors += row.unique_visitors || 0
    existing.leads += row.leads || 0
    existing.conversions += row.conversions || 0
    existing.revenue += Number(row.revenue) || 0
    existing.bounce_rate = row.bounce_rate || existing.bounce_rate
    byNode.set(row.node_id, existing)
  }

  return Array.from(byNode.values())
}

// =====================================================
// DEFAULT EXPORT
// =====================================================

const flowAnalyticsService = {
  getNodeMetrics,
  getNodeGoals,
  setNodeGoal,
  deleteNodeGoal,
  getEdgeMetrics,
  getFlowPerformance,
  getDropOffRates,
  getFlowNodeMetricsAggregated,
}

export default flowAnalyticsService
