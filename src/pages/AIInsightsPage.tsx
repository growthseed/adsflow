/**
 * ============================================
 * AI INSIGHTS PAGE
 * ============================================
 * Exibe insights gerados por IA: anomalias,
 * oportunidades, alertas e recomendações.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Bell,
  Lightbulb,
  CheckCircle,
  Eye,
  EyeOff,
  ThumbsUp,
  Loader2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Target,
  BarChart3,
  Zap,
  FileText,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/UI/Toast'
import { aiInsightsService, generateReportAnalysis } from '@/services/aiInsightsService'
import type { AIInsight, InsightFilters, ReportAnalysisResult, AggregatedMetrics } from '@/services/aiInsightsService'

// =====================================================
// CONSTANTS
// =====================================================

const TYPE_CONFIG: Record<
  AIInsight['type'],
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  anomaly: { label: 'Anomalia', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
  opportunity: { label: 'Oportunidade', icon: TrendingUp, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  alert: { label: 'Alerta', icon: Bell, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  trend: { label: 'Tendência', icon: ArrowUpRight, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  recommendation: { label: 'Recomendação', icon: Lightbulb, color: 'text-purple-600', bgColor: 'bg-purple-50' },
}

const SEVERITY_CONFIG: Record<
  AIInsight['severity'],
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  critical: { label: 'Crítico', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-300' },
  warning: { label: 'Atenção', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
  success: { label: 'Positivo', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' },
  info: { label: 'Info', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
}

const FILTER_TABS: Array<{ key: AIInsight['type'] | 'all'; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'anomaly', label: 'Anomalias' },
  { key: 'opportunity', label: 'Oportunidades' },
  { key: 'alert', label: 'Alertas' },
  { key: 'recommendation', label: 'Recomendações' },
]

// =====================================================
// AI ASSISTANT DEFINITIONS
// =====================================================

interface AIAssistantDef {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
}

const AI_ASSISTANTS: AIAssistantDef[] = [
  {
    id: 'traffic',
    title: 'Assistente de Tráfego Pago',
    description: 'Analise suas campanhas Meta e Google e receba sugestões de otimização',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'performance',
    title: 'Assistente de Performance',
    description: 'Compare períodos e identifique tendências',
    icon: BarChart3,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'conversion',
    title: 'Assistente de Conversão',
    description: 'Análise da jornada do lead até a venda',
    icon: Zap,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    id: 'report',
    title: 'Gerador de Relatório IA',
    description: 'Gere um relatório completo com análise automática',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
]

// =====================================================
// AI ASSISTANT CARD COMPONENT
// =====================================================

function AIAssistantCard({ assistant }: { assistant: AIAssistantDef }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReportAnalysisResult | null>(null)
  const [copied, setCopied] = useState(false)
  const Icon = assistant.icon

  const handleGenerate = () => {
    if (result) {
      setExpanded(!expanded)
      return
    }
    setLoading(true)
    setExpanded(true)

    // Simulate with sample metrics (real data will come from hooks later)
    setTimeout(() => {
      const sampleMetrics: AggregatedMetrics = {
        spend: 12500,
        impressions: 450000,
        clicks: 8200,
        conversions: 340,
        ctr: 1.82,
        cpc: 1.52,
        cpm: 27.78,
        roas: 3.2,
        frequency: 2.8,
        reach: 160000,
        leads: 180,
        cost_per_lead: 69.44,
      }

      const previousMetrics: AggregatedMetrics = {
        spend: 11800,
        impressions: 420000,
        clicks: 7500,
        conversions: 290,
        ctr: 1.79,
        cpc: 1.57,
        cpm: 28.1,
        roas: 2.8,
        frequency: 2.5,
        reach: 168000,
        leads: 155,
        cost_per_lead: 76.13,
      }

      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const analysis = generateReportAnalysis(
        'demo',
        sampleMetrics,
        {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0],
        },
        previousMetrics
      )
      setResult(analysis)
      setLoading(false)
    }, 1200)
  }

  const handleCopyAll = () => {
    if (!result) return
    const text = [
      result.summary,
      '',
      ...result.blocks.map((b) => `## ${b.section}\n${b.text}`),
      '',
      '## Recomendações',
      ...result.recommendations.map((r, i) => `${i + 1}. ${r}`),
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sentimentColor = (s: string) => {
    if (s === 'positive') return 'border-l-emerald-400 bg-emerald-50/50'
    if (s === 'negative') return 'border-l-red-400 bg-red-50/50'
    return 'border-l-slate-300 bg-slate-50/50'
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 ${assistant.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${assistant.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-slate-900">{assistant.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{assistant.description}</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : result ? (
              expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {loading ? 'Gerando...' : result ? (expanded ? 'Fechar' : 'Ver Insight') : 'Gerar Insight'}
          </button>
        </div>
      </div>

      {/* Results */}
      {expanded && result && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-900 leading-relaxed">{result.summary}</p>
          </div>

          {/* Analysis blocks */}
          {result.blocks.map((block, i) => (
            <div key={i} className={`border-l-4 rounded-r-lg p-3 ${sentimentColor(block.sentiment)}`}>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{block.section}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{block.text}</p>
            </div>
          ))}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Recomendações</p>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Copy button */}
          <div className="flex justify-end">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar análise
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function AIInsightsPage() {
  const { user, activeClient } = useAuth()
  const toast = useToast()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<AIInsight['type'] | 'all'>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const clientId = activeClient?.client_id

  // ── Fetch ──
  const fetchInsights = useCallback(async () => {
    if (!clientId) return
    try {
      const filters: InsightFilters = {}
      if (activeFilter !== 'all') filters.type = activeFilter
      const data = await aiInsightsService.getInsights(clientId, filters)
      setInsights(data)
    } catch (err) {
      console.error('Error fetching insights:', err)
      toast.error('Erro ao carregar insights.')
    } finally {
      setLoading(false)
    }
  }, [clientId, activeFilter])

  useEffect(() => {
    setLoading(true)
    fetchInsights()
  }, [fetchInsights])

  // ── Actions ──
  const handleMarkAsRead = async (id: string) => {
    try {
      await aiInsightsService.markAsRead(id)
      setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: true } : i)))
    } catch {
      toast.error('Erro ao marcar como lido.')
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await aiInsightsService.dismissInsight(id)
      setInsights((prev) => prev.filter((i) => i.id !== id))
      toast.success('Insight dispensado.')
    } catch {
      toast.error('Erro ao dispensar insight.')
    }
  }

  const handleAction = async (id: string) => {
    if (!user) return
    try {
      await aiInsightsService.actionInsight(id, user.id)
      setInsights((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_actioned: true, is_read: true } : i))
      )
      toast.success('Marcado como ação tomada!')
    } catch {
      toast.error('Erro ao registrar ação.')
    }
  }

  const handleMarkAllRead = async () => {
    if (!clientId) return
    setMarkingAll(true)
    try {
      await aiInsightsService.markAllAsRead(clientId)
      setInsights((prev) => prev.map((i) => ({ ...i, is_read: true })))
      toast.success('Todos marcados como lidos.')
    } catch {
      toast.error('Erro ao marcar todos como lidos.')
    } finally {
      setMarkingAll(false)
    }
  }

  // ── Stats ──
  const unreadCount = insights.filter((i) => !i.is_read).length
  const criticalCount = insights.filter((i) => i.severity === 'critical').length
  const opportunityCount = insights.filter((i) => i.type === 'opportunity').length

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Insights de IA</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Anomalias, oportunidades e recomendações automáticas.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Marcar todos como lidos
            </button>
          )}
          <button
            onClick={() => { setLoading(true); fetchInsights() }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* AI Assistants Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Assistentes de IA</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AI_ASSISTANTS.map((assistant) => (
            <AIAssistantCard key={assistant.id} assistant={assistant} />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 mb-6" />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">Não lidos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-sm text-slate-500">Críticos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{criticalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm text-slate-500">Oportunidades</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{opportunityCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              activeFilter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando insights...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && insights.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Nenhum insight encontrado</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            {activeFilter !== 'all'
              ? 'Nenhum insight deste tipo no momento. Tente outro filtro.'
              : 'Os insights serão gerados automaticamente conforme os dados das campanhas forem processados.'}
          </p>
        </div>
      )}

      {/* Insight Cards */}
      {!loading && insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight) => {
            const typeConf = TYPE_CONFIG[insight.type]
            const sevConf = SEVERITY_CONFIG[insight.severity]
            const TypeIcon = typeConf.icon
            const deviation = insight.deviation_pct
            const isPositive = deviation !== null && deviation > 0

            return (
              <div
                key={insight.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                  insight.is_read ? 'border-slate-200' : `border-l-4 ${sevConf.borderColor} border-slate-200`
                } ${insight.is_actioned ? 'opacity-60' : ''}`}
              >
                <div className="p-5">
                  {/* Top row: icon + title + severity badge */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 ${typeConf.bgColor} rounded-lg flex items-center justify-center shrink-0`}>
                      <TypeIcon className={`w-4.5 h-4.5 ${typeConf.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`font-semibold text-sm text-slate-900 ${!insight.is_read ? 'font-bold' : ''}`}>
                          {insight.title}
                        </h3>
                        {!insight.is_read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sevConf.bgColor} ${sevConf.color}`}>
                        {sevConf.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeConf.bgColor} ${typeConf.color}`}>
                        {typeConf.label}
                      </span>
                    </div>
                  </div>

                  {/* Metric badge */}
                  {insight.metric && insight.current_value !== null && insight.baseline_value !== null && (
                    <div className="flex items-center gap-3 mb-3 ml-12">
                      <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <span className="text-xs text-slate-500 uppercase font-medium">{insight.metric}</span>
                        <span className="text-sm font-bold text-slate-900">
                          {insight.current_value.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400">vs</span>
                        <span className="text-sm text-slate-500">{insight.baseline_value.toFixed(2)}</span>
                        {deviation !== null && (
                          <span
                            className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                              isPositive ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {Math.abs(deviation).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      {insight.campaign_name && (
                        <span className="text-xs text-slate-400 truncate">
                          {insight.campaign_name}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Recommendations */}
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="ml-12 mb-3">
                      <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">
                        Recomendações
                      </p>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-sm text-slate-600">
                            <CheckCircle className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Footer: actions + timestamp */}
                  <div className="flex items-center gap-2 ml-12 pt-2 border-t border-slate-100">
                    {!insight.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(insight.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Marcar como lido
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(insight.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Dispensar
                    </button>
                    {!insight.is_actioned && (
                      <button
                        onClick={() => handleAction(insight.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        Ação tomada
                      </button>
                    )}
                    {insight.is_actioned && (
                      <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Ação registrada
                      </span>
                    )}
                    <div className="flex-1" />
                    <span className="text-[11px] text-slate-400">
                      {new Date(insight.generated_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
