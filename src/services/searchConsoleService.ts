/**
 * ============================================
 * SEARCH CONSOLE SERVICE — Google Search Console API
 * ============================================
 * Integrates with Google Search Console API via N8N proxy.
 * Manages sites, search analytics (queries, pages, clicks, impressions).
 *
 * Flow: Frontend → N8N Webhook → Search Console API → N8N → Response
 * Storage: Results upserted to Supabase search_console_data table
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

export interface SearchConsoleSite {
  site_url: string
  permission_level: string
}

export interface SearchAnalyticsRow {
  date: string
  query: string | null
  page: string | null
  clicks: number
  impressions: number
  ctr: number
  position: number
  device: string | null
  country: string | null
}

export interface DateRange {
  since: string
  until: string
}

// =====================================================
// N8N API CALLS
// =====================================================

/**
 * List verified sites from Search Console
 */
export async function getSites(
  accessToken: string,
): Promise<SearchConsoleSite[]> {
  const response = await fetch(`${N8N_BASE_URL}/adsflow/search-console-sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  })

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error')
    throw new Error(`Search Console sites fetch failed: ${error}`)
  }

  const result = await response.json()
  return result.sites || []
}

/**
 * Get search analytics data (queries, pages, clicks, impressions, ctr, position)
 */
export async function getSearchAnalytics(
  siteUrl: string,
  dateRange: DateRange,
  accessToken: string,
): Promise<SearchAnalyticsRow[]> {
  const response = await fetch(`${N8N_BASE_URL}/adsflow/search-console-analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      site_url: siteUrl,
      access_token: accessToken,
      date_from: dateRange.since,
      date_to: dateRange.until,
    }),
  })

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error')
    throw new Error(`Search Console analytics fetch failed: ${error}`)
  }

  const result = await response.json()
  return result.rows || []
}

// =====================================================
// SYNC SERVICE
// =====================================================

