/**
 * Tipos Meta Ads para integração com AdFlow
 * Baseados na validação real de 29/12/2024
 */

// ==========================================
// CAMPAIGN TYPES
// ==========================================

export interface MetaCampaign {
  id: string
  name: string
  objective: MetaCampaignObjective
  status: MetaCampaignStatus
  
  // Budget
  lifetime_budget?: string // centavos
  daily_budget?: string // centavos
  budget_remaining?: string // centavos
  
  // Dates
  created_time?: string
  updated_time?: string
  start_time?: string
  stop_time?: string
  
  // Additional
  special_ad_categories?: string[]
  bid_strategy?: string
}

export type MetaCampaignObjective =
  | 'OUTCOME_APP_PROMOTION'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_SALES'
  | 'OUTCOME_TRAFFIC'

export type MetaCampaignStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'ARCHIVED'

// ==========================================
// AD SET TYPES
// ==========================================

export interface MetaAdSet {
  id: string
  name: string
  status: MetaAdSetStatus
  campaign_id: string
  
  // Optimization
  optimization_goal: string
  billing_event: string
  bid_amount?: string
  
  // Budget
  daily_budget?: string
  lifetime_budget?: string
  
  // Targeting
  targeting?: MetaTargeting
  
  // Dates
  created_time?: string
  updated_time?: string
  start_time?: string
  end_time?: string
}

export type MetaAdSetStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'ARCHIVED'

export interface MetaTargeting {
  geo_locations?: {
    countries?: string[]
    cities?: Array<{
      key: string
      radius?: number
      distance_unit?: 'mile' | 'kilometer'
    }>
    regions?: Array<{ key: string }>
  }
  age_min?: number
  age_max?: number
  genders?: Array<1 | 2> // 1=male, 2=female
  interests?: Array<{ id: string; name?: string }>
  behaviors?: Array<{ id: string; name?: string }>
  custom_audiences?: string[]
}

// ==========================================
// AD TYPES
// ==========================================

export interface MetaAd {
  id: string
  name: string
  status: MetaAdStatus
  adset_id: string
  campaign_id: string
  
  // Creative
  creative: {
    id: string
    name?: string
    object_story_spec?: any
    image_hash?: string
    video_id?: string
  }
  
  // Dates
  created_time?: string
  updated_time?: string
}

export type MetaAdStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'ARCHIVED'
  | 'PENDING_REVIEW'
  | 'DISAPPROVED'
  | 'PREAPPROVED'

// ==========================================
// INSIGHTS TYPES
// ==========================================

export interface MetaInsights {
  campaign_id?: string
  adset_id?: string
  ad_id?: string
  
  date_start: string
  date_stop: string
  
  // Basic metrics
  impressions: string
  reach?: string
  clicks: string
  spend: string
  
  // Calculated metrics
  ctr?: string // Click-Through Rate
  cpm?: string // Cost Per Mille (1000 impressions)
  cpc?: string // Cost Per Click
  cpp?: string // Cost Per Point
  frequency?: string
  
  // Engagement (for OUTCOME_ENGAGEMENT)
  post_engagement?: string
  post_reactions?: string
  post_comments?: string
  post_shares?: string
  
  // Video metrics
  video_thruplay_watched_actions?: Array<{
    action_type: string
    value: string
  }>
  video_p25_watched_actions?: Array<{
    action_type: string
    value: string
  }>
  video_p50_watched_actions?: Array<{
    action_type: string
    value: string
  }>
  video_p75_watched_actions?: Array<{
    action_type: string
    value: string
  }>
  video_p100_watched_actions?: Array<{
    action_type: string
    value: string
  }>
  
  // Conversions
  actions?: Array<{
    action_type: string
    value: string
  }>
  
  // Additional
  objective?: string
  account_id?: string
  account_name?: string
}

// ==========================================
// ACCOUNT TYPES
// ==========================================

export interface MetaAdAccount {
  id: string
  name: string
  account_status: number
  age?: number
  
  // Balance
  balance?: string
  amount_spent?: string
  spend_cap?: string
  
  // Currency
  currency: string
  timezone_name?: string
  timezone_offset_hours_utc?: number
  
  // Capabilities
  capabilities?: string[]
}

// ==========================================
// SYNC TYPES (para AdFlow)
// ==========================================

export interface MetaSyncRequest {
  account_id: string
  campaign_id: string
  include_insights?: boolean
  date_range?: {
    since: string // YYYY-MM-DD
    until: string // YYYY-MM-DD
  }
}

export interface MetaSyncResult {
  success: boolean
  flow_id?: string
  data?: {
    campaign: MetaCampaign
    ad_sets: MetaAdSet[]
    ads: MetaAd[]
    insights?: MetaInsights[]
  }
  error?: string
  stats?: {
    campaigns: number
    ad_sets: number
    ads: number
    nodes_created: number
    edges_created: number
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Converte valores de centavos para reais
 */
export function centsToBRL(cents: string | number): number {
  const value = typeof cents === 'string' ? parseFloat(cents) : cents
  return value / 100
}

/**
 * Converte valores de reais para centavos
 */
export function BRLToCents(brl: number): number {
  return Math.round(brl * 100)
}

/**
 * Formata orçamento para exibição
 */
export function formatBudget(cents: string | number, currency = 'BRL'): string {
  const value = centsToBRL(cents)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency
  }).format(value)
}

/**
 * Formata métricas para exibição
 */
export function formatMetric(
  value: string | number,
  type: 'percentage' | 'currency' | 'number'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  switch (type) {
    case 'percentage':
      return `${numValue.toFixed(2)}%`
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numValue)
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(numValue)
    default:
      return String(numValue)
  }
}

/**
 * Calcula CTR (Click-Through Rate)
 */
export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0
  return (clicks / impressions) * 100
}

/**
 * Calcula CPM (Cost Per Mille)
 */
export function calculateCPM(spend: number, impressions: number): number {
  if (impressions === 0) return 0
  return (spend / impressions) * 1000
}

/**
 * Calcula CPC (Cost Per Click)
 */
export function calculateCPC(spend: number, clicks: number): number {
  if (clicks === 0) return 0
  return spend / clicks
}

/**
 * Traduz objetivo da campanha
 */
export function translateObjective(objective: MetaCampaignObjective): string {
  const translations: Record<MetaCampaignObjective, string> = {
    'OUTCOME_APP_PROMOTION': 'Promoção de App',
    'OUTCOME_AWARENESS': 'Reconhecimento',
    'OUTCOME_ENGAGEMENT': 'Engajamento',
    'OUTCOME_LEADS': 'Leads',
    'OUTCOME_SALES': 'Vendas',
    'OUTCOME_TRAFFIC': 'Tráfego'
  }
  return translations[objective] || objective
}

/**
 * Traduz status da campanha
 */
export function translateStatus(status: MetaCampaignStatus): string {
  const translations: Record<MetaCampaignStatus, string> = {
    'ACTIVE': 'Ativa',
    'PAUSED': 'Pausada',
    'DELETED': 'Deletada',
    'ARCHIVED': 'Arquivada'
  }
  return translations[status] || status
}

/**
 * Valida ID de conta Meta Ads
 */
export function isValidAccountId(accountId: string): boolean {
  return /^act_\d+$/.test(accountId)
}

/**
 * Valida ID de campanha/adset/ad
 */
export function isValidMetaId(id: string): boolean {
  return /^\d+$/.test(id)
}
