export interface StrategyFlow {
  id: string
  workspace_id: string
  project_id?: string
  client_name: string
  phase: 1 | 2 | 3
  
  meta: {
    name: string
    description: string
    period: { start: string; end: string }
    total_budget: number
    objectives: string[]
    non_objectives: string[]
  }
  
  canvas: {
    nodes: StrategyNode[]
    edges: StrategyEdge[]
    viewport: { x: number; y: number; zoom: number }
  }
  
  kpis: {
    expected: KPITarget[]
    actual: KPIActual[]
  }
  
  created_at: string
  updated_at: string
  approved_at?: string
  approved_by?: string
}

export interface StrategyNode {
  id: string
  type: 'traffic_source' | 'campaign' | 'ad_set' | 'ad' | 'audience' | 'result'
  position: { x: number; y: number }
  
  data: {
    label: string
    icon: string
    color: string
    
    platform?: 'meta' | 'google' | 'youtube'
    objective?: string
    
    budget?: {
      daily: number
      monthly: number
      currency: 'BRL'
    }
    
    targeting?: {
      location: string[]
      age_min: number
      age_max: number
      interests: string[]
      job_titles?: string[]
    }
    
    connections?: {
      meta_campaign_id?: string
      meta_adset_id?: string
      meta_ad_id?: string
      google_campaign_id?: string
    }
    
    live_metrics?: LiveMetrics
    
    approval_status?: 'draft' | 'pending' | 'approved' | 'rejected'
    creative_preview_url?: string
  }
}

export interface StrategyEdge {
  id: string
  source: string
  target: string
  type: 'default' | 'step' | 'smoothstep'
  
  data?: {
    label?: string
    flow_rate?: number
    
    metrics?: {
      users_entered: number
      users_converted: number
      conversion_rate: number
    }
  }
}

export interface LiveMetrics {
  impressions: number
  reach: number
  clicks: number
  spend: number
  ctr: number
  cpm: number
  engagement_rate?: number
  thruplay_rate?: number
  last_updated: string
}

export interface KPITarget {
  metric: 'ctr' | 'cpm' | 'engagement' | 'thruplay' | 'reach' | 'spend'
  target_value: number
  target_range?: { min: number; max: number }
  unit: '%' | 'BRL' | 'number'
}

export interface KPIActual {
  metric: 'ctr' | 'cpm' | 'engagement' | 'thruplay' | 'reach' | 'spend'
  current_value: number
  target_value: number
  performance: number
  status: 'above' | 'on_track' | 'below'
  trend: 'up' | 'stable' | 'down'
  last_updated: string
}
