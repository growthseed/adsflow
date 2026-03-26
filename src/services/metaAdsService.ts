/**
 * META ADS SERVICE
 * Efeito Digital - Ads Flow
 *
 * Service layer para integração com Meta Ads via N8N.
 * Gerencia contas, sincronização, cache de insights e logs.
 *
 * Fluxo: Frontend → N8N Webhook → Meta Graph API → N8N → Supabase
 */

import supabase from '@/lib/supabase'
import type {
  AdAccount,
  AdAccountInsert,
  CampaignCache,
  CampaignInsight,
  AdsetInsight,
  AdInsight,
  SyncLog,
} from '@/types/database'

// =====================================================
// CONFIG
// =====================================================

const N8N_BASE_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL ||
  'https://ia-kommo-n8n.xl78rn.easypanel.host/webhook'

// =====================================================
// TYPES — Respostas do N8N
// =====================================================

export interface N8NSyncPayload {
  ad_account_id: string
  sync_type: 'full' | 'incremental' | 'manual'
  date_range?: {
    since: string // YYYY-MM-DD
    until: string // YYYY-MM-DD
  }
  level?: 'campaign' | 'adset' | 'ad' | 'all'
}

export interface N8NCampaignData {
  platform_campaign_id: string
  name: string
  objective: string | null
  status: string
  daily_budget: number | null
  lifetime_budget: number | null
  start_date: string | null
  end_date: string | null
}

export interface N8NInsightData {
  platform_campaign_id: string
  platform_adset_id?: string
  platform_ad_id?: string
  adset_name?: string
  ad_name?: string
  date: string
  impressions: number
  reach: number
  clicks: number
  spend: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  conversion_value: number
  cost_per_conversion: number
  roas: number
  frequency: number
  engagement: number
  post_reactions: number
  post_comments: number
  post_shares: number
  post_saves?: number
  video_views: number
  video_thruplay: number
  video_p25?: number
  video_p50?: number
  video_p75?: number
  video_p100?: number
  leads: number
  cost_per_lead: number
  hook_rate?: number | null
  hold_rate?: number | null
  creative_id?: string | null
  creative_thumbnail_url?: string | null
  breakdown?: Record<string, unknown> | null
  raw_data?: Record<string, unknown> | null
}

export interface N8NSyncResponse {
  success: boolean
  message?: string
  campaigns?: N8NCampaignData[]
  campaign_insights?: N8NInsightData[]
  adset_insights?: N8NInsightData[]
  ad_insights?: N8NInsightData[]
  error?: string
}

export interface SyncProgress {
  status: 'idle' | 'syncing' | 'completed' | 'failed'
  campaignsSynced: number
  adsetsSynced: number
  adsSynced: number
  insightsSynced: number
  error?: string
}

// =====================================================
// AD ACCOUNTS — CRUD
// =====================================================

