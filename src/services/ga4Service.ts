/**
 * ============================================
 * GA4 SERVICE — Google Analytics 4 Data API
 * ============================================
 * Integrates with GA4 Data API via N8N proxy.
 * Manages properties, traffic data, conversions.
 *
 * Flow: Frontend → N8N Webhook → GA4 Data API → N8N → Response
 * Storage: Results upserted to Supabase ga4_metrics table
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase'
import { googleAuthService } from './googleAuthService'

// =====================================================
// CONFIG
// =====================================================

const N8N_BASE_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL ||
  'https://ia-kommo-n8n.xl78rn.easypanel.host/webhook'

// =====================================================
// TYPES
// =====================================================

export interface GA4Property {
  property_id: string
  display_name: string
  timezone: string
  currency: string
  industry_category: string | null
  create_time: string
}

export interface GA4TrafficRow {
  date: string
  sessions: number
  users: number
  new_users: number
  active_users: number
  pageviews: number
  screen_page_views: number
  events_count: number
  engaged_sessions: number
  engagement_rate: number
  avg_session_duration: number
  bounce_rate: number
  conversions: number
  total_revenue: number
  session_source: string | null
  session_medium: string | null
  session_campaign: string | null
  device_category: string | null
  country: string | null
  city: string | null
}

export interface GA4ConversionEvent {
  event_name: string
  event_count: number
  total_users: number
  total_revenue: number
}

export interface DateRange {
  since: string
  until: string
}

// =====================================================
// N8N API CALLS
// =====================================================

/**
 * List GA4 properties accessible by the user
 */
export async function getProperties(
  accessToken: string,
): Promise<GA4Property[]> {
  const response = await fetch(`${N8N_BASE_URL}/adsflow/ga4-properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  })

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error')
    throw new Error(`GA4 properties fetch failed: ${error}`)
  }

  const result = await response.json()
  return result.properties || []
}

/**
 * Get traffic data: sessions, users, by source/medium
 */
export async function getTrafficData(
  propertyId: string,
  dateRange: DateRange,
  accessToken: string,
): Promise<GA4TrafficRow[]> {
  const response = await fetch(`${N8N_BASE_URL}/adsflow/ga4-traffic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      property_id: propertyId,
      access_token: accessToken,
      date_from: dateRange.since,
      date_to: dateRange.until,
    }),
  })

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error')
    throw new Error(`GA4 traffic data fetch failed: ${error}`)
  }

  const result = await response.json()
  return result.rows || []
}

/**
 * Get conversion event data
 */
