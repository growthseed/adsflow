/**
 * ============================================
 * AI INSIGHTS SERVICE
 * ============================================
 * Client-side insight generation: anomaly detection,
 * opportunity identification, and trend analysis.
 * Compares current vs previous period metrics.
 */

import supabase from '@/lib/supabase'

// =====================================================
// TYPES
// =====================================================

export interface AIInsight {
  id: string
  client_id: string
  ad_account_id: string | null
  type: 'anomaly' | 'opportunity' | 'alert' | 'trend' | 'recommendation'
  severity: 'info' | 'warning' | 'critical' | 'success'
  category: 'cost' | 'performance' | 'creative' | 'audience' | 'budget'
  title: string
  description: string
  metric: string | null
  current_value: number | null
  baseline_value: number | null
  deviation_pct: number | null
  campaign_name: string | null
  campaign_id: string | null
  recommendations: string[]
  is_read: boolean
  is_dismissed: boolean
  is_actioned: boolean
  actioned_at: string | null
  actioned_by: string | null
  generated_at: string
  expires_at: string | null
  created_at: string
}

export interface InsightFilters {
  type?: AIInsight['type']
  severity?: AIInsight['severity']
  category?: AIInsight['category']
  isRead?: boolean
  isDismissed?: boolean
}

export interface MetricSnapshot {
  campaign_id?: string
  campaign_name?: string
  cpc: number
  ctr: number
  roas: number
  spend: number
  conversions: number
  conversion_rate: number
  impressions: number
  reach: number
  frequency: number
  cpl: number
}

// =====================================================
// THRESHOLDS
// =====================================================

const ANOMALY_THRESHOLD = 20 // % deviation to flag as anomaly
const CRITICAL_THRESHOLD = 50 // % deviation to flag as critical
const FREQUENCY_SATURATION = 4.0 // frequency above this is problematic

// =====================================================
// SERVICE
// =====================================================

