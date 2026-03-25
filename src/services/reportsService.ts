/**
 * REPORTS SERVICE
 * Efeito Digital - Ads Flow
 *
 * Service layer para o sistema de relatórios.
 * CRUD de relatórios, geração de dados, share links.
 */

import supabase from '@/lib/supabase'
import { insightsService } from './metaAdsService'
import type {
  ReportType,
  ReportFilters,
  MetricKey,
  ReportData,
  ReportDataRow,
  DatePreset,
} from '@/types/reports'
// Value helpers used via types/reports re-exports in pages

// =====================================================
// TYPES
// =====================================================

export interface SavedReport {
  id: string
  user_id: string
  client_id: string | null
  ad_account_id: string | null
  name: string
  description: string | null
  report_type: string
  status: string
  filters: ReportFilters
  metrics: MetricKey[]
  data: ReportData | null
  share_token: string | null
  share_expires_at: string | null
  last_generated_at: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// CRUD
// =====================================================

export const reportsService = {
  /**
   * Lista relatórios do usuário
   */
  async list(userId: string, clientId?: string): Promise<SavedReport[]> {
    let query = supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as SavedReport[]
  },

  /**
   * Busca um relatório por ID
   */
  async get(id: string): Promise<SavedReport | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as SavedReport
  },

  /**
   * Busca um relatório por share_token (público)
   */
  async getByShareToken(token: string): Promise<SavedReport | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('share_token', token)
      .single()