export async function getConversionData(
  propertyId: string,
  dateRange: DateRange,
  accessToken: string,
): Promise<GA4ConversionEvent[]> {
  const response = await fetch(`${N8N_BASE_URL}/adsflow/ga4-conversions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      property_id: propertyId,
      access_token: accessToken,
      date_from: dateRange.since,
      date_to: dateRange.until,
    }),
  })

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error')
    throw new Error(`GA4 conversion data fetch failed: ${error}`)
  }

  const result = await response.json()
  return result.events || []
}

// =====================================================
// SYNC SERVICE
// =====================================================

export const ga4SyncService = {
  /**
   * Sync GA4 metrics to Supabase
   */
  async syncMetrics(
    googleAccountId: string,
    propertyId: string,
    clientId: string | null,
    dateRange: DateRange,
    onProgress?: (step: string, pct: number) => void,
  ): Promise<{ rows: number }> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')

    onProgress?.('Carregando credenciais...', 5)
    const token = await googleAuthService.getValidToken(googleAccountId)

    onProgress?.('Buscando dados do GA4...', 20)
    const trafficRows = await getTrafficData(propertyId, dateRange, token)

    onProgress?.('Salvando métricas...', 60)
    for (const row of trafficRows) {
      await supabase.from('ga4_metrics').upsert({
        google_account_id: googleAccountId,
        client_id: clientId,
        property_id: propertyId,
        date: row.date,
        sessions: row.sessions,
        users: row.users,
        new_users: row.new_users,
        active_users: row.active_users,
        pageviews: row.pageviews,
        screen_page_views: row.screen_page_views,
        events_count: row.events_count,
        engaged_sessions: row.engaged_sessions,
        engagement_rate: row.engagement_rate,
        avg_session_duration: row.avg_session_duration,
        bounce_rate: row.bounce_rate,
        conversions: row.conversions,
        total_revenue: row.total_revenue,
        session_source: row.session_source,
        session_medium: row.session_medium,
        session_campaign: row.session_campaign,
        device_category: row.device_category,
        country: row.country,
        city: row.city,
      }, {
        onConflict: 'google_account_id,property_id,date,session_source,session_medium,device_category',
      })
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
    return { rows: trafficRows.length }
  },
}

// =====================================================
// DATA QUERIES — For dashboards
// =====================================================

export const ga4QueryService = {
  /**
   * Get traffic summary from the view (or direct query)
   */
  async getTrafficSummary(
    clientId: string,
    dateRange: DateRange,
  ): Promise<Array<{
    source: string
    medium: string
    total_sessions: number
    total_users: number
    total_new_users: number
    total_pageviews: number
    avg_engagement_rate: number
    avg_session_duration: number
    total_conversions: number
    total_revenue: number
  }>> {
    if (!isSupabaseConfigured) return []

    // Query from the view
    const { data, error } = await supabase
      .from('vw_ga4_traffic_summary')
      .select('*')
      .eq('client_id', clientId)
      .gte('date_from', dateRange.since)
      .lte('date_to', dateRange.until)

    if (error) {
      // Fallback: direct query if view not available
      console.warn('vw_ga4_traffic_summary not available, using direct query')
      return this.getTrafficSummaryDirect(clientId, dateRange)
    }

    return (data || []).map((row) => ({
      source: row.source || '(direct)',
      medium: row.medium || '(none)',
      total_sessions: Number(row.total_sessions) || 0,
      total_users: Number(row.total_users) || 0,
      total_new_users: Number(row.total_new_users) || 0,
      total_pageviews: Number(row.total_pageviews) || 0,
      avg_engagement_rate: Number(row.avg_engagement_rate) || 0,
      avg_session_duration: Number(row.avg_session_duration) || 0,
      total_conversions: Number(row.total_conversions) || 0,
      total_revenue: Number(row.total_revenue) || 0,
    }))
  },

  /**
   * Direct query fallback for traffic summary
   */
  async getTrafficSummaryDirect(
    clientId: string,
    dateRange: DateRange,
  ): Promise<Array<{
    source: string
    medium: string
    total_sessions: number
    total_users: number
    total_new_users: number
    total_pageviews: number
    avg_engagement_rate: number
    avg_session_duration: number
    total_conversions: number
    total_revenue: number
  }>> {
    // Get google accounts for this client
    const { data: accounts } = await supabase
      .from('google_accounts')
      .select('id')
      .eq('client_id', clientId)
      .eq('platform', 'ga4')

    if (!accounts || accounts.length === 0) return []

    const accountIds = accounts.map((a) => a.id)

    const { data } = await supabase
      .from('ga4_metrics')
      .select('*')
      .in('google_account_id', accountIds)
      .gte('date', dateRange.since)
      .lte('date', dateRange.until)

    // Aggregate by source/medium
    const bySourceMedium = new Map<string, {
      source: string; medium: string;
      sessions: number; users: number; new_users: number;
      pageviews: number; engaged_sessions: number;
      duration_sum: number; duration_count: number;
      conversions: number; revenue: number
    }>()

    for (const row of (data || [])) {
      const key = `${row.session_source || '(direct)'}|${row.session_medium || '(none)'}`
      const existing = bySourceMedium.get(key) || {
        source: row.session_source || '(direct)',
        medium: row.session_medium || '(none)',
        sessions: 0, users: 0, new_users: 0,
        pageviews: 0, engaged_sessions: 0,
        duration_sum: 0, duration_count: 0,
        conversions: 0, revenue: 0,
      }
      existing.sessions += row.sessions || 0
      existing.users += row.users || 0
      existing.new_users += row.new_users || 0
      existing.pageviews += row.pageviews || 0
      existing.engaged_sessions += row.engaged_sessions || 0
      existing.duration_sum += Number(row.avg_session_duration) || 0
      existing.duration_count += 1
      existing.conversions += row.conversions || 0
      existing.revenue += Number(row.total_revenue) || 0
      bySourceMedium.set(key, existing)
    }

    return Array.from(bySourceMedium.values())
      .map((d) => ({
        source: d.source,
        medium: d.medium,
        total_sessions: d.sessions,
        total_users: d.users,
        total_new_users: d.new_users,
        total_pageviews: d.pageviews,
        avg_engagement_rate: d.sessions > 0
          ? d.engaged_sessions / d.sessions
          : 0,
        avg_session_duration: d.duration_count > 0
          ? d.duration_sum / d.duration_count
          : 0,
        total_conversions: d.conversions,
        total_revenue: d.revenue,
      }))
      .sort((a, b) => b.total_sessions - a.total_sessions)
  },

  /**
   * Get daily traffic metrics for charts
   */
  async getDailyTraffic(
    googleAccountId: string,
    dateRange: DateRange,
  ): Promise<Array<{
    date: string
    sessions: number
    users: number
    pageviews: number
    bounce_rate: number
    conversions: number
  }>> {
    if (!isSupabaseConfigured) return []

    const { data } = await supabase
      .from('ga4_metrics')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .gte('date', dateRange.since)
      .lte('date', dateRange.until)

    // Aggregate by date
    const byDate = new Map<string, {
      sessions: number; users: number; pageviews: number;
      bounce_sum: number; bounce_count: number; conversions: number
    }>()

    for (const row of (data || [])) {
      const existing = byDate.get(row.date) || {
        sessions: 0, users: 0, pageviews: 0,
        bounce_sum: 0, bounce_count: 0, conversions: 0,
      }
      existing.sessions += row.sessions || 0
      existing.users += row.users || 0
      existing.pageviews += row.pageviews || 0
      existing.bounce_sum += Number(row.bounce_rate) || 0
      existing.bounce_count += 1
      existing.conversions += row.conversions || 0
      byDate.set(row.date, existing)
    }

    return Array.from(byDate.entries())
      .map(([date, d]) => ({
        date,
        sessions: d.sessions,
        users: d.users,
        pageviews: d.pageviews,
        bounce_rate: d.bounce_count > 0 ? d.bounce_sum / d.bounce_count : 0,
        conversions: d.conversions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },
}
