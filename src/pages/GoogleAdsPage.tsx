/**
 * ============================================
 * GOOGLE ADS PAGE — Dashboard
 * ============================================
 * Tabs: Overview | Campaigns | Keywords | Quality Score
 * Similar to CampaignsPage but specific to Google Ads data.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/UI/Toast'
import {
  BarChart3,
  Search,
  Target,
  TrendingUp,
  DollarSign,
  MousePointer,
  Eye,
  Loader2,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  ArrowUpRight,
  Star,
} from 'lucide-react'
import { googleAccountsService } from '@/services/googleAuthService'
import type { GoogleAccount } from '@/services/googleAuthService'
import {
  googleAdsQueryService,
  googleAdsSyncService,
} from '@/services/googleAdsService'
import type { GoogleAdsAggregatedMetrics } from '@/services/googleAdsService'

// =====================================================
// HELPERS
// =====================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

function getDateRange(days: number): { since: string; until: string } {
  const until = new Date()
  const since = new Date()
  since.setDate(since.getDate() - days)
  return {
    since: since.toISOString().split('T')[0],
    until: until.toISOString().split('T')[0],
  }
}

function getQSColor(score: number | null): string {
  if (score == null) return 'text-slate-400'
  if (score >= 7) return 'text-green-600'
  if (score >= 4) return 'text-yellow-600'
  return 'text-red-600'
}

function getQSBg(score: number | null): string {
  if (score == null) return 'bg-slate-100'
  if (score >= 7) return 'bg-green-100'
  if (score >= 4) return 'bg-yellow-100'
  return 'bg-red-100'
}

function getScoreLabel(score: string | null): { label: string; color: string } {
  switch (score) {
    case 'ABOVE_AVERAGE': return { label: 'Acima', color: 'text-green-600' }
    case 'AVERAGE': return { label: 'Média', color: 'text-yellow-600' }
    case 'BELOW_AVERAGE': return { label: 'Abaixo', color: 'text-red-600' }
    default: return { label: '-', color: 'text-slate-400' }
  }
}

// =====================================================
// KPI CARD
// =====================================================

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color: string
}

function KPICard({ title, value, subtitle, icon: Icon, color }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

// =====================================================
// TAB NAVIGATION
// =====================================================

type TabKey = 'overview' | 'campaigns' | 'keywords' | 'quality_score'

const TABS: Array<{ key: TabKey; label: string; icon: React.ElementType }> = [
  { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
  { key: 'campaigns', label: 'Campanhas', icon: Target },
  { key: 'keywords', label: 'Keywords', icon: Search },
  { key: 'quality_score', label: 'Quality Score', icon: Star },
]

// =====================================================
// MAIN PAGE
// =====================================================

export default function GoogleAdsPage() {
  const { user, activeClient } = useAuth()
  const toast = useToast()

  // State
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [dateRangeDays, setDateRangeDays] = useState(30)

  // Data
  const [metrics, setMetrics] = useState<GoogleAdsAggregatedMetrics | null>(null)
  const [campaigns, setCampaigns] = useState<Awaited<ReturnType<typeof googleAdsQueryService.getTopCampaigns>>>([])
  const [keywords, setKeywords] = useState<Awaited<ReturnType<typeof googleAdsQueryService.getKeywordPerformance>>>([])
  const [qsDistribution, setQsDistribution] = useState<Awaited<ReturnType<typeof googleAdsQueryService.getQualityScoreDistribution>>>([])

  const dateRange = getDateRange(dateRangeDays)

  // Load accounts
  const fetchAccounts = useCallback(async () => {
    if (!user) return
    try {
      const accounts = activeClient?.client_id
        ? await googleAccountsService.getConnectedAccounts(activeClient.client_id)
        : await googleAccountsService.listByUser(user.id)

      const adsAccounts = accounts.filter((a) => a.platform === 'google_ads')
      setGoogleAccounts(adsAccounts)

      if (adsAccounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(adsAccounts[0].id)
      }
    } catch (err) {
      console.error('Error fetching Google accounts:', err)
    } finally {
      setLoading(false)
    }
  }, [user, activeClient?.client_id, selectedAccountId])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  // Load data for selected account
  const fetchData = useCallback(async () => {
    if (!selectedAccountId) return

    try {
      const [metricsData, campaignsData, keywordsData, qsData] = await Promise.all([
        googleAdsQueryService.getAggregatedMetrics(selectedAccountId, dateRange),
        googleAdsQueryService.getTopCampaigns(selectedAccountId, dateRange, 20),
        googleAdsQueryService.getKeywordPerformance(selectedAccountId, null, dateRange),
        googleAdsQueryService.getQualityScoreDistribution(selectedAccountId, dateRange),
      ])

      setMetrics(metricsData)
      setCampaigns(campaignsData)
      setKeywords(keywordsData)
      setQsDistribution(qsData)
    } catch (err) {
      console.error('Error fetching Google Ads data:', err)
    }
  }, [selectedAccountId, dateRangeDays])

  useEffect(() => {
    if (selectedAccountId) {
      fetchData()
    }
  }, [fetchData, selectedAccountId])

  // Sync
  const handleSync = async () => {
    if (!selectedAccountId) return
    setSyncing(true)
    try {
      const account = googleAccounts.find((a) => a.id === selectedAccountId)
      await googleAdsSyncService.fullSync(
        selectedAccountId,
        account?.client_id || null,
        dateRange,
      )
      toast.success('Google Ads sincronizado com sucesso!')
      await fetchData()
    } catch (err) {
      toast.error('Erro ao sincronizar Google Ads.')
      console.error('Sync error:', err)
    } finally {
      setSyncing(false)
    }
  }

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (googleAccounts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Nenhuma conta Google Ads conectada
        </h2>
        <p className="text-slate-500 mb-6">
          Conecte sua conta do Google Ads na página de Integrações para começar a ver seus dados aqui.
        </p>
        <a
          href="/integrations"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Ir para Integrações
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    )
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Google Ads</h1>
          <p className="text-slate-500 mt-1">
            Performance de campanhas, keywords e quality score.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Account Selector */}
          {googleAccounts.length > 1 && (
            <div className="relative">
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {googleAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Date Range */}
          <select
            value={dateRangeDays}
            onChange={(e) => setDateRangeDays(Number(e.target.value))}
            className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sincronizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ========== OVERVIEW TAB ========== */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              title="Custo Total"
              value={formatCurrency(metrics.cost)}
              icon={DollarSign}
              color="bg-red-500"
            />
            <KPICard
              title="Cliques"
              value={formatNumber(metrics.clicks)}
              icon={MousePointer}
              color="bg-blue-500"
            />
            <KPICard
              title="Conversões"
              value={formatNumber(metrics.conversions)}
              icon={Target}
              color="bg-green-500"
            />
            <KPICard
              title="ROAS"
              value={`${metrics.roas.toFixed(2)}x`}
              icon={TrendingUp}
              color="bg-purple-500"
            />
            <KPICard
              title="Imp. Share"
              value={metrics.impression_share != null ? formatPercent(metrics.impression_share * 100) : '-'}
              icon={Eye}
              color="bg-orange-500"
            />
            <KPICard
              title="CPC Médio"
              value={formatCurrency(metrics.avg_cpc)}
              icon={DollarSign}
              color="bg-slate-500"
            />
          </div>

          {/* Top Campaigns Preview */}
          {campaigns.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Top Campanhas por Custo</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                      <th className="px-5 py-3 text-left font-medium">Campanha</th>
                      <th className="px-3 py-3 text-left font-medium">Tipo</th>
                      <th className="px-3 py-3 text-right font-medium">Custo</th>
                      <th className="px-3 py-3 text-right font-medium">Cliques</th>
                      <th className="px-3 py-3 text-right font-medium">Conv.</th>
                      <th className="px-3 py-3 text-right font-medium">ROAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.slice(0, 5).map((c) => (
                      <tr key={c.campaign_id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-xs">
                            {c.campaign_name}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {c.campaign_type}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-slate-900">
                          {formatCurrency(c.cost)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-slate-600">
                          {formatNumber(c.clicks)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-slate-600">
                          {formatNumber(c.conversions)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium">
                          <span className={c.roas >= 1 ? 'text-green-600' : 'text-red-600'}>
                            {c.roas.toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== CAMPAIGNS TAB ========== */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">
              Todas as Campanhas ({campaigns.length})
            </h3>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <p>Nenhuma campanha encontrada neste período.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <th className="px-5 py-3 text-left font-medium">Campanha</th>
                    <th className="px-3 py-3 text-left font-medium">Tipo</th>
                    <th className="px-3 py-3 text-left font-medium">Status</th>
                    <th className="px-3 py-3 text-right font-medium">Orçamento</th>
                    <th className="px-3 py-3 text-right font-medium">Custo</th>
                    <th className="px-3 py-3 text-right font-medium">Cliques</th>
                    <th className="px-3 py-3 text-right font-medium">Conv.</th>
                    <th className="px-3 py-3 text-right font-medium">ROAS</th>
                    <th className="px-3 py-3 text-right font-medium">Imp. Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((c) => (
                    <tr key={c.campaign_id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-slate-900 truncate max-w-xs">
                          {c.campaign_name}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {c.campaign_type}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.status === 'ENABLED' ? 'bg-green-100 text-green-700' :
                          c.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {c.status === 'ENABLED' ? 'Ativa' :
                           c.status === 'PAUSED' ? 'Pausada' : c.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-slate-600">
                        {c.budget_amount != null ? formatCurrency(c.budget_amount) : '-'}
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-medium text-slate-900">
                        {formatCurrency(c.cost)}
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-slate-600">
                        {formatNumber(c.clicks)}
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-slate-600">
                        {formatNumber(c.conversions)}
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-medium">
                        <span className={c.roas >= 1 ? 'text-green-600' : 'text-red-600'}>
                          {c.roas.toFixed(2)}x
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-slate-600">
                        {c.impression_share != null
                          ? formatPercent(c.impression_share * 100)
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========== KEYWORDS TAB ========== */}
      {activeTab === 'keywords' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">
              Keywords ({keywords.length})
            </h3>
          </div>

          {keywords.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2" />
              <p>Nenhuma keyword encontrada neste período.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <th className="px-5 py-3 text-left font-medium">Keyword</th>
                    <th className="px-3 py-3 text-left font-medium">Match</th>
                    <th className="px-3 py-3 text-center font-medium">QS</th>
                    <th className="px-3 py-3 text-center font-medium">CTR Esp.</th>
                    <th className="px-3 py-3 text-center font-medium">Relevância</th>
                    <th className="px-3 py-3 text-center font-medium">Landing Page</th>
                    <th className="px-3 py-3 text-right font-medium">Cliques</th>
                    <th className="px-3 py-3 text-right font-medium">Custo</th>
                    <th className="px-3 py-3 text-right font-medium">Conv.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keywords.map((kw, idx) => {
                    const ctrScore = getScoreLabel(kw.expected_ctr_score)
                    const relScore = getScoreLabel(kw.ad_relevance_score)
                    const lpScore = getScoreLabel(kw.landing_page_score)

                    return (
                      <tr key={`${kw.keyword_text}-${kw.match_type}-${idx}`} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-xs">
                            {kw.keyword_text}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {kw.match_type}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getQSBg(kw.quality_score)} ${getQSColor(kw.quality_score)}`}>
                            {kw.quality_score ?? '-'}
                          </span>
                        </td>
                        <td className={`px-3 py-3 text-center text-xs font-medium ${ctrScore.color}`}>
                          {ctrScore.label}
                        </td>
                        <td className={`px-3 py-3 text-center text-xs font-medium ${relScore.color}`}>
                          {relScore.label}
                        </td>
                        <td className={`px-3 py-3 text-center text-xs font-medium ${lpScore.color}`}>
                          {lpScore.label}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-slate-600">
                          {formatNumber(kw.clicks)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-slate-900">
                          {formatCurrency(kw.cost)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-slate-600">
                          {formatNumber(kw.conversions)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========== QUALITY SCORE TAB ========== */}
      {activeTab === 'quality_score' && (
        <div className="space-y-6">
          {/* QS Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Distribuição de Quality Score</h3>

            {qsDistribution.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Star className="w-8 h-8 mx-auto mb-2" />
                <p>Nenhum dado de Quality Score disponível.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bar chart representation */}
                {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                  const item = qsDistribution.find((d) => d.score === score)
                  const count = item?.count || 0
                  const maxCount = Math.max(...qsDistribution.map((d) => d.count), 1)
                  const widthPercent = (count / maxCount) * 100

                  return (
                    <div key={score} className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getQSBg(score)} ${getQSColor(score)}`}>
                        {score}
                      </span>
                      <div className="flex-1">
                        <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              score >= 7 ? 'bg-green-500' :
                              score >= 4 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-12 text-right">
                        {count}
                      </span>
                      <span className="text-xs text-slate-500 w-24 text-right">
                        {item ? formatCurrency(item.avgCost) : '-'}
                      </span>
                    </div>
                  )
                })}

                <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-11">
                  <span>Keywords com QS mais baixo custam mais</span>
                  <span>Custo médio / keyword</span>
                </div>
              </div>
            )}
          </div>

          {/* Keywords with low QS */}
          {keywords.filter((kw) => kw.quality_score != null && kw.quality_score <= 4).length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-red-100 bg-red-50/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-red-900">
                    Keywords com Quality Score Baixo (1-4)
                  </h3>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Estas keywords estão custando mais e aparecendo menos. Otimize os anúncios e landing pages.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-red-50/30 text-xs text-slate-500 uppercase">
                      <th className="px-5 py-3 text-left font-medium">Keyword</th>
                      <th className="px-3 py-3 text-center font-medium">QS</th>
                      <th className="px-3 py-3 text-center font-medium">CTR Esp.</th>
                      <th className="px-3 py-3 text-center font-medium">Relevância</th>
                      <th className="px-3 py-3 text-center font-medium">Landing Page</th>
                      <th className="px-3 py-3 text-right font-medium">Custo</th>
                      <th className="px-3 py-3 text-right font-medium">CPC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {keywords
                      .filter((kw) => kw.quality_score != null && kw.quality_score <= 4)
                      .sort((a, b) => (a.quality_score || 0) - (b.quality_score || 0))
                      .map((kw, idx) => {
                        const ctrScore = getScoreLabel(kw.expected_ctr_score)
                        const relScore = getScoreLabel(kw.ad_relevance_score)
                        const lpScore = getScoreLabel(kw.landing_page_score)

                        return (
                          <tr key={`low-qs-${idx}`} className="hover:bg-red-50/30">
                            <td className="px-5 py-3">
                              <p className="text-sm font-medium text-slate-900 truncate max-w-xs">
                                {kw.keyword_text}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getQSBg(kw.quality_score)} ${getQSColor(kw.quality_score)}`}>
                                {kw.quality_score}
                              </span>
                            </td>
                            <td className={`px-3 py-3 text-center text-xs font-medium ${ctrScore.color}`}>
                              {ctrScore.label}
                            </td>
                            <td className={`px-3 py-3 text-center text-xs font-medium ${relScore.color}`}>
                              {relScore.label}
                            </td>
                            <td className={`px-3 py-3 text-center text-xs font-medium ${lpScore.color}`}>
                              {lpScore.label}
                            </td>
                            <td className="px-3 py-3 text-right text-sm font-medium text-red-600">
                              {formatCurrency(kw.cost)}
                            </td>
                            <td className="px-3 py-3 text-right text-sm text-slate-600">
                              {formatCurrency(kw.avg_cpc)}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
