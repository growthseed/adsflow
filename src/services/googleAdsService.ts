/**
 * ============================================
 * GOOGLE ADS SERVICE — API + Sync + Queries
 * ============================================
 * Integrates with Google Ads API via direct Vercel proxy (/api/google-ads)
 * with automatic fallback to N8N if the Vercel route is unavailable.
 *
 * Flow (primary):  Frontend → /api/google-ads → Google Ads REST API
 * Flow (fallback): Frontend → N8N Webhook → Google Ads API → N8N
 * Storage: Results upserted to Supabase google_ads_* tables
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase'
import { googleAuthService } from './googleAuthService'

// =====================================================
// CONFIG
// =====================================================

const N8N_BASE_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL ||
  'https://ia-kommo-n8n.xl78rn.easypanel.host/webhook'

/** Vercel serverless API route — direct Google Ads proxy */
const VERCEL_API_URL = `${window.location.origin}/api/google-ads`

/** Use direct API by default, set to false to force N8N */
const USE_DIRECT_API = import.meta.env.VITE_GOOGLE_ADS_DIRECT !== 'false'

// =====================================================
// TYPES
// =====================================================

export type GoogleAdsCampaignType =
  | 'SEARCH'
  | 'DISPLAY'
  | 'VIDEO'
  | 'SHOPPING'
  | 'PERFORMANCE_MAX'
  | 'DISCOVERY'

export interface GoogleAdsCampaign {
  campaign_id: string
  campaign_name: string
  campaign_type: GoogleAdsCampaignType
  status: string
  budget_amount: number | null
  budget_type: string | null
  bidding_strategy: string | null
  start_date: string | null
  end_date: string | null
}

export interface GoogleAdsInsight {
  campaign_id: string
  date: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversion_value: number
  ctr: number
  avg_cpc: number
  avg_cpm: number
  impression_share: number | null
  search_impression_share: number | null
  search_budget_lost_is: number | null
  search_rank_lost_is: number | null
  all_conversions: number
  view_through_conversions: number
  interaction_rate: number
  video_views: number
  video_view_rate: number
  cost_per_conversion: number
  roas: number
}

export interface GoogleAdsKeyword {
  campaign_id: string
  ad_group_id: string
  ad_group_name: string
  keyword_text: string
  match_type: string
  quality_score: number | null
  expected_ctr_score: string | null
  ad_relevance_score: string | null
  landing_page_score: string | null
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
  avg_cpc: number
  avg_position: number | null
  date: string
}

export interface GoogleAdsAggregatedMetrics {
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversion_value: number
  ctr: number
  avg_cpc: number
  avg_cpm: number
  roas: number
  impression_share: number | null
  search_impression_share: number | null
  video_views: number
  cost_per_conversion: number
}

export interface DateRange {
  since: string  // YYYY-MM-DD
  until: string  // YYYY-MM-DD
}

// =====================================================
// API CALLS — Direct (/api/google-ads) with N8N fallback
// =====================================================

/**
 * Call the Vercel serverless proxy first; fall back to N8N if unavailable.
 *
 * Since the security hardening of 2026-04-09, the Vercel proxy requires a
 * Supabase JWT (Authorization bearer) AND a `client_slug` in the body for any
 * tenant-scoped action. OAuth bootstrap actions (`exchange`, `refresh`) only
 * need the JWT.
 */
