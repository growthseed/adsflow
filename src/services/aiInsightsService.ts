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

// =====================================================
// REPORT ANALYSIS (Template-based text generation)
// =====================================================

export interface ReportAnalysisBlock {
  section: string
  text: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

export interface ReportAnalysisResult {
  summary: string
  blocks: ReportAnalysisBlock[]
  recommendations: string[]
  generatedAt: string
}

export interface AggregatedMetrics {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  cpm: number
  roas: number
  frequency: number
  reach: number
  leads: number
  cost_per_lead: number
}

/**
 * Generate natural-language report analysis from aggregated metrics.
 * Template-based (not LLM) — structured text blocks.
 */
export function generateReportAnalysis(
  _clientId: string,
  current: AggregatedMetrics,
  dateRange: { start: string; end: string },
  previous?: AggregatedMetrics
): ReportAnalysisResult {
  const blocks: ReportAnalysisBlock[] = []
  const recommendations: string[] = []

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const fmtNumber = (v: number) => new Intl.NumberFormat('pt-BR').format(Math.round(v))
  const fmtPct = (v: number) => `${v.toFixed(2)}%`

  // ── Summary ──
  const summary = `No período de ${dateRange.start} a ${dateRange.end}, o investimento total foi de ${fmtCurrency(current.spend)} com ${fmtNumber(current.impressions)} impressões, ${fmtNumber(current.clicks)} cliques e ${fmtNumber(current.conversions)} conversões.`

  // ── Investment block ──
  blocks.push({
    section: 'Investimento',
    text: `O investimento total no período foi de ${fmtCurrency(current.spend)}, gerando ${fmtNumber(current.impressions)} impressões e alcançando ${fmtNumber(current.reach)} pessoas.${
      previous && previous.spend > 0
        ? ` Comparado ao período anterior (${fmtCurrency(previous.spend)}), houve uma variação de ${(((current.spend - previous.spend) / previous.spend) * 100).toFixed(1)}%.`
        : ''
    }`,
    sentiment: previous && previous.spend > 0
      ? current.spend <= previous.spend ? 'positive' : 'neutral'
      : 'neutral',
  })

  // ── CTR block ──
  const ctrBenchmark = 1.5 // avg market CTR
  const ctrAbove = current.ctr > ctrBenchmark
  blocks.push({
    section: 'Taxa de Cliques (CTR)',
    text: `O CTR médio foi de ${fmtPct(current.ctr)}, ${
      ctrAbove
        ? `${((current.ctr / ctrBenchmark - 1) * 100).toFixed(0)}% acima da média de mercado (${fmtPct(ctrBenchmark)}). Isso indica boa relevância dos anúncios para o público.`
        : `abaixo da média de mercado (${fmtPct(ctrBenchmark)}). Recomendamos revisar os criativos e a segmentação.`
    }`,
    sentiment: ctrAbove ? 'positive' : 'negative',
  })

  if (!ctrAbove) {
    recommendations.push('Revisar criativos: testar novos formatos de imagem e copy')
    recommendations.push('Refinar segmentação de público para aumentar relevância')
  }

  // ── CPC block ──
  blocks.push({
    section: 'Custo por Clique (CPC)',
    text: `O CPC médio foi de ${fmtCurrency(current.cpc)}.${
      previous && previous.cpc > 0
        ? ` Comparado ao período anterior (${fmtCurrency(previous.cpc)}), ${
            current.cpc > previous.cpc
              ? `houve um aumento de ${(((current.cpc - previous.cpc) / previous.cpc) * 100).toFixed(1)}%. Isso pode indicar aumento de concorrência no leilão.`
              : `houve uma redução de ${(((previous.cpc - current.cpc) / previous.cpc) * 100).toFixed(1)}%. Ótima otimização de custos.`
          }`
        : ''
    }`,
    sentiment: previous && previous.cpc > 0
      ? current.cpc < previous.cpc ? 'positive' : 'negative'
      : 'neutral',
  })

  if (previous && previous.cpc > 0 && current.cpc > previous.cpc * 1.2) {
    recommendations.push('CPC aumentou significativamente — verificar concorrência e ajustar lances')
  }

  // ── Conversions block ──
  blocks.push({
    section: 'Conversões',
    text: `Foram registradas ${fmtNumber(current.conversions)} conversões no período, com taxa de conversão de ${fmtPct(current.clicks > 0 ? (current.conversions / current.clicks) * 100 : 0)}.${
      current.leads > 0 ? ` Total de leads gerados: ${fmtNumber(current.leads)} (CPL: ${fmtCurrency(current.cost_per_lead)}).` : ''
    }`,
    sentiment: current.conversions > 0 ? 'positive' : 'negative',
  })

  // ── ROAS block ──
  if (current.roas > 0) {
    blocks.push({
      section: 'Retorno sobre Investimento (ROAS)',
      text: `O ROAS do período foi de ${current.roas.toFixed(2)}x. ${
        current.roas >= 3
          ? 'Excelente retorno! Considere escalar o investimento nas campanhas de melhor performance.'
          : current.roas >= 1
          ? 'ROAS positivo, mas há espaço para otimização. Analise as campanhas individuais para identificar oportunidades.'
          : 'ROAS abaixo de 1.0x indica prejuízo. Revise urgentemente a estratégia de campanhas.'
      }`,
      sentiment: current.roas >= 3 ? 'positive' : current.roas >= 1 ? 'neutral' : 'negative',
    })

    if (current.roas < 1) {
      recommendations.push('ROAS abaixo de 1.0x — considere pausar campanhas com pior performance')
      recommendations.push('Revisar páginas de destino e jornada de conversão')
    }
  }

  // ── Frequency block ──
  if (current.frequency > 0) {
    blocks.push({
      section: 'Frequência',
      text: `A frequência média foi de ${current.frequency.toFixed(1)}x. ${
        current.frequency > 4
          ? 'Frequência elevada pode causar fadiga de anúncio. Considere renovar criativos ou expandir o público.'
          : current.frequency > 2
          ? 'Frequência dentro de níveis aceitáveis, mas monitore para evitar saturação.'
          : 'Frequência saudável, indicando boa distribuição de entrega.'
      }`,
      sentiment: current.frequency > 4 ? 'negative' : 'positive',
    })

    if (current.frequency > 4) {
      recommendations.push('Frequência alta — renovar criativos e expandir público-alvo')
    }
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Manter estratégia atual e monitorar métricas semanalmente')
    recommendations.push('Testar variações de criativos para melhoria contínua')
  }

  return {
    summary,
    blocks,
    recommendations,
    generatedAt: new Date().toISOString(),
  }
}