export const aiInsightsService = {
  /**
   * Fetch insights for a client with optional filters
   */
  async getInsights(clientId: string, filters?: InsightFilters): Promise<AIInsight[]> {
    let query = supabase
      .from('ai_insights')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_dismissed', false)
      .order('generated_at', { ascending: false })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead)
    }
    if (filters?.isDismissed !== undefined) {
      query = query.eq('is_dismissed', filters.isDismissed)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as AIInsight[]
  },

  /**
   * Mark a single insight as read
   */
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('id', id)
    if (error) throw error
  },

  /**
   * Mark all insights for a client as read
   */
  async markAllAsRead(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('client_id', clientId)
      .eq('is_read', false)
    if (error) throw error
  },

  /**
   * Dismiss an insight (soft-hide)
   */
  async dismissInsight(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_dismissed: true })
      .eq('id', id)
    if (error) throw error
  },

  /**
   * Mark an insight as actioned
   */
  async actionInsight(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_insights')
      .update({
        is_actioned: true,
        actioned_at: new Date().toISOString(),
        actioned_by: userId,
      })
      .eq('id', id)
    if (error) throw error
  },

  /**
   * Get count of unread insights (for notification badge)
   */
  async getUnreadCount(clientId: string): Promise<number> {
    const { count, error } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_read', false)
      .eq('is_dismissed', false)

    if (error) return 0
    return count || 0
  },

  /**
   * CLIENT-SIDE insight generation.
   * Compares current period metrics vs previous period metrics
   * and generates insight objects for anomalies, opportunities, and trends.
   * Inserts results into Supabase.
   */
  async generateInsightsFromMetrics(
    clientId: string,
    currentMetrics: MetricSnapshot[],
    previousMetrics: MetricSnapshot[],
    adAccountId?: string
  ): Promise<AIInsight[]> {
    const insights: Omit<AIInsight, 'id' | 'created_at'>[] = []

    // Build previous-period lookup by campaign
    const prevMap = new Map<string, MetricSnapshot>()
    for (const m of previousMetrics) {
      if (m.campaign_id) prevMap.set(m.campaign_id, m)
    }

    // Aggregate totals
    const currentTotal = aggregateMetrics(currentMetrics)
    const previousTotal = aggregateMetrics(previousMetrics)

    // ── Account-level checks ──

    // CPC change
    checkMetricChange({
      insights,
      clientId,
      adAccountId,
      metric: 'cpc',
      label: 'CPC',
      current: currentTotal.cpc,
      baseline: previousTotal.cpc,
      higherIsBad: true,
      category: 'cost',
    })

    // CTR change
    checkMetricChange({
      insights,
      clientId,
      adAccountId,
      metric: 'ctr',
      label: 'CTR',
      current: currentTotal.ctr,
      baseline: previousTotal.ctr,
      higherIsBad: false,
      category: 'performance',
    })

    // ROAS change
    checkMetricChange({
      insights,
      clientId,
      adAccountId,
      metric: 'roas',
      label: 'ROAS',
      current: currentTotal.roas,
      baseline: previousTotal.roas,
      higherIsBad: false,
      category: 'performance',
    })

    // Spend pace
    if (previousTotal.spend > 0) {
      const spendChange = ((currentTotal.spend - previousTotal.spend) / previousTotal.spend) * 100
      if (Math.abs(spendChange) > ANOMALY_THRESHOLD) {
        insights.push({
          client_id: clientId,
          ad_account_id: adAccountId || null,
          type: spendChange > 0 ? 'alert' : 'anomaly',
          severity: Math.abs(spendChange) > CRITICAL_THRESHOLD ? 'critical' : 'warning',
          category: 'budget',
          title: spendChange > 0
            ? `Gasto ${spendChange.toFixed(0)}% acima do periodo anterior`
            : `Gasto ${Math.abs(spendChange).toFixed(0)}% abaixo do periodo anterior`,
          description: spendChange > 0
            ? `O investimento subiu de R$ ${previousTotal.spend.toFixed(2)} para R$ ${currentTotal.spend.toFixed(2)}. Verifique se os orçamentos estão alinhados com a estrategia.`
            : `O investimento caiu de R$ ${previousTotal.spend.toFixed(2)} para R$ ${currentTotal.spend.toFixed(2)}. Pode indicar pausas ou limites de orçamento atingidos.`,
          metric: 'spend',
          current_value: currentTotal.spend,
          baseline_value: previousTotal.spend,
          deviation_pct: spendChange,
          campaign_name: null,
          campaign_id: null,
          recommendations: spendChange > 0
            ? ['Revisar orçamentos diários', 'Avaliar se o ROAS justifica o aumento']
            : ['Verificar campanhas pausadas', 'Avaliar limites de conta'],
          is_read: false,
          is_dismissed: false,
          is_actioned: false,
          actioned_at: null,
          actioned_by: null,
          generated_at: new Date().toISOString(),
          expires_at: getExpiryDate(),
        })
      }
    }

    // Conversion rate drop
    checkMetricChange({
      insights,
      clientId,
      adAccountId,
      metric: 'conversion_rate',
      label: 'Taxa de Conversão',
      current: currentTotal.conversion_rate,
      baseline: previousTotal.conversion_rate,
      higherIsBad: false,
      category: 'performance',
    })

    // ── Campaign-level checks ──

    for (const current of currentMetrics) {
      if (!current.campaign_id) continue
      const prev = prevMap.get(current.campaign_id)
      if (!prev) continue

      // Frequency saturation
      if (current.frequency > FREQUENCY_SATURATION) {
        insights.push({
          client_id: clientId,
          ad_account_id: adAccountId || null,
          type: 'alert',
          severity: current.frequency > 6 ? 'critical' : 'warning',
          category: 'audience',
          title: `Frequência elevada: ${current.frequency.toFixed(1)}x`,
          description: `A campanha "${current.campaign_name}" está com frequência de ${current.frequency.toFixed(1)}. Acima de ${FREQUENCY_SATURATION}x pode causar fadiga de anúncio e aumento de custos.`,
          metric: 'frequency',
          current_value: current.frequency,
          baseline_value: FREQUENCY_SATURATION,
          deviation_pct: ((current.frequency - FREQUENCY_SATURATION) / FREQUENCY_SATURATION) * 100,
          campaign_name: current.campaign_name || null,
          campaign_id: current.campaign_id,
          recommendations: [
            'Expandir público-alvo',
            'Renovar criativos',
            'Considerar pausar e reativar com novo público',
          ],
          is_read: false,
          is_dismissed: false,
          is_actioned: false,
          actioned_at: null,
          actioned_by: null,
          generated_at: new Date().toISOString(),
          expires_at: getExpiryDate(),
        })
      }

      // Campaign CPC spike
      if (prev.cpc > 0) {
        const cpcChange = ((current.cpc - prev.cpc) / prev.cpc) * 100
        if (cpcChange > ANOMALY_THRESHOLD) {
          insights.push({
            client_id: clientId,
            ad_account_id: adAccountId || null,
            type: 'anomaly',
            severity: cpcChange > CRITICAL_THRESHOLD ? 'critical' : 'warning',
            category: 'cost',
            title: `CPC subiu ${cpcChange.toFixed(0)}% em "${current.campaign_name}"`,
            description: `O CPC da campanha "${current.campaign_name}" subiu de R$ ${prev.cpc.toFixed(2)} para R$ ${current.cpc.toFixed(2)}.`,
            metric: 'cpc',
            current_value: current.cpc,
            baseline_value: prev.cpc,
            deviation_pct: cpcChange,
            campaign_name: current.campaign_name || null,
            campaign_id: current.campaign_id,
            recommendations: [
              'Revisar segmentação de público',
              'Testar novos criativos',
              'Verificar concorrência no leilão',
            ],
            is_read: false,
            is_dismissed: false,
            is_actioned: false,
            actioned_at: null,
            actioned_by: null,
            generated_at: new Date().toISOString(),
            expires_at: getExpiryDate(),
          })
        }
      }

      // Campaign ROAS opportunity
      if (prev.roas > 0 && current.roas > prev.roas * 1.2) {
        const roasChange = ((current.roas - prev.roas) / prev.roas) * 100
        insights.push({
          client_id: clientId,
          ad_account_id: adAccountId || null,
          type: 'opportunity',
          severity: 'success',
          category: 'performance',
          title: `ROAS subiu ${roasChange.toFixed(0)}% em "${current.campaign_name}"`,
          description: `A campanha "${current.campaign_name}" está performando bem com ROAS de ${current.roas.toFixed(2)}x (era ${prev.roas.toFixed(2)}x). Considere escalar o investimento.`,
          metric: 'roas',
          current_value: current.roas,
          baseline_value: prev.roas,
          deviation_pct: roasChange,
          campaign_name: current.campaign_name || null,
          campaign_id: current.campaign_id,
          recommendations: [
            'Aumentar orçamento gradualmente (20-30%)',
            'Duplicar campanha para novo público',
            'Analisar criativos de melhor performance',
          ],
          is_read: false,
          is_dismissed: false,
          is_actioned: false,
          actioned_at: null,
          actioned_by: null,
          generated_at: new Date().toISOString(),
          expires_at: getExpiryDate(),
        })
      }
    }

    // ── Insert into Supabase ──
    if (insights.length > 0) {
      const { data, error } = await supabase
        .from('ai_insights')
        .insert(insights)
        .select()

      if (error) throw error
      return (data || []) as AIInsight[]
    }

    return []
  },
}