export const adAccountsService = {
  /**
   * Lista todas as contas de anúncio do usuário
   */
  async list(userId: string): Promise<AdAccount[]> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Lista contas por client_id (multi-tenant)
   */
  async listByClient(clientId: string): Promise<AdAccount[]> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Busca uma conta por ID
   */
  async get(id: string): Promise<AdAccount | null> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  /**
   * Conecta uma nova conta de anúncio
   */
  async connect(account: AdAccountInsert): Promise<AdAccount> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .insert(account)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Atualiza uma conta (status, tokens, etc.)
   */
  async update(
    id: string,
    updates: Partial<AdAccount>
  ): Promise<AdAccount> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Desconecta (soft delete) uma conta
   */
  async disconnect(id: string): Promise<void> {
    const { error } = await supabase
      .from('ad_accounts')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Remove permanentemente uma conta e todos os dados associados.
   * Relies on ON DELETE CASCADE foreign keys in the database —
   * deleting ad_accounts cascades to campaign_insights, adset_insights,
   * ad_insights, campaigns_cache, and sync_logs.
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// =====================================================
// SYNC ENGINE — N8N Integration
// =====================================================

export const syncService = {
  /**
   * Dispara sincronização completa via N8N webhook
   */
  async triggerSync(payload: N8NSyncPayload): Promise<N8NSyncResponse> {
    const response = await fetch(`${N8N_BASE_URL}/adsflow/meta-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`N8N sync failed (${response.status}): ${errorText}`)
    }

    return response.json()
  },

  /**
   * Executa sync completo: N8N → Parse → Supabase
   * Retorna progresso em tempo real via callback
   */
  async fullSync(
    adAccountId: string,
    dateRange?: { since: string; until: string },
    onProgress?: (progress: SyncProgress) => void
  ): Promise<SyncLog> {
    const startedAt = new Date().toISOString()
    const progress: SyncProgress = {
      status: 'syncing',
      campaignsSynced: 0,
      adsetsSynced: 0,
      adsSynced: 0,
      insightsSynced: 0,
    }

    // 1. Criar sync log
    const { data: syncLog, error: logError } = await supabase
      .from('sync_logs')
      .insert({
        ad_account_id: adAccountId,
        sync_type: 'full' as const,
        status: 'started' as const,
        date_range_start: dateRange?.since || null,
        date_range_end: dateRange?.until || null,
        started_at: startedAt,
      })
      .select()
      .single()

    if (logError) throw logError

    try {
      onProgress?.(progress)

      // 2. Buscar account_id da plataforma
      const account = await adAccountsService.get(adAccountId)
      if (!account) throw new Error('Ad account not found')

      // 3. Trigger N8N sync
      const n8nResponse = await this.triggerSync({
        ad_account_id: account.account_id,
        sync_type: 'full',
        date_range: dateRange,
        level: 'all',
      })

      if (!n8nResponse.success) {
        throw new Error(n8nResponse.error || 'Sync failed')
      }

      // 4. Processar campanhas
      if (n8nResponse.campaigns) {
        await this.upsertCampaigns(adAccountId, n8nResponse.campaigns)
        progress.campaignsSynced = n8nResponse.campaigns.length
        onProgress?.(progress)
      }

      // 4b. Fetch campaign ID map ONCE (used by all 3 insight upserts)
      const campaignIdMap = await getCampaignIdMap(adAccountId)

      // 5. Processar campaign insights
      if (n8nResponse.campaign_insights) {
        await this.upsertCampaignInsights(adAccountId, n8nResponse.campaign_insights, campaignIdMap)
        progress.insightsSynced += n8nResponse.campaign_insights.length
        onProgress?.(progress)
      }

      // 6. Processar adset insights
      if (n8nResponse.adset_insights) {
        await this.upsertAdsetInsights(adAccountId, n8nResponse.adset_insights, campaignIdMap)
        progress.adsetsSynced = n8nResponse.adset_insights.length
        onProgress?.(progress)
      }

      // 7. Processar ad insights
      if (n8nResponse.ad_insights) {
        await this.upsertAdInsights(adAccountId, n8nResponse.ad_insights, campaignIdMap)
        progress.adsSynced = n8nResponse.ad_insights.length
        onProgress?.(progress)
      }

      // 8. Atualizar sync log — completed
      const completedAt = new Date().toISOString()
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime()

      const { data: updatedLog, error: updateErr } = await supabase
        .from('sync_logs')
        .update({
          status: 'completed' as const,
          campaigns_synced: progress.campaignsSynced,
          adsets_synced: progress.adsetsSynced,
          ads_synced: progress.adsSynced,
          insights_synced: progress.insightsSynced,
          duration_ms: durationMs,
          completed_at: completedAt,
        })
        .eq('id', syncLog.id)
        .select()
        .single()

      if (updateErr) throw updateErr

      // 9. Atualizar last_sync_at na conta
      await adAccountsService.update(adAccountId, {
        last_sync_at: completedAt,
        sync_error: null,
        status: 'active',
      })

      progress.status = 'completed'
      onProgress?.(progress)

      return updatedLog

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      // Atualizar sync log — failed
      await supabase
        .from('sync_logs')
        .update({
          status: 'failed' as const,
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id)

      // Marcar conta com erro
      await adAccountsService.update(adAccountId, {
        sync_error: errorMessage,
        status: 'error',
      })

      progress.status = 'failed'
      progress.error = errorMessage
      onProgress?.(progress)

      throw err
    }
  },

  /**
   * Upsert campanhas no cache
   */
  async upsertCampaigns(
    adAccountId: string,
    campaigns: N8NCampaignData[]
  ): Promise<void> {
    if (campaigns.length === 0) return

    const now = new Date().toISOString()
    const rows = campaigns.map((c) => ({
      ad_account_id: adAccountId,
      platform_campaign_id: c.platform_campaign_id,
      name: c.name,
      objective: c.objective,
      status: c.status,
      daily_budget: c.daily_budget,
      lifetime_budget: c.lifetime_budget,
      start_date: c.start_date,
      end_date: c.end_date,
      updated_at: now,
    }))

    const { error } = await supabase
      .from('campaigns_cache')
      .upsert(rows, { onConflict: 'ad_account_id,platform_campaign_id' })

    if (error) {
      console.error('Error upserting campaigns:', error)
    }
  },

  /**
   * Upsert campaign insights
   */
  async upsertCampaignInsights(
    adAccountId: string,
    insights: N8NInsightData[],
    campaignIdMap?: Map<string, string>
  ): Promise<void> {
    // Use pre-fetched map or fetch now
    const campaignIds = campaignIdMap ?? await getCampaignIdMap(adAccountId)

    const rows = insights.map((i) => ({
      ad_account_id: adAccountId,
      campaign_id: campaignIds.get(i.platform_campaign_id) || '',
      platform_campaign_id: i.platform_campaign_id,
      date: i.date,
      impressions: i.impressions,
      reach: i.reach,
      clicks: i.clicks,
      spend: i.spend,
      ctr: i.ctr,
      cpc: i.cpc,
      cpm: i.cpm,
      conversions: i.conversions,
      conversion_value: i.conversion_value,
      cost_per_conversion: i.cost_per_conversion,
      roas: i.roas,
      frequency: i.frequency,
      engagement: i.engagement,
      post_reactions: i.post_reactions,
      post_comments: i.post_comments,
      post_shares: i.post_shares,
      video_views: i.video_views,
      video_thruplay: i.video_thruplay,
      leads: i.leads,
      cost_per_lead: i.cost_per_lead,
      breakdown: i.breakdown || null,
      raw_data: i.raw_data || null,
    }))

    // Filter out rows with empty campaign_id (not in cache)
    const validRows = rows.filter((r) => r.campaign_id)

    if (validRows.length > 0) {
      const { error } = await supabase
        .from('campaign_insights')
        .upsert(validRows, {
          onConflict: 'ad_account_id,platform_campaign_id,date',
        })

      if (error) console.error('Error upserting campaign insights:', error)
    }
  },

  /**
   * Upsert adset insights
   */
  async upsertAdsetInsights(
    adAccountId: string,
    insights: N8NInsightData[],
    campaignIdMap?: Map<string, string>
  ): Promise<void> {
    const campaignIds = campaignIdMap ?? await getCampaignIdMap(adAccountId)

    const rows = insights
      .filter((i) => i.platform_adset_id)
      .map((i) => ({
        ad_account_id: adAccountId,
        campaign_id: campaignIds.get(i.platform_campaign_id) || '',
        platform_adset_id: i.platform_adset_id!,
        adset_name: i.adset_name || '',
        date: i.date,
        impressions: i.impressions,
        reach: i.reach,
        clicks: i.clicks,
        spend: i.spend,
        ctr: i.ctr,
        cpc: i.cpc,
        cpm: i.cpm,
        conversions: i.conversions,
        cost_per_conversion: i.cost_per_conversion,
        roas: i.roas,
        leads: i.leads,
        cost_per_lead: i.cost_per_lead,
        raw_data: i.raw_data || null,
      }))

    const validRows = rows.filter((r) => r.campaign_id)

    if (validRows.length > 0) {
      const { error } = await supabase
        .from('adset_insights')
        .upsert(validRows, {
          onConflict: 'ad_account_id,platform_adset_id,date',
        })

      if (error) console.error('Error upserting adset insights:', error)
    }
  },

  /**
   * Upsert ad insights
   */
  async upsertAdInsights(
    adAccountId: string,
    insights: N8NInsightData[],
    campaignIdMap?: Map<string, string>
  ): Promise<void> {
    const campaignIds = campaignIdMap ?? await getCampaignIdMap(adAccountId)

    const rows = insights
      .filter((i) => i.platform_ad_id)
      .map((i) => ({
        ad_account_id: adAccountId,
        campaign_id: campaignIds.get(i.platform_campaign_id) || '',
        platform_adset_id: i.platform_adset_id || '',
        platform_ad_id: i.platform_ad_id!,
        ad_name: i.ad_name || '',
        date: i.date,
        impressions: i.impressions,
        reach: i.reach,
        clicks: i.clicks,
        spend: i.spend,
        ctr: i.ctr,
        cpc: i.cpc,
        cpm: i.cpm,
        conversions: i.conversions,
        cost_per_conversion: i.cost_per_conversion,
        roas: i.roas,
        hook_rate: i.hook_rate ?? null,
        hold_rate: i.hold_rate ?? null,
        engagement: i.engagement,
        post_reactions: i.post_reactions,
        post_comments: i.post_comments,
        post_shares: i.post_shares,
        post_saves: i.post_saves || 0,
        video_views: i.video_views,
        video_thruplay: i.video_thruplay,
        video_p25: i.video_p25 || 0,
        video_p50: i.video_p50 || 0,
        video_p75: i.video_p75 || 0,
        video_p100: i.video_p100 || 0,
        creative_id: i.creative_id ?? null,
        creative_thumbnail_url: i.creative_thumbnail_url ?? null,
        raw_data: i.raw_data || null,
      }))

    const validRows = rows.filter((r) => r.campaign_id)

    if (validRows.length > 0) {
      const { error } = await supabase
        .from('ad_insights')
        .upsert(validRows, {
          onConflict: 'ad_account_id,platform_ad_id,date',
        })

      if (error) console.error('Error upserting ad insights:', error)
    }
  },
}

// =====================================================
// DATA FETCHING — Queries para Dashboards
// =====================================================

export interface InsightsFilters {
  adAccountId: string
  dateFrom?: string
  dateTo?: string
  campaignIds?: string[]
  status?: string
}

export interface AggregatedMetrics {
  impressions: number
  reach: number
  clicks: number
  spend: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  roas: number
  leads: number
  cost_per_lead: number
  engagement: number
  video_views: number
}

export const insightsService = {
  /**
   * Busca campanhas em cache para uma conta
   */
  async getCampaigns(adAccountId: string): Promise<CampaignCache[]> {
    const { data, error } = await supabase
      .from('campaigns_cache')
      .select('*')
      .eq('ad_account_id', adAccountId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Busca insights de campanha com filtros
   */
  async getCampaignInsights(
    filters: InsightsFilters
  ): Promise<CampaignInsight[]> {
    let query = supabase
      .from('campaign_insights')
      .select('*')
      .eq('ad_account_id', filters.adAccountId)

    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo)
    }
    if (filters.campaignIds?.length) {
      query = query.in('campaign_id', filters.campaignIds)
    }

    query = query.order('date', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  /**
   * Busca insights de adset com filtros
   */
  async getAdsetInsights(filters: InsightsFilters): Promise<AdsetInsight[]> {
    let query = supabase
      .from('adset_insights')
      .select('*')
      .eq('ad_account_id', filters.adAccountId)

    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo)
    }
    if (filters.campaignIds?.length) {
      query = query.in('campaign_id', filters.campaignIds)
    }

    query = query.order('date', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  /**
   * Busca insights de anúncios individuais com filtros
   */
  async getAdInsights(filters: InsightsFilters): Promise<AdInsight[]> {
    let query = supabase
      .from('ad_insights')
      .select('*')
      .eq('ad_account_id', filters.adAccountId)

    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo)
    }
    if (filters.campaignIds?.length) {
      query = query.in('campaign_id', filters.campaignIds)
    }

    query = query.order('date', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  /**
   * Agrega métricas totais de um período
   */
  async getAggregatedMetrics(
    filters: InsightsFilters
  ): Promise<AggregatedMetrics> {
    const insights = await this.getCampaignInsights(filters)

    if (insights.length === 0) {
      return {
        impressions: 0,
        reach: 0,
        clicks: 0,
        spend: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        conversions: 0,
        roas: 0,
        leads: 0,
        cost_per_lead: 0,
        engagement: 0,
        video_views: 0,
      }
    }

    const totals = insights.reduce(
      (acc, row) => ({
        impressions: acc.impressions + row.impressions,
        reach: acc.reach + row.reach,
        clicks: acc.clicks + row.clicks,
        spend: acc.spend + row.spend,
        conversions: acc.conversions + row.conversions,
        conversion_value: acc.conversion_value + row.conversion_value,
        leads: acc.leads + row.leads,
        engagement: acc.engagement + row.engagement,
        video_views: acc.video_views + row.video_views,
      }),
      {
        impressions: 0,
        reach: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        conversion_value: 0,
        leads: 0,
        engagement: 0,
        video_views: 0,
      }
    )

    return {
      ...totals,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
      roas: totals.spend > 0 ? totals.conversion_value / totals.spend : 0,
      cost_per_lead: totals.leads > 0 ? totals.spend / totals.leads : 0,
    }
  },

  /**
   * Busca métricas agrupadas por dia (para gráficos de timeseries)
   */
  async getDailyMetrics(
    filters: InsightsFilters
  ): Promise<
    Array<{
      date: string
      impressions: number
      clicks: number
      spend: number
      conversions: number
      leads: number
      ctr: number
      cpc: number
      roas: number
    }>
  > {
    const insights = await this.getCampaignInsights(filters)

    // Agrupar por data
    const byDate = new Map<
      string,
      { impressions: number; clicks: number; spend: number; conversions: number; conversion_value: number; leads: number }
    >()

    for (const row of insights) {
      const existing = byDate.get(row.date) || {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        conversion_value: 0,
        leads: 0,
      }
      byDate.set(row.date, {
        impressions: existing.impressions + row.impressions,
        clicks: existing.clicks + row.clicks,
        spend: existing.spend + row.spend,
        conversions: existing.conversions + row.conversions,
        conversion_value: existing.conversion_value + row.conversion_value,
        leads: existing.leads + row.leads,
      })
    }

    return Array.from(byDate.entries())
      .map(([date, d]) => ({
        date,
        impressions: d.impressions,
        clicks: d.clicks,
        spend: d.spend,
        conversions: d.conversions,
        leads: d.leads,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
        roas: d.spend > 0 ? d.conversion_value / d.spend : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },

  /**
   * Busca top campanhas por spend ou conversões
   */
  async getTopCampaigns(
    filters: InsightsFilters,
    sortBy: 'spend' | 'conversions' | 'roas' | 'clicks' = 'spend',
    limit = 10
  ): Promise<
    Array<{
      campaign_id: string
      campaign_name: string
      impressions: number
      clicks: number
      spend: number
      conversions: number
      roas: number
      ctr: number
      cpc: number
    }>
  > {
    const insights = await this.getCampaignInsights(filters)
    const campaigns = await this.getCampaigns(filters.adAccountId)
    const campaignMap = new Map(campaigns.map((c) => [c.id, c]))

    // Agrupar por campaign
    const byCampaign = new Map<
      string,
      { impressions: number; clicks: number; spend: number; conversions: number; conversion_value: number }
    >()

    for (const row of insights) {
      const existing = byCampaign.get(row.campaign_id) || {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        conversion_value: 0,
      }
      byCampaign.set(row.campaign_id, {
        impressions: existing.impressions + row.impressions,
        clicks: existing.clicks + row.clicks,
        spend: existing.spend + row.spend,
        conversions: existing.conversions + row.conversions,
        conversion_value: existing.conversion_value + row.conversion_value,
      })
    }

    return Array.from(byCampaign.entries())
      .map(([campaignId, d]) => ({
        campaign_id: campaignId,
        campaign_name: campaignMap.get(campaignId)?.name || 'Unknown',
        impressions: d.impressions,
        clicks: d.clicks,
        spend: d.spend,
        conversions: d.conversions,
        roas: d.spend > 0 ? d.conversion_value / d.spend : 0,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
      }))
      .sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number))
      .slice(0, limit)
  },

  /**
   * Busca top criativos por performance (hook_rate, hold_rate, CTR)
   */
  async getTopCreatives(
    filters: InsightsFilters,
    limit = 10
  ): Promise<
    Array<{
      ad_name: string
      creative_thumbnail_url: string | null
      impressions: number
      clicks: number
      spend: number
      ctr: number
      hook_rate: number | null
      hold_rate: number | null
    }>
  > {
    const insights = await this.getAdInsights(filters)

    // Agrupar por ad
    const byAd = new Map<
      string,
      {
        ad_name: string
        creative_thumbnail_url: string | null
        impressions: number
        clicks: number
        spend: number
        hook_rates: number[]
        hold_rates: number[]
      }
    >()

    for (const row of insights) {
      const key = row.platform_ad_id
      const existing = byAd.get(key) || {
        ad_name: row.ad_name,
        creative_thumbnail_url: row.creative_thumbnail_url,
        impressions: 0,
        clicks: 0,
        spend: 0,
        hook_rates: [],
        hold_rates: [],
      }

      existing.impressions += row.impressions
      existing.clicks += row.clicks
      existing.spend += row.spend
      if (row.hook_rate != null) existing.hook_rates.push(row.hook_rate)
      if (row.hold_rate != null) existing.hold_rates.push(row.hold_rate)

      byAd.set(key, existing)
    }

    return Array.from(byAd.values())
      .map((d) => ({
        ad_name: d.ad_name,
        creative_thumbnail_url: d.creative_thumbnail_url,
        impressions: d.impressions,
        clicks: d.clicks,
        spend: d.spend,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        hook_rate:
          d.hook_rates.length > 0
            ? d.hook_rates.reduce((a, b) => a + b, 0) / d.hook_rates.length
            : null,
        hold_rate:
          d.hold_rates.length > 0
            ? d.hold_rates.reduce((a, b) => a + b, 0) / d.hold_rates.length
            : null,
      }))
      .sort((a, b) => (b.hook_rate ?? b.ctr) - (a.hook_rate ?? a.ctr))
      .slice(0, limit)
  },
}

// =====================================================
// SYNC LOGS — Histórico
// =====================================================

export const syncLogsService = {
  /**
   * Lista logs de sincronização de uma conta
   */
  async list(adAccountId: string, limit = 20): Promise<SyncLog[]> {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('ad_account_id', adAccountId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Busca o último sync bem-sucedido
   */
  async getLastSuccessful(adAccountId: string): Promise<SyncLog | null> {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('ad_account_id', adAccountId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data
  },
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Monta um mapa platform_campaign_id → campaigns_cache.id
 */
async function getCampaignIdMap(
  adAccountId: string
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from('campaigns_cache')
    .select('id, platform_campaign_id')
    .eq('ad_account_id', adAccountId)

  const map = new Map<string, string>()
  if (data) {
    for (const row of data) {
      map.set(row.platform_campaign_id, row.id)
    }
  }
  return map
}

/**
 * Formata data para range padrão (últimos N dias)
 */
export function getDateRange(days: number): { since: string; until: string } {
  const until = new Date()
  const since = new Date()
  since.setDate(since.getDate() - days)

  return {
    since: since.toISOString().split('T')[0],
    until: until.toISOString().split('T')[0],
  }
}
