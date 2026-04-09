/**
 * ============================================
 * PERFORMANCE ADAPTER — types
 * ============================================
 * Normalized shapes for Google Ads + Meta Ads performance data.
 * The AdFlow Performance module consumes only these types; raw
 * responses from the MCP servers are parsed in performanceAdapter.ts.
 *
 * Same architectural pattern as clickupAdapter:
 *   MCP fetch → snapshot JSON → adapter → UI
 * ============================================
 */

export type AdPlatform = 'meta_ads' | 'google_ads'

export type CampaignStatus = 'enabled' | 'paused' | 'removed' | 'learning' | 'limited'

/** Core metrics shared by both platforms */
export interface CampaignMetrics {
  impressions: number
  clicks: number
  spend: number
  conversions: number
  conversion_value: number
  ctr: number            // percent (0-100 or 0-1? we store 0-1)
  cpc: number
  cpm: number
  cost_per_conversion: number
  roas: number
}

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  status_raw: string
  platform: AdPlatform
  objective?: string
  campaign_type?: string // PMAX, SEARCH, DISPLAY, LEAD_GENERATION, etc
  start_date?: string
  end_date?: string
  budget_daily?: number
  budget_lifetime?: number
  metrics: CampaignMetrics
}

/** Daily breakdown for time-series charts */
export interface DailyMetric {
  date: string // ISO YYYY-MM-DD
  impressions: number
  clicks: number
  spend: number
  conversions: number
  reach?: number
  ctr: number
  cpc: number
  cpm: number
}

/** Account-level snapshot for one platform */
export interface PlatformAccount {
  platform: AdPlatform
  account_id: string
  account_name: string
  currency: string
  timezone?: string
  connected: boolean
  last_synced_at: string
  /** Aggregated metrics for the period */
  summary: CampaignMetrics & {
    reach?: number
    frequency?: number
    active_campaigns: number
    total_campaigns: number
  }
  /** Campaigns under this account */
  campaigns: Campaign[]
  /** Daily breakdown for line/area charts */
  daily: DailyMetric[]
}

/** Complete performance snapshot for one agency client */
export interface ClientPerformance {
  client_slug: string
  client_name: string
  period: {
    from: string
    to: string
    label: string
  }
  platforms: {
    meta_ads?: PlatformAccount
    google_ads?: PlatformAccount
  }
  /** Blended (cross-platform) aggregate */
  blended: {
    total_spend: number
    total_impressions: number
    total_clicks: number
    total_conversions: number
    total_reach: number
    avg_ctr: number
    avg_cpc: number
    avg_cpm: number
    cost_per_conversion: number
    roas: number
  }
  last_synced_at: string
}

export interface PerformanceSnapshot {
  captured_at: string
  period: {
    from: string
    to: string
    label: string
  }
  /** Keyed by client_slug */
  clients: Record<string, ClientPerformance>
}