    if (error) return null
    return data as SavedReport
  },

  /**
   * Cria um novo relatório
   */
  async create(report: {
    user_id: string
    client_id?: string
    ad_account_id?: string
    name: string
    description?: string
    report_type: ReportType
    filters: ReportFilters
    metrics: MetricKey[]
  }): Promise<SavedReport> {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        ...report,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error
    return data as SavedReport
  },

  /**
   * Atualiza um relatório
   */
  async update(
    id: string,
    updates: Partial<Pick<SavedReport, 'name' | 'description' | 'filters' | 'metrics' | 'status'>>
  ): Promise<SavedReport> {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as SavedReport
  },

  /**
   * Deleta um relatório
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Gera dados do relatório a partir dos insights armazenados
   */
  async generate(report: SavedReport): Promise<ReportData> {
    const { filters, metrics, ad_account_id } = report
    if (!ad_account_id) throw new Error('Ad account not linked to report')

    // Calcular date range
    const dateRange = resolveDateRange(filters.datePreset, filters.customDateRange)

    // Buscar insights
    const campaignInsights = await insightsService.getCampaignInsights({
      adAccountId: ad_account_id,
      dateFrom: dateRange.start,
      dateTo: dateRange.end,
      campaignIds: filters.campaignIds,
    })

    // Build rows baseado no breakdown
    const rows: ReportDataRow[] = []
    const totals: Partial<Record<MetricKey, number>> = {}

    // Agrupar por campanha (default breakdown)
    const byCampaign = new Map<string, typeof campaignInsights>()
    for (const insight of campaignInsights) {
      const key = insight.campaign_id
      if (!byCampaign.has(key)) byCampaign.set(key, [])
      byCampaign.get(key)!.push(insight)
    }

    // Buscar nomes das campanhas
    const campaigns = await insightsService.getCampaigns(ad_account_id)
    const nameMap = new Map(campaigns.map((c) => [c.id, c.name]))

    for (const [campaignId, insights] of byCampaign) {
      const rowMetrics: Partial<Record<MetricKey, number>> = {}

      // Somar métricas
      let totalImpressions = 0
      let totalClicks = 0
      let totalSpend = 0
      let totalConversions = 0
      let totalConversionValue = 0
      let totalReach = 0
      let totalEngagement = 0
      let totalVideoViews = 0
      let totalLeads = 0

      for (const i of insights) {
        totalImpressions += i.impressions
        totalClicks += i.clicks
        totalSpend += i.spend
        totalConversions += i.conversions
        totalConversionValue += i.conversion_value
        totalReach += i.reach
        totalEngagement += i.engagement
        totalVideoViews += i.video_views
        totalLeads += i.leads
      }

      // Mapear para as métricas solicitadas
      const metricValues: Record<string, number> = {
        impressions: totalImpressions,
        reach: totalReach,
        clicks: totalClicks,
        spend: totalSpend,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
        conversions: totalConversions,
        conversion_value: totalConversionValue,
        cost_per_conversion: totalConversions > 0 ? totalSpend / totalConversions : 0,
        conversion_rate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        roas: totalSpend > 0 ? totalConversionValue / totalSpend : 0,
        engagement: totalEngagement,
        video_views: totalVideoViews,
        leads: totalLeads,
        cost_per_lead: totalLeads > 0 ? totalSpend / totalLeads : 0,
        cost_per_result: totalConversions > 0 ? totalSpend / totalConversions : 0,
        frequency: totalReach > 0 ? totalImpressions / totalReach : 0,
      }

      for (const key of metrics) {
        if (key in metricValues) {
          rowMetrics[key] = metricValues[key]
          totals[key] = (totals[key] || 0) + metricValues[key]
        }
      }

      rows.push({
        campaign_id: campaignId,
        campaign_name: nameMap.get(campaignId) || 'Unknown',
        metrics: rowMetrics,
      })
    }

    // Recalcular médias nos totals (CTR, CPC, etc. não devem ser somados)
    const totalImpressions = totals.impressions || 0
    const totalClicks = totals.clicks || 0
    const totalSpend = totals.spend || 0
    const totalConversions = totals.conversions || 0
    const totalConversionValue = totals.conversion_value || 0
    const totalLeads = totals.leads || 0
    const totalReach = totals.reach || 0

    if (metrics.includes('ctr')) totals.ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    if (metrics.includes('cpc')) totals.cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
    if (metrics.includes('cpm')) totals.cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
    if (metrics.includes('roas')) totals.roas = totalSpend > 0 ? totalConversionValue / totalSpend : 0
    if (metrics.includes('cost_per_conversion')) totals.cost_per_conversion = totalConversions > 0 ? totalSpend / totalConversions : 0
    if (metrics.includes('cost_per_lead')) totals.cost_per_lead = totalLeads > 0 ? totalSpend / totalLeads : 0
    if (metrics.includes('conversion_rate')) totals.conversion_rate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
    if (metrics.includes('frequency')) totals.frequency = totalReach > 0 ? (totals.impressions || 0) / totalReach : 0

    const reportData: ReportData = {
      rows,
      totals,
      period: dateRange,
      generatedAt: new Date().toISOString(),
    }

    // Salvar dados no relatório
    await supabase
      .from('reports')
      .update({
        data: reportData,
        status: 'ready',
        last_generated_at: new Date().toISOString(),
      })
      .eq('id', report.id)

    return reportData
  },

  /**
   * Gera um link compartilhável para o relatório
   */
  async createShareLink(reportId: string, expiresInDays = 30): Promise<string> {
    const token = crypto.randomUUID().replace(/-/g, '')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    const { error } = await supabase
      .from('reports')
      .update({
        share_token: token,
        share_expires_at: expiresAt.toISOString(),
      })
      .eq('id', reportId)

    if (error) throw error

    return `${window.location.origin}/report/${token}`
  },

  /**
   * Remove link compartilhável
   */
  async revokeShareLink(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .update({ share_token: null, share_expires_at: null })
      .eq('id', reportId)

    if (error) throw error
  },
}

// =====================================================
// HELPERS
// =====================================================

function resolveDateRange(
  preset: DatePreset,
  custom?: { startDate: string; endDate: string }
): { start: string; end: string } {
  if (preset === 'custom' && custom) {
    return { start: custom.startDate, end: custom.endDate }
  }

  const now = new Date()
  const end = now.toISOString().split('T')[0]
  const start = new Date()

  switch (preset) {
    case 'today':
      return { start: end, end }
    case 'yesterday': {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      const ys = y.toISOString().split('T')[0]
      return { start: ys, end: ys }
    }
    case 'last_7d':
      start.setDate(start.getDate() - 7)
      break
    case 'last_14d':
      start.setDate(start.getDate() - 14)
      break
    case 'last_30d':
      start.setDate(start.getDate() - 30)
      break
    case 'this_month':
      start.setDate(1)
      break
    case 'last_month': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        start: first.toISOString().split('T')[0],
        end: last.toISOString().split('T')[0],
      }
    }
    case 'last_90d':
      start.setDate(start.getDate() - 90)
      break
    case 'this_year':
      start.setMonth(0, 1)
      break
    default:
      start.setDate(start.getDate() - 30)
  }

  return { start: start.toISOString().split('T')[0], end }
}