// =====================================================
// HELPERS
// =====================================================

function aggregateMetrics(metrics: MetricSnapshot[]): MetricSnapshot {
  let totalImpressions = 0
  let totalClicks = 0
  let totalSpend = 0
  let totalConversions = 0
  let totalConversionValue = 0
  let totalReach = 0
  let totalLeads = 0

  for (const m of metrics) {
    totalImpressions += m.impressions || 0
    totalClicks += (m.ctr / 100) * (m.impressions || 0) // derive clicks from CTR
    totalSpend += m.spend || 0
    totalConversions += m.conversions || 0
    totalConversionValue += (m.roas || 0) * (m.spend || 0)
    totalReach += m.reach || 0
    totalLeads += m.cpl > 0 ? m.spend / m.cpl : 0
  }

  return {
    cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    roas: totalSpend > 0 ? totalConversionValue / totalSpend : 0,
    spend: totalSpend,
    conversions: totalConversions,
    conversion_rate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    impressions: totalImpressions,
    reach: totalReach,
    frequency: totalReach > 0 ? totalImpressions / totalReach : 0,
    cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
  }
}

function checkMetricChange(params: {
  insights: Omit<AIInsight, 'id' | 'created_at'>[]
  clientId: string
  adAccountId?: string
  metric: string
  label: string
  current: number
  baseline: number
  higherIsBad: boolean
  category: AIInsight['category']
}) {
  const { insights, clientId, adAccountId, metric, label, current, baseline, higherIsBad, category } = params
  if (baseline === 0) return

  const change = ((current - baseline) / baseline) * 100
  if (Math.abs(change) < ANOMALY_THRESHOLD) return

  const isNegativeChange = higherIsBad ? change > 0 : change < 0
  const severity: AIInsight['severity'] = Math.abs(change) > CRITICAL_THRESHOLD ? 'critical' : 'warning'

  insights.push({
    client_id: clientId,
    ad_account_id: adAccountId || null,
    type: isNegativeChange ? 'anomaly' : 'opportunity',
    severity: isNegativeChange ? severity : 'success',
    category,
    title: `${label} ${change > 0 ? 'subiu' : 'caiu'} ${Math.abs(change).toFixed(0)}%`,
    description: `O ${label} ${change > 0 ? 'aumentou' : 'diminuiu'} de ${baseline.toFixed(2)} para ${current.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(1)}%).`,
    metric,
    current_value: current,
    baseline_value: baseline,
    deviation_pct: change,
    campaign_name: null,
    campaign_id: null,
    recommendations: isNegativeChange
      ? [`Investigar causa da variação de ${label}`, 'Comparar com benchmarks do segmento', 'Revisar configurações de campanha']
      : [`${label} melhorou! Analisar o que mudou`, 'Considerar escalar a estratégia'],
    is_read: false,
    is_dismissed: false,
    is_actioned: false,
    actioned_at: null,
    actioned_by: null,
    generated_at: new Date().toISOString(),
    expires_at: getExpiryDate(),
  })
}

function getExpiryDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7) // insights expire after 7 days
  return d.toISOString()
}
