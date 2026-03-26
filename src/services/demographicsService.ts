/**
 * ============================================
 * DEMOGRAPHICS SERVICE
 * ============================================
 * Consulta dados demográficos de campanhas
 * (age, gender, device, placement, hour, region).
 */

import supabase from '@/lib/supabase'

// =====================================================
// TYPES
// =====================================================

export interface DemographicRow {
  dimension_value: string
  impressions: number
  clicks: number
  spend: number
  conversions: number
  ctr: number
  cpc: number
}

export interface DateRange {
  start: string // YYYY-MM-DD
  end: string
}

type Dimension = 'age' | 'gender' | 'device' | 'placement' | 'hour' | 'region'

// =====================================================
// HELPERS
// =====================================================

async function fetchByDimension(
  clientId: string,
  adAccountId: string,
  dateRange: DateRange,
  dimension: Dimension
): Promise<DemographicRow[]> {
  const { data, error } = await supabase
    .from('campaign_demographics')
    .select('dimension_value, impressions, clicks, spend, conversions')
    .eq('client_id', clientId)
    .eq('ad_account_id', adAccountId)
    .eq('dimension', dimension)
    .gte('date', dateRange.start)
    .lte('date', dateRange.end)

  if (error) throw error

  // Aggregate by dimension_value (multiple dates)
  const map = new Map<string, { impressions: number; clicks: number; spend: number; conversions: number }>()

  for (const row of data || []) {
    const key = row.dimension_value
    const existing = map.get(key) || { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
    existing.impressions += Number(row.impressions) || 0
    existing.clicks += Number(row.clicks) || 0
    existing.spend += Number(row.spend) || 0
    existing.conversions += Number(row.conversions) || 0
    map.set(key, existing)
  }

  const result: DemographicRow[] = []
  for (const [dimension_value, agg] of map) {
    result.push({
      dimension_value,
      impressions: agg.impressions,
      clicks: agg.clicks,
      spend: agg.spend,
      conversions: agg.conversions,
      ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
      cpc: agg.clicks > 0 ? agg.spend / agg.clicks : 0,
    })
  }

  return result.sort((a, b) => b.spend - a.spend)
}

// =====================================================
// SERVICE
// =====================================================

export const demographicsService = {
  async getByAge(clientId: string, adAccountId: string, dateRange: DateRange): Promise<DemographicRow[]> {
    return fetchByDimension(clientId, adAccountId, dateRange, 'age')
  },

  async getByGender(clientId: string, adAccountId: string, dateRange: DateRange): Promise<DemographicRow[]> {
    return fetchByDimension(clientId, adAccountId, dateRange, 'gender')
  },

  async getByDevice(clientId: string, adAccountId: string, dateRange: DateRange): Promise<DemographicRow[]> {
    return fetchByDimension(clientId, adAccountId, dateRange, 'device')
  },

  async getByPlacement(clientId: string, adAccountId: string, dateRange: DateRange): Promise<DemographicRow[]> {
    return fetchByDimension(clientId, adAccountId, dateRange, 'placement')
  },

  async getByHour(clientId: string, adAccountId: string, dateRange: DateRange): Promise<DemographicRow[]> {
    const rows = await fetchByDimension(clientId, adAccountId, dateRange, 'hour')
    // Sort by hour numerically
    return rows.sort((a, b) => Number(a.dimension_value) - Number(b.dimension_value))
  },

  async getByRegion(clientId: string, adAccountId: string, dateRange: DateRange): Promise<DemographicRow[]> {
    return fetchByDimension(clientId, adAccountId, dateRange, 'region')
  },
}