export const searchConsoleSyncService = {
  /**
   * Sync search console data to Supabase
   */
  async syncData(
    googleAccountId: string,
    siteUrl: string,
    clientId: string | null,
    dateRange: DateRange,
    onProgress?: (step: string, pct: number) => void,
  ): Promise<{ rows: number }> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')

    onProgress?.('Carregando credenciais...', 5)
    const token = await googleAuthService.getValidToken(googleAccountId)

    onProgress?.('Buscando dados do Search Console...', 20)
    const rows = await getSearchAnalytics(siteUrl, dateRange, token)

    onProgress?.('Salvando dados...', 60)
    for (const row of rows) {
      await supabase.from('search_console_data').upsert({
        google_account_id: googleAccountId,
        client_id: clientId,
        site_url: siteUrl,
        date: row.date,
        query: row.query,
        page: row.page,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        device: row.device,
        country: row.country,
      }, {
        onConflict: 'google_account_id,site_url,date,query,page,device',
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
    return { rows: rows.length }
  },
}

// =====================================================
// DATA QUERIES — For dashboards
// =====================================================

export const searchConsoleQueryService = {
  /**
   * Get SEO performance from the view (or direct query)
   */
  async getSEOPerformance(
    clientId: string,
    dateRange: DateRange,
  ): Promise<Array<{
    query: string | null
    page: string | null
    total_clicks: number
    total_impressions: number
    avg_ctr: number
    avg_position: number
  }>> {
    if (!isSupabaseConfigured) return []

    // Try the view first
    const { data, error } = await supabase
      .from('vw_seo_performance')
      .select('*')
      .eq('client_id', clientId)
      .gte('date_from', dateRange.since)
      .lte('date_to', dateRange.until)
      .order('total_clicks', { ascending: false })
      .limit(100)

    if (error) {
      console.warn('vw_seo_performance not available, using direct query')
      return this.getSEOPerformanceDirect(clientId, dateRange)
    }

    return (data || []).map((row) => ({
      query: row.query,
      page: row.page,
      total_clicks: Number(row.total_clicks) || 0,
      total_impressions: Number(row.total_impressions) || 0,
      avg_ctr: Number(row.avg_ctr) || 0,
      avg_position: Number(row.avg_position) || 0,
    }))
  },

  /**
   * Direct query fallback
   */
  async getSEOPerformanceDirect(
    clientId: string,
    dateRange: DateRange,
  ): Promise<Array<{
    query: string | null
    page: string | null
    total_clicks: number
    total_impressions: number
    avg_ctr: number
    avg_position: number
  }>> {
    // Get google accounts for this client
    const { data: accounts } = await supabase
      .from('google_accounts')
      .select('id')
      .eq('client_id', clientId)
      .eq('platform', 'search_console')

    if (!accounts || accounts.length === 0) return []

    const accountIds = accounts.map((a) => a.id)

    const { data } = await supabase
      .from('search_console_data')
      .select('*')
      .in('google_account_id', accountIds)
      .gte('date', dateRange.since)
      .lte('date', dateRange.until)

    // Aggregate by query
    const byQuery = new Map<string, {
      query: string | null; page: string | null;
      clicks: number; impressions: number;
      position_sum: number; position_count: number
    }>()

    for (const row of (data || [])) {
      const key = row.query || '(not provided)'
      const existing = byQuery.get(key) || {
        query: row.query,
        page: row.page,
        clicks: 0, impressions: 0,
        position_sum: 0, position_count: 0,
      }
      existing.clicks += row.clicks || 0
      existing.impressions += row.impressions || 0
      existing.position_sum += Number(row.position) || 0
      existing.position_count += 1
      byQuery.set(key, existing)
    }

    return Array.from(byQuery.values())
      .map((d) => ({
        query: d.query,
        page: d.page,
        total_clicks: d.clicks,
        total_impressions: d.impressions,
        avg_ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        avg_position: d.position_count > 0 ? d.position_sum / d.position_count : 0,
      }))
      .sort((a, b) => b.total_clicks - a.total_clicks)
      .slice(0, 100)
  },

  /**
   * Get top pages by clicks
   */
  async getTopPages(
    googleAccountId: string,
    dateRange: DateRange,
    limit = 20,
  ): Promise<Array<{
    page: string
    clicks: number
    impressions: number
    avg_ctr: number
    avg_position: number
  }>> {
    if (!isSupabaseConfigured) return []

    const { data } = await supabase
      .from('search_console_data')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .gte('date', dateRange.since)
      .lte('date', dateRange.until)

    // Aggregate by page
    const byPage = new Map<string, {
      clicks: number; impressions: number;
      position_sum: number; position_count: number
    }>()

    for (const row of (data || [])) {
      if (!row.page) continue
      const existing = byPage.get(row.page) || {
        clicks: 0, impressions: 0, position_sum: 0, position_count: 0,
      }
      existing.clicks += row.clicks || 0
      existing.impressions += row.impressions || 0
      existing.position_sum += Number(row.position) || 0
      existing.position_count += 1
      byPage.set(row.page, existing)
    }

    return Array.from(byPage.entries())
      .map(([page, d]) => ({
        page,
        clicks: d.clicks,
        impressions: d.impressions,
        avg_ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        avg_position: d.position_count > 0 ? d.position_sum / d.position_count : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit)
  },

  /**
   * Get daily SEO metrics for charts
   */
  async getDailyMetrics(
    googleAccountId: string,
    dateRange: DateRange,
  ): Promise<Array<{
    date: string
    clicks: number
    impressions: number
    avg_ctr: number
    avg_position: number
  }>> {
    if (!isSupabaseConfigured) return []

    const { data } = await supabase
      .from('search_console_data')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .gte('date', dateRange.since)
      .lte('date', dateRange.until)

    // Aggregate by date
    const byDate = new Map<string, {
      clicks: number; impressions: number;
      position_sum: number; position_count: number
    }>()

    for (const row of (data || [])) {
      const existing = byDate.get(row.date) || {
        clicks: 0, impressions: 0, position_sum: 0, position_count: 0,
      }
      existing.clicks += row.clicks || 0
      existing.impressions += row.impressions || 0
      existing.position_sum += Number(row.position) || 0
      existing.position_count += 1
      byDate.set(row.date, existing)
    }

    return Array.from(byDate.entries())
      .map(([date, d]) => ({
        date,
        clicks: d.clicks,
        impressions: d.impressions,
        avg_ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        avg_position: d.position_count > 0 ? d.position_sum / d.position_count : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },
}
