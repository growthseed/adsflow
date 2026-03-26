/**
 * ============================================
 * CONVERSION TRUTH SERVICE
 * ============================================
 * Bridges platform-reported conversions with actual
 * business results (CRM leads, real sales).
 * Core of the "Verdade da Conversão" feature.
 */

import supabase from '@/lib/supabase'

// =====================================================
// TYPES
// =====================================================

export interface LeadAttribution {
  id: string
  client_id: string
  lead_id: string | null
  lead_source: string | null
  lead_name: string | null
  lead_email: string | null
  lead_phone: string | null
  lead_created_at: string | null
  ad_account_id: string | null
  platform: string | null
  campaign_id: string | null
  campaign_name: string | null
  adset_id: string | null
  adset_name: string | null
  ad_id: string | null
  ad_name: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  landing_page_url: string | null
  referrer_url: string | null
  attribution_model: string
  attribution_weight: number
  conversion_type: string | null
  conversion_value: number
  is_qualified: boolean
  qualification_notes: string | null
  qualified_at: string | null
  qualified_by: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface PlatformConversion {
  id: string
  client_id: string
  ad_account_id: string
  platform: string
  date: string
  campaign_id: string | null
  campaign_name: string | null
  adset_name: string | null
  reported_conversions: number
  reported_conversion_value: number
  reported_leads: number
  reported_roas: number
  conversion_action: string | null
  conversion_category: string | null
  spend: number
  created_at: string
}

export interface ConversionTruthRow {
  client_id: string
  platform: string | null
  campaign_name: string | null
  utm_campaign: string | null
  month: string
  real_leads: number
  qualified_leads: number
  real_revenue: number
  platform_conversions: number
  platform_leads: number
  total_spend: number
  lead_gap: number
  reality_rate: number
  real_cpl: number
  reported_cpl: number
  real_roas: number
  reported_roas: number
}

export interface ConversionQualityRow {
  client_id: string
  ad_account_id: string | null
  campaign_name: string | null
  platform: string | null
  total_attributed: number
  qualified_count: number
  quality_score: number
  avg_deal_value: number | null
  primary_conversion_type: string | null
  primary_lead_source: string | null
}

export interface DateRange {
  from: string // ISO date string YYYY-MM-DD
  to: string
}

export interface ConversionGap {
  platformSays: number
  realityIs: number
  gap: number
  realityRate: number
}

export interface CampaignCPL {
  campaign_name: string
  real_cpl: number
  reported_cpl: number
  spend: number
  real_leads: number
  platform_leads: number
}

export interface CampaignROAS {
  campaign_name: string
  real_roas: number
  reported_roas: number
  real_revenue: number
  spend: number
}

export type LeadAttributionInsert = Omit<LeadAttribution, 'id' | 'created_at' | 'updated_at'>

// =====================================================
// SERVICE
// =====================================================

export const conversionTruthService = {
  /**
   * Fetches conversion truth data from vw_conversion_truth view
   */
  async getConversionTruth(
    clientId: string,
    dateRange?: DateRange
  ): Promise<ConversionTruthRow[]> {
    let query = supabase
      .from('vw_conversion_truth')
      .select('*')
      .eq('client_id', clientId)

    if (dateRange) {
      query = query
        .gte('month', dateRange.from)
        .lte('month', dateRange.to)
    }

    const { data, error } = await query.order('month', { ascending: false })

    if (error) {
      console.error('[ConversionTruth] Error fetching truth data:', error)
      throw error
    }

    return (data || []) as ConversionTruthRow[]
  },

  /**
   * Fetches conversion quality scores from vw_conversion_quality view
   */
  async getConversionQuality(clientId: string): Promise<ConversionQualityRow[]> {
    const { data, error } = await supabase
      .from('vw_conversion_quality')
      .select('*')
      .eq('client_id', clientId)
      .order('quality_score', { ascending: false })

    if (error) {
      console.error('[ConversionTruth] Error fetching quality data:', error)
      throw error
    }

    return (data || []) as ConversionQualityRow[]
  },

  /**
   * Inserts a new lead attribution record
   */
  async addLeadAttribution(data: LeadAttributionInsert): Promise<LeadAttribution> {
    const { data: inserted, error } = await supabase
      .from('lead_attribution')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('[ConversionTruth] Error adding lead attribution:', error)
      throw error
    }

    return inserted as LeadAttribution
  },