async function callGoogleAdsApi<T>(
  action: string,
  payload: Record<string, unknown>,
  n8nEndpoint: string,
): Promise<T> {
  // --- Primary: Vercel direct API ---
  if (USE_DIRECT_API) {
    try {
      // Grab the current Supabase session JWT. If the user isn't signed in we
      // skip the direct route entirely and fall back to N8N.
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        throw new Error('no-supabase-session')
      }

      const response = await fetch(VERCEL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action, ...payload }),
      })

      if (response.ok) {
        return response.json()
      }

      // If 500 with "not configured", fall through to N8N
      const errText = await response.text().catch(() => '')
      if (!errText.includes('not configured')) {
        throw new Error(`Google Ads API (${response.status}): ${errText}`)
      }
    } catch (err) {
      // Network error or missing session → try N8N fallback
      console.warn('[googleAdsService] Direct API unavailable, falling back to N8N:', err)
    }
  }

  // --- Fallback: N8N proxy ---
  const response = await fetch(`${N8N_BASE_URL}${n8nEndpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error')
    throw new Error(`Google Ads N8N fetch failed: ${error}`)
  }

  return response.json()
}

/**
 * Fetch campaigns from Google Ads API
 */
export async function listCampaigns(
  accountId: string,
  accessToken: string,
): Promise<GoogleAdsCampaign[]> {
  const result = await callGoogleAdsApi<{ campaigns: GoogleAdsCampaign[] }>(
    'campaigns',
    { account_id: accountId, access_token: accessToken },
    '/adsflow/google-ads-campaigns',
  )
  return result.campaigns || []
}

/**
 * Fetch campaign performance insights
 */
export async function getCampaignInsights(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  accessToken: string,
): Promise<GoogleAdsInsight[]> {
  const result = await callGoogleAdsApi<{ insights: GoogleAdsInsight[] }>(
    'insights',
    { account_id: accountId, access_token: accessToken, date_from: dateFrom, date_to: dateTo },
    '/adsflow/google-ads-insights',
  )
  return result.insights || []
}

/**
 * Fetch keyword data with quality scores
 */
export async function getKeywordInsights(
  accountId: string,
  campaignId: string | null,
  dateFrom: string,
  dateTo: string,
  accessToken: string,
): Promise<GoogleAdsKeyword[]> {
  const result = await callGoogleAdsApi<{ keywords: GoogleAdsKeyword[] }>(
    'keywords',
    { account_id: accountId, access_token: accessToken, campaign_id: campaignId, date_from: dateFrom, date_to: dateTo },
    '/adsflow/google-ads-keywords',
  )
  return result.keywords || []
}

// =====================================================
// SYNC SERVICE — Fetch from API, upsert to Supabase
// =====================================================

export const googleAdsSyncService = {
  /**
   * Full sync: campaigns + insights from Google Ads API to Supabase
   */
  async syncCampaigns(
    googleAccountId: string,
    clientId: string | null,
    onProgress?: (step: string, pct: number) => void,
  ): Promise<{ campaigns: number }> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')

    onProgress?.('Carregando credenciais...', 5)

    // Get account details
    const { data: account } = await supabase
      .from('google_accounts')
      .select('account_id, access_token, refresh_token')
      .eq('id', googleAccountId)
      .single()

    if (!account?.account_id) throw new Error('Google account not found')

    // Get valid token (auto-refresh if needed)
    const token = await googleAuthService.getValidToken(googleAccountId)

    onProgress?.('Buscando campanhas...', 20)
    const campaigns = await listCampaigns(account.account_id, token)

    onProgress?.('Salvando campanhas...', 60)
    for (const campaign of campaigns) {
      await supabase.from('google_ads_campaigns').upsert({
        google_account_id: googleAccountId,
        client_id: clientId,
        campaign_id: campaign.campaign_id,
        campaign_name: campaign.campaign_name,
        campaign_type: campaign.campaign_type,
        status: campaign.status,
        budget_amount: campaign.budget_amount,
        budget_type: campaign.budget_type,
        bidding_strategy: campaign.bidding_strategy,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
      }, { onConflict: 'google_account_id,campaign_id' })
    }

    onProgress?.('Concluído!', 100)
    return { campaigns: campaigns.length }
  },

  /**
   * Sync daily insights for a date range
   */
  async syncInsights(
    googleAccountId: string,
    clientId: string | null,
    dateRange: DateRange,
    onProgress?: (step: string, pct: number) => void,
  ): Promise<{ insights: number }> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')

    onProgress?.('Carregando credenciais...', 5)

    const { data: account } = await supabase
      .from('google_accounts')
      .select('account_id')
      .eq('id', googleAccountId)
      .single()

    if (!account?.account_id) throw new Error('Google account not found')

    const token = await googleAuthService.getValidToken(googleAccountId)

    onProgress?.('Buscando insights...', 20)
    const insights = await getCampaignInsights(
      account.account_id,
      dateRange.since,
      dateRange.until,
      token,
    )

    onProgress?.('Salvando insights...', 60)
    for (const insight of insights) {
      await supabase.from('google_ads_insights').upsert({
        google_account_id: googleAccountId,
        client_id: clientId,
        campaign_id: insight.campaign_id,
        date: insight.date,
        impressions: insight.impressions,
        clicks: insight.clicks,
        cost: insight.cost,
        conversions: insight.conversions,
        conversion_value: insight.conversion_value,
        ctr: insight.ctr,
        avg_cpc: insight.avg_cpc,
        avg_cpm: insight.avg_cpm,
        impression_share: insight.impression_share,
        search_impression_share: insight.search_impression_share,
        search_budget_lost_is: insight.search_budget_lost_is,
        search_rank_lost_is: insight.search_rank_lost_is,
        all_conversions: insight.all_conversions,
        view_through_conversions: insight.view_through_conversions,
        interaction_rate: insight.interaction_rate,
        video_views: insight.video_views,
        video_view_rate: insight.video_view_rate,
        cost_per_conversion: insight.cost_per_conversion,
        roas: insight.roas,
      }, { onConflict: 'google_account_id,campaign_id,date' })
    }

    // Update last_sync
    await supabase
      .from('google_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_error: null,
        status: 'active',
      })
      .eq('id', googleAccountId)

    onProgress?.('Concluído!', 100)
    return { insights: insights.length }
  },

  /**
   * Sync keywords for a campaign
   */
  async syncKeywords(
    googleAccountId: string,
    clientId: string | null,
    campaignId: string | null,
    dateRange: DateRange,
  ): Promise<{ keywords: number }> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')

    const { data: account } = await supabase
      .from('google_accounts')
      .select('account_id')
      .eq('id', googleAccountId)
      .single()

    if (!account?.account_id) throw new Error('Google account not found')

    const token = await googleAuthService.getValidToken(googleAccountId)

    const keywords = await getKeywordInsights(
      account.account_id,
      campaignId,
      dateRange.since,
      dateRange.until,
      token,
    )

    for (const kw of keywords) {
      await supabase.from('google_ads_keywords').upsert({
        google_account_id: googleAccountId,
        client_id: clientId,
        campaign_id: kw.campaign_id,
        ad_group_id: kw.ad_group_id,
        ad_group_name: kw.ad_group_name,
        keyword_text: kw.keyword_text,
        match_type: kw.match_type,
        quality_score: kw.quality_score,
        expected_ctr_score: kw.expected_ctr_score,
        ad_relevance_score: kw.ad_relevance_score,
        landing_page_score: kw.landing_page_score,
        impressions: kw.impressions,
        clicks: kw.clicks,
        cost: kw.cost,
        conversions: kw.conversions,
        ctr: kw.ctr,
        avg_cpc: kw.avg_cpc,
        avg_position: kw.avg_position,
        date: kw.date,
      }, { onConflict: 'google_account_id,keyword_text,match_type,date' })
    }

    return { keywords: keywords.length }
  },

  /**
   * Full sync: campaigns + insights + keywords
   */
  async fullSync(
    googleAccountId: string,
    clientId: string | null,
    dateRange: DateRange,
    onProgress?: (step: string, pct: number) => void,
  ): Promise<{ campaigns: number; insights: number; keywords: number; duration: number }> {
    const startTime = Date.now()

    try {
      onProgress?.('Sincronizando campanhas...', 10)
      const { campaigns } = await this.syncCampaigns(googleAccountId, clientId, (step, pct) => {
        onProgress?.(step, pct * 0.3)
      })

      onProgress?.('Sincronizando insights...', 35)
      const { insights } = await this.syncInsights(googleAccountId, clientId, dateRange, (step, pct) => {
        onProgress?.(step, 30 + pct * 0.4)
      })

      onProgress?.('Sincronizando keywords...', 75)
      const { keywords } = await this.syncKeywords(googleAccountId, clientId, null, dateRange)

      const duration = Date.now() - startTime
      onProgress?.('Concluído!', 100)

      return { campaigns, insights, keywords, duration }
    } catch (err) {
      await supabase
        .from('google_accounts')
        .update({
          sync_error: err instanceof Error ? err.message : 'Unknown error',
          status: 'error',
        })
        .eq('id', googleAccountId)
      throw err
    }
  },
}

// =====================================================
// DATA QUERIES — For dashboards
// =====================================================

export const googleAdsQueryService = {
  /**
   * Get aggregated metrics for a google account in a date range
   */
  async getAggregatedMetrics(
    googleAccountId: string,
    dateRange: DateRange,
  ): Promise<GoogleAdsAggregatedMetrics> {
    if (!isSupabaseConfigured) {
      return {
        impressions: 0, clicks: 0, cost: 0, conversions: 0,
        conversion_value: 0, ctr: 0, avg_cpc: 0, avg_cpm: 0, roas: 0,
        impression_share: null, search_impression_share: null,
        video_views: 0, cost_per_conversion: 0,
      }
    }

    const { data, error } = await supabase
      .from('google_ads_insights')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .gte('date', dateRange.since)
      .lte('date', dateRange.until)

    if (error) throw error
    const insights = data || []

    if (insights.length === 0) {
      return {
        impressions: 0, clicks: 0, cost: 0, conversions: 0,
        conversion_value: 0, ctr: 0, avg_cpc: 0, avg_cpm: 0, roas: 0,
        impression_share: null, search_impression_share: null,
        video_views: 0, cost_per_conversion: 0,
      }
    }

    const totals = insights.reduce(
      (acc, row) => ({
        impressions: acc.impressions + (row.impressions || 0),
        clicks: acc.clicks + (row.clicks || 0),
        cost: acc.cost + (Number(row.cost) || 0),
        conversions: acc.conversions + (Number(row.conversions) || 0),
        conversion_value: acc.conversion_value + (Number(row.conversion_value) || 0),
        video_views: acc.video_views + (row.video_views || 0),
        imp_share_sum: acc.imp_share_sum + (row.impression_share || 0),
        imp_share_count: acc.imp_share_count + (row.impression_share != null ? 1 : 0),
        search_is_sum: acc.search_is_sum + (row.search_impression_share || 0),
        search_is_count: acc.search_is_count + (row.search_impression_share != null ? 1 : 0),
      }),
      {
        impressions: 0, clicks: 0, cost: 0, conversions: 0,
        conversion_value: 0, video_views: 0,
        imp_share_sum: 0, imp_share_count: 0,
        search_is_sum: 0, search_is_count: 0,
      },
    )

    return {
      impressions: totals.impressions,
      clicks: totals.clicks,
      cost: totals.cost,
      conversions: totals.conversions,
      conversion_value: totals.conversion_value,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      avg_cpc: totals.clicks > 0 ? totals.cost / totals.clicks : 0,
      avg_cpm: totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0,
      roas: totals.cost > 0 ? totals.conversion_value / totals.cost : 0,
      impression_share: totals.imp_share_count > 0
        ? totals.imp_share_sum / totals.imp_share_count
        : null,
      search_impression_share: totals.search_is_count > 0
        ? totals.search_is_sum / totals.search_is_count
        : null,
      video_views: totals.video_views,
      cost_per_conversion: totals.conversions > 0 ? totals.cost / totals.conversions : 0,
    }
  },

  /**
   * Get top campaigns by spend or conversions
   */
  async getTopCampaigns(
    googleAccountId: string,
    dateRange: DateRange,
    limit = 10,
    sortBy: 'cost' | 'conversions' | 'roas' = 'cost',
  ): Promise<Array<{
    campaign_id: string
    campaign_name: string
    campaign_type: string
    status: string
    budget_amount: number | null
    impressions: number
    clicks: number
    cost: number
    conversions: number
    roas: number
    impression_share: number | null
    ctr: number
    avg_cpc: number
  }>> {
    if (!isSupabaseConfigured) return []

    // Get campaigns
    const { data: campaigns } = await supabase
      .from('google_ads_campaigns')
      .select('*')
      .eq('google_account_id', googleAccountId)

    const campaignMap = new Map(
      (campaigns || []).map((c) => [c.campaign_id, c]),
    )

    // Get insights
    const { data: insights } = await supabase
      .from('google_ads_insights')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .gte('date', dateRange.since)
      .lte('date', dateRange.until)

    // Aggregate by campaign
    const byCampaign = new Map<string, {
      impressions: number; clicks: number; cost: number;
      conversions: number; conversion_value: number;
      imp_share_sum: number; imp_share_count: number
    }>()

    for (const row of (insights || [])) {
      const existing = byCampaign.get(row.campaign_id) || {
        impressions: 0, clicks: 0, cost: 0, conversions: 0,
        conversion_value: 0, imp_share_sum: 0, imp_share_count: 0,
      }
      byCampaign.set(row.campaign_id, {
        impressions: existing.impressions + (row.impressions || 0),
        clicks: existing.clicks + (row.clicks || 0),
        cost: existing.cost + (Number(row.cost) || 0),
        conversions: existing.conversions + (Number(row.conversions) || 0),
        conversion_value: existing.conversion_value + (Number(row.conversion_value) || 0),
        imp_share_sum: existing.imp_share_sum + (row.impression_share || 0),
        imp_share_count: existing.imp_share_count + (row.impression_share != null ? 1 : 0),
      })
    }

    return Array.from(byCampaign.entries())
      .map(([campaignId, d]) => {
        const campaign = campaignMap.get(campaignId)
        return {
          campaign_id: campaignId,
          campaign_name: campaign?.campaign_name || 'Unknown',
          campaign_type: campaign?.campaign_type || 'SEARCH',
          status: campaign?.status || 'UNKNOWN',
          budget_amount: campaign?.budget_amount ?? null,
          impressions: d.impressions,
          clicks: d.clicks,
          cost: d.cost,
          conversions: d.conversions,
          roas: d.cost > 0 ? d.conversion_value / d.cost : 0,
          impression_share: d.imp_share_count > 0
            ? d.imp_share_sum / d.imp_share_count
            : null,
          ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
          avg_cpc: d.clicks > 0 ? d.cost / d.clicks : 0,
        }
      })
      .sort((a, b) => {
        if (sortBy === 'roas') return b.roas - a.roas
        if (sortBy === 'conversions') return b.conversions - a.conversions
        return b.cost - a.cost
      })
      .slice(0, limit)
  },

  /**
   * Get daily metrics (for time series charts)
   */
  async getDailyMetrics(
    googleAccountId: string,
    dateRange: DateRange,
  ): Promise<Array<{
    date: string
    impressions: number
    clicks: number
    cost: number
    conversions: number
    ctr: number
    avg_cpc: number
    roas: number
  }>> {
    if (!isSupabaseConfigured) return []

    const { data } = await supabase
      .from('google_ads_insights')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .gte('date', dateRange.since)
      .lte('date', dateRange.until)
      .order('date')

    // Aggregate by date across campaigns
    const byDate = new Map<string, {
      impressions: number; clicks: number; cost: number;
      conversions: number; conversion_value: number
    }>()

    for (const row of (data || [])) {
      const existing = byDate.get(row.date) || {
        impressions: 0, clicks: 0, cost: 0, conversions: 0, conversion_value: 0,
      }
      byDate.set(row.date, {
        impressions: existing.impressions + (row.impressions || 0),
        clicks: existing.clicks + (row.clicks || 0),
        cost: existing.cost + (Number(row.cost) || 0),
        conversions: existing.conversions + (Number(row.conversions) || 0),
        conversion_value: existing.conversion_value + (Number(row.conversion_value) || 0),
      })
    }

    return Array.from(byDate.entries())
      .map(([date, d]) => ({
        date,
        impressions: d.impressions,
        clicks: d.clicks,
        cost: d.cost,
        conversions: d.conversions,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        avg_cpc: d.clicks > 0 ? d.cost / d.clicks : 0,
        roas: d.cost > 0 ? d.conversion_value / d.cost : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },

  /**
   * Get keyword performance for a campaign
   */
  async getKeywordPerformance(
    googleAccountId: string,
    campaignId: string | null,
    dateRange: DateRange,
  ): Promise<Array<{
    keyword_text: string
    match_type: string
    quality_score: number | null
    expected_ctr_score: string | null
    ad_relevance_score: string | null
    landing_page_score: string | null
    impressions: number
    clicks: number
    cost: number
    conversions: number
    ctr: number
    avg_cpc: number
  }>> {
    if (!isSupabaseConfigured) return []

    let query = supabase
      .from('google_ads_keywords')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .gte('date', dateRange.since)
      .lte('date', dateRange.until)

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    const { data } = await query

    // Aggregate by keyword + match_type
    const byKeyword = new Map<string, {
      keyword_text: string; match_type: string;
      quality_score: number | null;
      expected_ctr_score: string | null;
      ad_relevance_score: string | null;
      landing_page_score: string | null;
      impressions: number; clicks: number; cost: number; conversions: number
    }>()

    for (const row of (data || [])) {
      const key = `${row.keyword_text}|${row.match_type}`
      const existing = byKeyword.get(key)
      if (!existing) {
        byKeyword.set(key, {
          keyword_text: row.keyword_text,
          match_type: row.match_type,
          quality_score: row.quality_score,
          expected_ctr_score: row.expected_ctr_score,
          ad_relevance_score: row.ad_relevance_score,
          landing_page_score: row.landing_page_score,
          impressions: row.impressions || 0,
          clicks: row.clicks || 0,
          cost: Number(row.cost) || 0,
          conversions: Number(row.conversions) || 0,
        })
      } else {
        existing.impressions += row.impressions || 0
        existing.clicks += row.clicks || 0
        existing.cost += Number(row.cost) || 0
        existing.conversions += Number(row.conversions) || 0
        // Keep latest quality score
        if (row.quality_score != null) {
          existing.quality_score = row.quality_score
          existing.expected_ctr_score = row.expected_ctr_score
          existing.ad_relevance_score = row.ad_relevance_score
          existing.landing_page_score = row.landing_page_score
        }
      }
    }

    return Array.from(byKeyword.values())
      .map((d) => ({
        ...d,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        avg_cpc: d.clicks > 0 ? d.cost / d.clicks : 0,
      }))
      .sort((a, b) => b.cost - a.cost)
  },

  /**
   * Get quality score distribution for the account
   */
  async getQualityScoreDistribution(
    googleAccountId: string,
    dateRange: DateRange,
  ): Promise<Array<{ score: number; count: number; avgCost: number }>> {
    if (!isSupabaseConfigured) return []

    const keywords = await this.getKeywordPerformance(googleAccountId, null, dateRange)

    const byScore = new Map<number, { count: number; totalCost: number }>()

    for (const kw of keywords) {
      if (kw.quality_score == null) continue
      const existing = byScore.get(kw.quality_score) || { count: 0, totalCost: 0 }
      existing.count += 1
      existing.totalCost += kw.cost
      byScore.set(kw.quality_score, existing)
    }

    return Array.from(byScore.entries())
      .map(([score, d]) => ({
        score,
        count: d.count,
        avgCost: d.count > 0 ? d.totalCost / d.count : 0,
      }))
      .sort((a, b) => a.score - b.score)
  },

  /**
   * Get campaigns from cache
   */
  async getCampaigns(googleAccountId: string): Promise<Array<{
    id: string
    campaign_id: string
    campaign_name: string
    campaign_type: string
    status: string
    budget_amount: number | null
    budget_type: string | null
    bidding_strategy: string | null
  }>> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
      .from('google_ads_campaigns')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .order('campaign_name')

    if (error) throw error
    return data || []
  },
}
