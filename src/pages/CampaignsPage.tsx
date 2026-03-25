/**
 * ============================================
 * CAMPAIGNS DASHBOARD PAGE
 * ============================================
 * Dashboard de performance de campanhas Meta/Google Ads.
 * Consome dados reais via useMetaAdsDashboard.
 */

import { useState, useCallback } from 'react'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  Zap,
  Loader2,
  AlertCircle,
  ChevronDown,
  ArrowUpDown,
  Image,
  Download,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  useMetaAdsDashboard,
  DATE_RANGES,
} from '@/hooks/useMetaAdsData'
// Date range types used via useMetaAdsDashboard
import { downloadCSV } from '@/lib/csv'

// =====================================================
// FORMATTERS
// =====================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// =====================================================
// KPI CARD (Campaigns version)
// =====================================================

interface MetricCardProps {
  title: string
  value: string
  icon: React.ElementType
  color: string
  subtitle?: string
}

function MetricCard({ title, value, icon: Icon, color, subtitle }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  )
}

// =====================================================
// CAMPAIGN TABLE
// =====================================================

interface CampaignRow {
  campaign_id: string
  campaign_name: string
  impressions: number
  clicks: number
  spend: number
  conversions: number
  roas: number
  ctr: number
  cpc: number
}

function CampaignTable({
  data,
  sortBy,
  onSort,
}: {
  data: CampaignRow[]
  sortBy: string
  onSort: (field: string) => void
}) {
  const columns = [
    { key: 'campaign_name', label: 'Campanha', align: 'left' as const },
    { key: 'impressions', label: 'Impressões', align: 'right' as const },
    { key: 'clicks', label: 'Cliques', align: 'right' as const },
    { key: 'ctr', label: 'CTR', align: 'right' as const },
    { key: 'spend', label: 'Investimento', align: 'right' as const },
    { key: 'cpc', label: 'CPC', align: 'right' as const },
    { key: 'conversions', label: 'Conversões', align: 'right' as const },
    { key: 'roas', label: 'ROAS', align: 'right' as const },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Campanhas</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  onClick={() => onSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortBy === col.key && <ArrowUpDown className="w-3 h-3" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.campaign_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-900 font-medium max-w-xs truncate">
                  {row.campaign_name}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">
                  {formatNumber(row.impressions)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">
                  {formatNumber(row.clicks)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                      row.ctr >= 2
                        ? 'bg-green-100 text-green-700'
                        : row.ctr >= 1
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {formatPercent(row.ctr)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right font-medium">
                  {formatCurrency(row.spend)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">
                  {formatCurrency(row.cpc)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">
                  {formatNumber(row.conversions)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                      row.roas >= 3
                        ? 'bg-green-100 text-green-700'
                        : row.roas >= 1
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {row.roas.toFixed(2)}x
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                  Nenhuma campanha encontrada neste período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =====================================================
// CREATIVES TABLE
// =====================================================

function CreativesTable({
  data,
}: {
  data: Array<{
    ad_name: string
    creative_thumbnail_url: string | null
    impressions: number
    clicks: number
    spend: number
    ctr: number
    hook_rate: number | null
    hold_rate: number | null
  }>
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Top Criativos</h3>
        <p className="text-xs text-slate-500 mt-0.5">Ranking por Hook Rate e performance</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Anúncio</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Impressões</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">CTR</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hook Rate</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hold Rate</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Invest.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {row.creative_thumbnail_url ? (
                      <img
                        src={row.creative_thumbnail_url}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Image className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <span className="text-sm text-slate-900 font-medium truncate max-w-48">
                      {row.ad_name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">
                  {formatNumber(row.impressions)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className="text-slate-700">{formatPercent(row.ctr)}</span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {row.hook_rate != null ? (
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                        row.hook_rate >= 25
                          ? 'bg-green-100 text-green-700'
                          : row.hook_rate >= 15
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {formatPercent(row.hook_rate)}
                    </span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {row.hold_rate != null ? (
                    <span className="text-slate-700">{formatPercent(row.hold_rate)}</span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right font-medium">
                  {formatCurrency(row.spend)}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                  Nenhum criativo encontrado neste período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function CampaignsPage() {
  const {
    accounts,
    activeAccounts,
    selectedAccountId,
    setSelectedAccountId,
    dateRange,
    setDateRange,
    metrics,
    dailyData,
    topCampaigns,
    topCreatives,
    loading,
  } = useMetaAdsDashboard()

  const [chartMetric, setChartMetric] = useState<'spend' | 'clicks' | 'conversions' | 'leads'>('spend')
  const [tableSortBy, setTableSortBy] = useState('spend')

  const handleExportCSV = useCallback(() => {
    if (topCampaigns.length === 0) return
    const today = new Date().toISOString().slice(0, 10)
    downloadCSV(
      topCampaigns.map((c) => ({ ...c })),
      [
        { key: 'campaign_name', label: 'Campanha' },
        { key: 'impressions', label: 'Impressões' },
        { key: 'clicks', label: 'Cliques' },
        { key: 'ctr', label: 'CTR (%)' },
        { key: 'spend', label: 'Investimento' },
        { key: 'cpc', label: 'CPC' },
        { key: 'conversions', label: 'Conversões' },
        { key: 'roas', label: 'ROAS' },
      ],
      `campanhas-${today}`
    )
  }, [topCampaigns])

  // Empty state: no accounts
  if (!loading && accounts.length === 0) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma conta conectada</h2>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Conecte uma conta de anúncios para visualizar a performance das suas campanhas.
        </p>
        <a
          href="/integrations"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Ir para Integrações
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campanhas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Performance de mídia paga</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Account Selector */}
          {activeAccounts.length > 1 && (
            <div className="relative">
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Date Range */}
          <div className="relative">
            <select
              value={dateRange.days}
              onChange={(e) => {
                const r = DATE_RANGES.find((d) => d.days === Number(e.target.value))
                if (r) setDateRange(r)
              }}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {DATE_RANGES.map((r) => (
                <option key={r.days} value={r.days}>
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={topCampaigns.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exportar campanhas em CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Carregando dados...
        </div>
      )}

      {!loading && metrics && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <MetricCard
              title="Investimento"
              value={formatCurrency(metrics.spend)}
              icon={DollarSign}
              color="bg-blue-600"
            />
            <MetricCard
              title="Impressões"
              value={formatNumber(metrics.impressions)}
              icon={Eye}
              color="bg-purple-600"
            />
            <MetricCard
              title="Cliques"
              value={formatNumber(metrics.clicks)}
              icon={MousePointer}
              color="bg-indigo-600"
            />
            <MetricCard
              title="CTR"
              value={formatPercent(metrics.ctr)}
              icon={Target}
              color="bg-amber-600"
              subtitle={`CPC: ${formatCurrency(metrics.cpc)}`}
            />
            <MetricCard
              title="Conversões"
              value={formatNumber(metrics.conversions)}
              icon={Zap}
              color="bg-green-600"
              subtitle={`Leads: ${formatNumber(metrics.leads)}`}
            />
            <MetricCard
              title="ROAS"
              value={`${metrics.roas.toFixed(2)}x`}
              icon={TrendingUp}
              color={metrics.roas >= 3 ? 'bg-green-600' : metrics.roas >= 1 ? 'bg-yellow-600' : 'bg-red-600'}
              subtitle={`CPL: ${formatCurrency(metrics.cost_per_lead)}`}
            />
          </div>

          {/* Area Chart */}
          {dailyData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Performance Diária</h3>
                <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                  {(
                    [
                      { key: 'spend', label: 'Investimento' },
                      { key: 'clicks', label: 'Cliques' },
                      { key: 'conversions', label: 'Conversões' },
                      { key: 'leads', label: 'Leads' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setChartMetric(item.key)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        chartMetric === item.key
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      chartMetric === 'spend' ? formatCurrency(v) : formatNumber(v)
                    }
                  />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value != null
                        ? (chartMetric === 'spend' ? formatCurrency(value) : formatNumber(value))
                        : '-'
                    }
                    labelFormatter={formatDate}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMetric}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorMetric)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Campaigns Table */}
          <div className="mb-6">
            <CampaignTable
              data={topCampaigns}
              sortBy={tableSortBy}
              onSort={setTableSortBy}
            />
          </div>

          {/* Creatives Table */}
          {topCreatives.length > 0 && (
            <div className="mb-6">
              <CreativesTable data={topCreatives} />
            </div>
          )}
        </>
      )}

      {/* No data state (account connected but no insights) */}
      {!loading && metrics && metrics.spend === 0 && metrics.impressions === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 mt-6">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-medium text-slate-700 mb-1">Sem dados neste período</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Sincronize sua conta na página de Integrações ou selecione um período diferente.
          </p>
        </div>
      )}
    </div>
  )
}
