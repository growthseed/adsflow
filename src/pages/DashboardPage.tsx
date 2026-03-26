/**
 * ============================================
 * DASHBOARD PAGE - Hub Principal
 * ============================================
 * Overview cross-account com KPIs, ações rápidas,
 * flows recentes e atividade.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  Trash2,
  Edit3,
  Calendar,
  BarChart3,
  Megaphone,
  FileText,
  Link2,
  Users,
  DollarSign,
  MousePointer,
  Eye,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Zap,
  Target,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDateRange } from '@/contexts/DateRangeContext'
import { useFlows } from '@/hooks/useFlows'
import { useAdAccounts, useAggregatedMetrics } from '@/hooks/useMetaAdsData'
import DateRangeSelector from '@/components/UI/DateRangeSelector'
import { reportsService } from '@/services/reportsService'
import type { SavedReport } from '@/services/reportsService'
import { useConfirm } from '@/components/UI/ConfirmDialog'
import { KPICardSkeleton, FlowGridSkeleton } from '@/components/UI/Skeleton'

// =====================================================
// QUICK ACTION CARD
// =====================================================

function QuickAction({
  icon: Icon,
  label,
  description,
  color,
  onClick,
}: {
  icon: React.ElementType
  label: string
  description: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all text-left group"
    >
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 ml-auto flex-shrink-0" />
    </button>
  )
}

// =====================================================
// STAT CARD — Power BI professional style
// =====================================================

const ACCENT_BORDERS: Record<string, string> = {
  'bg-blue-600': 'border-l-blue-600',
  'bg-purple-600': 'border-l-purple-600',
  'bg-green-600': 'border-l-green-600',
  'bg-amber-600': 'border-l-amber-600',
  'bg-indigo-600': 'border-l-indigo-600',
  'bg-red-600': 'border-l-red-600',
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  delta,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  color: string
  delta?: { value: number; label?: string }
}) {
  const borderClass = ACCENT_BORDERS[color] || 'border-l-slate-400'
  const deltaPositive = delta && delta.value > 0
  const deltaNegative = delta && delta.value < 0
  const deltaZero = delta && delta.value === 0

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${borderClass} p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 ${color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      <div className="flex items-center gap-3 mt-2">
        {delta != null && !deltaZero && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${
              deltaPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {deltaPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : deltaNegative ? (
              <ArrowDown className="w-3 h-3" />
            ) : null}
            {delta.value > 0 ? '+' : ''}{delta.value.toFixed(1)}%
          </span>
        )}
        {delta != null && deltaZero && (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500">
            0.0%
          </span>
        )}
        {delta?.label && (
          <span className="text-xs text-slate-400">{delta.label}</span>
        )}
        {!delta && subtext && <span className="text-xs text-slate-400">{subtext}</span>}
      </div>
      {delta && subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function DashboardPage() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { user, activeClient } = useAuth()
  const { flows, isLoading: flowsLoading, refetch, deleteExistingFlow } = useFlows()
  const { accounts, activeAccounts } = useAdAccounts()
  const { dateRange, setDateRange, periodLabel, dateFrom, dateTo } = useDateRange()
  const [recentReports, setRecentReports] = useState<SavedReport[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get aggregated metrics for KPI cards (reactive to date range)
  const firstAccountId = activeAccounts[0]?.id
  const { metrics, loading: metricsLoading } = useAggregatedMetrics(
    firstAccountId
      ? {
          adAccountId: firstAccountId,
          dateFrom,
          dateTo,
        }
      : null
  )

  // Fetch recent reports
  useEffect(() => {
    if (!user) return
    reportsService.list(user.id, activeClient?.client_id).then((reports) => {
      setRecentReports(reports.slice(0, 3))
    }).catch((err) => {
      console.error('Erro ao carregar relatórios recentes:', err)
    })
  }, [user, activeClient?.client_id])

  // Filter flows
  const filteredFlows = flows.filter(
    (flow) =>
      flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateFlow = () => navigate('/editor')
  const handleEditFlow = (flowId: string) => navigate(`/editor/${flowId}`)
  const handleDeleteFlow = async (flowId: string) => {
    const ok = await confirm({
      title: 'Excluir flow',
      message: 'Tem certeza que deseja excluir este flow?',
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (ok) await deleteExistingFlow(flowId)
  }

  // Format currency
  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatNumber = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Olá, {user?.name?.split(' ')[0] || 'Usuário'}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeClient
              ? `${activeClient.client.name} — Visão geral do seu marketing`
              : 'Visão geral das suas campanhas e estratégias'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
          />
          <button
            onClick={handleCreateFlow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Flow
          </button>
        </div>
      </div>

      {/* KPI Cards — cross-account overview */}
      {metricsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label={`Investimento ${periodLabel}`}
            value={metrics ? formatCurrency(metrics.spend || 0) : '—'}
            subtext={activeAccounts.length > 0 ? `${activeAccounts.length} conta(s) ativa(s)` : 'Nenhuma conta conectada'}
            color="bg-blue-600"
          />
          <StatCard
            icon={Eye}
            label={`Impressões ${periodLabel}`}
            value={metrics ? formatNumber(metrics.impressions || 0) : '—'}
            subtext={metrics?.reach ? `${formatNumber(metrics.reach)} alcance` : undefined}
            color="bg-purple-600"
          />
          <StatCard
            icon={MousePointer}
            label={`Cliques ${periodLabel}`}
            value={metrics ? formatNumber(metrics.clicks || 0) : '—'}
            subtext={metrics?.ctr ? `CTR ${metrics.ctr.toFixed(2)}%` : undefined}
            color="bg-green-600"
          />
          <StatCard
            icon={Target}
            label={`Conversões ${periodLabel}`}
            value={metrics ? formatNumber(metrics.conversions || 0) : '—'}
            subtext={metrics?.roas ? `ROAS ${metrics.roas.toFixed(2)}x` : undefined}
            color="bg-amber-600"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            icon={Megaphone}
            label="Campanhas"
            description="Ver performance Meta Ads"
            color="bg-blue-600"
            onClick={() => navigate('/campaigns')}
          />
          <QuickAction
            icon={FileText}
            label="Novo Relatório"
            description="Criar relatório para cliente"
            color="bg-emerald-600"
            onClick={() => navigate('/reports')}
          />
          <QuickAction
            icon={Link2}
            label="Integrações"
            description="Conectar contas de anúncio"
            color="bg-purple-600"
            onClick={() => navigate('/integrations')}
          />
          <QuickAction
            icon={BarChart3}
            label="B.I. & Analytics"
            description="Dashboard de vendas"
            color="bg-indigo-600"
            onClick={() => navigate('/bi')}
          />
        </div>
      </div>

      {/* Two columns: Recent Reports + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Relatórios Recentes</h3>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos
            </button>
          </div>
          {recentReports.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Nenhum relatório ainda
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate('/reports')}
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{r.name}</p>
                    <p className="text-xs text-slate-500">
                      {r.status === 'ready' ? 'Pronto' : 'Rascunho'} •{' '}
                      {new Date(r.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === 'ready'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {r.status === 'ready' ? 'Pronto' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accounts overview */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Contas de Anúncio</h3>
            <button
              onClick={() => navigate('/integrations')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Gerenciar
            </button>
          </div>
          {accounts.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400">
              <Link2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Nenhuma conta conectada
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.slice(0, 4).map((acc) => (
                <div key={acc.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      acc.platform === 'meta_ads' ? 'bg-blue-100' : 'bg-green-100'
                    }`}
                  >
                    <Zap
                      className={`w-4 h-4 ${
                        acc.platform === 'meta_ads' ? 'text-blue-600' : 'text-green-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {acc.account_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {acc.platform === 'meta_ads' ? 'Meta Ads' : 'Google Ads'}
                    </p>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      acc.status === 'active' ? 'bg-green-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Resumo do Workspace</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <LayoutGrid className="w-4 h-4 text-blue-500" />
                Flows Criados
              </div>
              <span className="text-sm font-bold text-slate-900">{flows.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Megaphone className="w-4 h-4 text-purple-500" />
                Contas Ativas
              </div>
              <span className="text-sm font-bold text-slate-900">{activeAccounts.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileText className="w-4 h-4 text-green-500" />
                Relatórios
              </div>
              <span className="text-sm font-bold text-slate-900">{recentReports.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4 text-amber-500" />
                Clientes
              </div>
              <span className="text-sm font-bold text-slate-900">0</span>
            </div>
            {activeClient && (
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Building2 className="w-3.5 h-3.5" />
                  {activeClient.client.name}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flows Section */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Meus Flows</h2>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar flows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => refetch()}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                title="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 ${flowsLoading ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {flowsLoading ? (
            <FlowGridSkeleton count={3} />
          ) : filteredFlows.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <LayoutGrid className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">
                {searchTerm ? 'Nenhum flow encontrado' : 'Nenhum flow ainda'}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {searchTerm ? 'Tente outro termo' : 'Crie seu primeiro flow para mapear campanhas'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreateFlow}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Flow
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFlows.map((flow) => (
                <div
                  key={flow.id}
                  className="group border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleEditFlow(flow.id)}
                >
                  <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-200 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <LayoutGrid className="w-7 h-7 text-slate-300" />
                    </div>
                    {flow.tags?.includes('meta-ads') && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#1877F2] text-white text-xs font-medium rounded">
                        Meta Ads
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-0.5 bg-white rounded-lg shadow-md p-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditFlow(flow.id) }}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFlow(flow.id) }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{flow.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {flow.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(flow.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span>{flow.nodes?.length || 0} nodes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFlows.map((flow) => (
                <div
                  key={flow.id}
                  className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-slate-50 transition-all cursor-pointer"
                  onClick={() => handleEditFlow(flow.id)}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <LayoutGrid className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-900 truncate">{flow.name}</h3>
                      {flow.tags?.includes('meta-ads') && (
                        <span className="px-1.5 py-0.5 bg-[#1877F2] text-white text-[10px] font-medium rounded">
                          Meta
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{flow.description || 'Sem descrição'}</p>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {new Date(flow.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFlow(flow.id) }}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