  /**
   * Updates the qualification status of a lead
   */
  async qualifyLead(
    id: string,
    isQualified: boolean,
    notes?: string
  ): Promise<LeadAttribution> {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: updated, error } = await supabase
      .from('lead_attribution')
      .update({
        is_qualified: isQualified,
        qualification_notes: notes || null,
        qualified_at: isQualified ? new Date().toISOString() : null,
        qualified_by: isQualified ? user?.id || null : null,
        status: isQualified ? 'qualified' : 'new',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[ConversionTruth] Error qualifying lead:', error)
      throw error
    }

    return updated as LeadAttribution
  },

  /**
   * Upserts platform conversion data (from Meta/Google sync)
   */
  async syncPlatformConversions(
    adAccountId: string,
    date: string,
    data: Partial<PlatformConversion>[]
  ): Promise<PlatformConversion[]> {
    const records = data.map((d) => ({
      ...d,
      ad_account_id: adAccountId,
      date,
    }))

    const { data: upserted, error } = await supabase
      .from('platform_conversions')
      .upsert(records, {
        onConflict: 'ad_account_id,date,campaign_id,conversion_action',
      })
      .select()

    if (error) {
      console.error('[ConversionTruth] Error syncing platform conversions:', error)
      throw error
    }

    return (upserted || []) as PlatformConversion[]
  },

  /**
   * Returns the gap between what platforms report vs reality
   */
  async getConversionGap(
    clientId: string,
    dateRange?: DateRange
  ): Promise<ConversionGap> {
    const truthData = await this.getConversionTruth(clientId, dateRange)

    const platformSays = truthData.reduce((sum, r) => sum + (r.platform_leads || 0), 0)
    const realityIs = truthData.reduce((sum, r) => sum + (r.real_leads || 0), 0)
    const gap = realityIs - platformSays
    const realityRate = platformSays > 0
      ? Math.round((realityIs / platformSays) * 1000) / 10
      : 0

    return { platformSays, realityIs, gap, realityRate }
  },

  /**
   * Returns real CPL per campaign
   */
  async getRealCPL(
    clientId: string,
    dateRange?: DateRange
  ): Promise<CampaignCPL[]> {
    const truthData = await this.getConversionTruth(clientId, dateRange)

    const byCampaign = new Map<string, { spend: number; realLeads: number; platformLeads: number }>()

    for (const row of truthData) {
      const key = row.campaign_name || 'Sem campanha'
      const existing = byCampaign.get(key) || { spend: 0, realLeads: 0, platformLeads: 0 }
      existing.spend += row.total_spend || 0
      existing.realLeads += row.real_leads || 0
      existing.platformLeads += row.platform_leads || 0
      byCampaign.set(key, existing)
    }

    return Array.from(byCampaign.entries()).map(([campaign_name, stats]) => ({
      campaign_name,
      real_cpl: stats.realLeads > 0 ? Math.round((stats.spend / stats.realLeads) * 100) / 100 : 0,
      reported_cpl: stats.platformLeads > 0 ? Math.round((stats.spend / stats.platformLeads) * 100) / 100 : 0,
      spend: stats.spend,
      real_leads: stats.realLeads,
      platform_leads: stats.platformLeads,
    }))
  },

  /**
   * Returns real ROAS per campaign
   */
  async getRealROAS(
    clientId: string,
    dateRange?: DateRange
  ): Promise<CampaignROAS[]> {
    const truthData = await this.getConversionTruth(clientId, dateRange)

    const byCampaign = new Map<string, { spend: number; realRevenue: number; reportedRoas: number; count: number }>()

    for (const row of truthData) {
      const key = row.campaign_name || 'Sem campanha'
      const existing = byCampaign.get(key) || { spend: 0, realRevenue: 0, reportedRoas: 0, count: 0 }
      existing.spend += row.total_spend || 0
      existing.realRevenue += row.real_revenue || 0
      existing.reportedRoas += row.reported_roas || 0
      existing.count += 1
      byCampaign.set(key, existing)
    }

    return Array.from(byCampaign.entries()).map(([campaign_name, stats]) => ({
      campaign_name,
      real_roas: stats.spend > 0 ? Math.round((stats.realRevenue / stats.spend) * 100) / 100 : 0,
      reported_roas: stats.count > 0 ? Math.round((stats.reportedRoas / stats.count) * 100) / 100 : 0,
      real_revenue: stats.realRevenue,
      spend: stats.spend,
    }))
  },
}

export default conversionTruthService
