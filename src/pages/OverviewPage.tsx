/**
 * ============================================
 * OVERVIEW PAGE — Visão Geral Cross-Client
 * ============================================
 * Dashboard da agência mostrando todos os clientes,
 * KPIs agregados, ranking de performance e alertas.
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  Building2,
  BarChart3,
  Crown,
  Medal,
  Award,
  RefreshCw,
  MousePointer,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDateRange } from '@/contexts/DateRangeContext'
import DateRangeSelector from '@/components/UI/DateRangeSelector'
import { goalsService } from '@/services/goalsService'
import type { GoalWithProgress } from '@/services/goalsService'

// =====================================================
// TYPES
// =====================================================

interface ClientOverview {
  client_id: string
  name: string
  logo_url: string | null
  slug: string
  spend: number
  leads: number
  roas: number
  cpl: number
  revenue: number
  spendTrend: number
  leadsTrend: number
  roasTrend: number
  status: 'on_track' | 'attention' | 'off_track'
  goalsTotal: number
  goalsOnTrack: number
  lastSync: string | null
}

// =====================================================
// HELPERS
// =====================================================

function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatNumber(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return v.toLocaleString('pt-BR')
}

function getStatusColor(status: string) {
  switch (status) {
    case 'on_track':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' }
    case 'attention':
      return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' }
    case 'off_track':
      return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'on_track':
      return 'No caminho'
    case 'attention':
      return 'Atenção'
    case 'off_track':
      return 'Fora da meta'
    default:
      return 'Sem dados'
  }
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-400">
        <Minus className="w-3 h-3" /> 0%
      </span>
    )
  }
  const positive = value > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        positive ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}

const RANK_ICONS = [Crown, Medal, Award]

// =====================================================
// AGGREGATED KPI CARD
// =====================================================

function AggKPI({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext?: string
  color: string
}) {
  const borderMap: Record<string, string> = {
    'bg-blue-600': 'border-l-blue-600',
    'bg-purple-600': 'border-l-purple-600',
    'bg-emerald-600': 'border-l-emerald-600',
    'bg-amber-600': 'border-l-amber-600',
    'bg-indigo-600': 'border-l-indigo-600',
  }
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${
        borderMap[color] || 'border-l-slate-400'
      } p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 ${color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
  )
}

// =====================================================
// CLIENT CARD
// =====================================================

function ClientCard({
  client,
  onClick,
}: {
  client: ClientOverview
  onClick: () => void
}) {
  const statusStyle = getStatusColor(client.status)

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {client.logo_url ? (
            <img src={client.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
              {client.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
              <span className={`text-[10px] font-medium ${statusStyle.text}`}>
                {getStatusLabel(client.status)}
              </span>
            </div>
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-medium">Invest.</p>
          <p className="text-sm font-bold text-slate-900">{formatCurrency(client.spend)}</p>
          <TrendBadge value={client.spendTrend} />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-medium">Leads</p>
          <p className="text-sm font-bold text-slate-900">{formatNumber(client.leads)}</p>
          <TrendBadge value={client.leadsTrend} />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-medium">ROAS</p>
          <p className="text-sm font-bold text-slate-900">{client.roas.toFixed(2)}x</p>
          <TrendBadge value={client.roasTrend} />
        </div>
      </div>

      {/* Footer: Goals + Sync */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <span className="text-[10px] text-slate-400">
          {client.goalsOnTrack}/{client.goalsTotal} metas no caminho
        </span>
        {client.lastSync && (
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(client.lastSync).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function OverviewPage() {
  const navigate = useNavigate()
  const { clients, setActiveClient } = useAuth()
  const { dateRange, setDateRange } = useDateRange()

  const [clientOverviews, setClientOverviews] = useState<ClientOverview[]>([])
  const [loading, setLoading] = useState(true)

  // Load overview data for all clients
  useEffect(() => {
    async function loadOverviews() {
      setLoading(true)
      const overviews: ClientOverview[] = []

      for (const membership of clients) {
        let goalsSummary: GoalWithProgress[] = []
        try {
          goalsSummary = await goalsService.getGoalsSummary(membership.client_id)
        } catch {
          // ignore — may have no goals
        }

        const goalsOnTrack = goalsSummary.filter((g) => g.progress_pct >= 80).length
        const goalsTotal = goalsSummary.length

        // Determine status based on goals
        let status: 'on_track' | 'attention' | 'off_track' = 'on_track'
        if (goalsTotal > 0) {
          const avgProgress =
            goalsSummary.reduce((sum, g) => sum + g.progress_pct, 0) / goalsTotal
          if (avgProgress < 50) status = 'off_track'
          else if (avgProgress < 80) status = 'attention'
        }

        // Aggregate spend/leads from goal snapshots if available
        const spendGoal = goalsSummary.find((g) => g.metric === 'spend')
        const leadsGoal = goalsSummary.find((g) => g.metric === 'leads')
        const roasGoal = goalsSummary.find((g) => g.metric === 'roas')
        const revenueGoal = goalsSummary.find((g) => g.metric === 'revenue')
        const cplGoal = goalsSummary.find((g) => g.metric === 'cpl')

        overviews.push({
          client_id: membership.client_id,
          name: membership.client.name,
          logo_url: membership.client.logo_url,
          slug: membership.client.slug,
          spend: spendGoal?.current_value || 0,
          leads: leadsGoal?.current_value || 0,
          roas: roasGoal?.current_value || 0,
          cpl: cplGoal?.current_value || 0,
          revenue: revenueGoal?.current_value || 0,
          spendTrend: spendGoal?.trend || 0,
          leadsTrend: leadsGoal?.trend || 0,
          roasTrend: roasGoal?.trend || 0,
          status,
          goalsTotal,
          goalsOnTrack,
          lastSync: null,
        })
      }

      setClientOverviews(overviews)
      setLoading(false)
    }

    if (clients.length > 0) {
      loadOverviews()
    } else {
      setLoading(false)
    }
  }, [clients])

  // Aggregated KPIs
  const totals = useMemo(() => {
    const totalSpend = clientOverviews.reduce((s, c) => s + c.spend, 0)
    const totalLeads = clientOverviews.reduce((s, c) => s + c.leads, 0)
    const totalRevenue = clientOverviews.reduce((s, c) => s + c.revenue, 0)
    const avgRoas =
      clientOverviews.length > 0
        ? clientOverviews.reduce((s, c) => s + c.roas, 0) / clientOverviews.filter((c) => c.roas > 0).length || 0
        : 0
    const avgCpl =
      totalLeads > 0 ? totalSpend / totalLeads : 0

    return { totalSpend, totalLeads, totalRevenue, avgRoas, avgCpl }
  }, [clientOverviews])

  // Rankings
  const topByRoas = useMemo(
    () => [...clientOverviews].filter((c) => c.roas > 0).sort((a, b) => b.roas - a.roas).slice(0, 5),
    [clientOverviews]
  )
  const topByCpl = useMemo(
    () =>
      [...clientOverviews]
        .filter((c) => c.cpl > 0)
        .sort((a, b) => a.cpl - b.cpl)
        .slice(0, 5),
    [clientOverviews]
  )
  const topByLeads = useMemo(
    () => [...clientOverviews].filter((c) => c.leads > 0).sort((a, b) => b.leads - a.leads).slice(0, 5),
    [clientOverviews]
  )

  // Alerts
  const offTrackClients = useMemo(
    () => clientOverviews.filter((c) => c.status === 'off_track'),
    [clientOverviews]
  )

  const handleClientClick = (clientId: string) => {
    setActiveClient(clientId)
    navigate('/dashboard')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
          <p className="text-sm text-slate-500 mt-1">
            Performance de todos os clientes da agência
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aggregated KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <AggKPI
          icon={DollarSign}
          label="Total Investido"
          value={formatCurrency(totals.totalSpend)}
          subtext={`${clients.length} clientes`}
          color="bg-blue-600"
        />
        <AggKPI
          icon={Target}
          label="Total Leads"
          value={formatNumber(totals.totalLeads)}
          color="bg-emerald-600"
        />
        <AggKPI
          icon={DollarSign}
          label="Total Receita"
          value={formatCurrency(totals.totalRevenue)}
          color="bg-purple-600"
        />
        <AggKPI
          icon={TrendingUp}
          label="ROAS Médio"
          value={totals.avgRoas > 0 ? `${totals.avgRoas.toFixed(2)}x` : '--'}
          color="bg-amber-600"
        />
        <AggKPI
          icon={MousePointer}
          label="CPL Médio"
          value={totals.avgCpl > 0 ? formatCurrency(totals.avgCpl) : '--'}
          color="bg-indigo-600"
        />
      </div>

      {/* Alerts */}
      {offTrackClients.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-red-800">
              {offTrackClients.length} cliente(s) fora da meta
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {offTrackClients.map((c) => (
              <button
                key={c.client_id}
                onClick={() => handleClientClick(c.client_id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-sm text-red-700 hover:bg-red-50 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Client Cards Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Clientes ({clients.length})
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                  <div>
                    <div className="h-4 bg-slate-200 rounded w-28 mb-1" />
                    <div className="h-3 bg-slate-100 rounded w-16" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j}>
                      <div className="h-3 bg-slate-100 rounded w-12 mb-1" />
                      <div className="h-5 bg-slate-200 rounded w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Nenhum cliente cadastrado</h3>
            <p className="text-sm text-slate-500 mb-4">
              Cadastre clientes para visualizar a performance geral.
            </p>
            <button
              onClick={() => navigate('/clients')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Building2 className="w-4 h-4" />
              Cadastrar Cliente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientOverviews.map((client) => (
              <ClientCard
                key={client.client_id}
                client={client}
                onClick={() => handleClientClick(client.client_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Top Performers Tables */}
      {clientOverviews.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top ROAS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Top ROAS
            </h3>
            {topByRoas.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {topByRoas.map((c, i) => {
                  const RankIcon = RANK_ICONS[i] || BarChart3
                  return (
                    <div
                      key={c.client_id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-2 -mx-2 transition-colors"
                      onClick={() => handleClientClick(c.client_id)}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          i < 3 ? 'bg-amber-100' : 'bg-slate-100'
                        }`}
                      >
                        <RankIcon
                          className={`w-3.5 h-3.5 ${i < 3 ? 'text-amber-600' : 'text-slate-400'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{c.roas.toFixed(2)}x</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top CPL (lower is better) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Melhor CPL
            </h3>
            {topByCpl.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {topByCpl.map((c, i) => {
                  const RankIcon = RANK_ICONS[i] || BarChart3
                  return (
                    <div
                      key={c.client_id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-2 -mx-2 transition-colors"
                      onClick={() => handleClientClick(c.client_id)}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          i < 3 ? 'bg-emerald-100' : 'bg-slate-100'
                        }`}
                      >
                        <RankIcon
                          className={`w-3.5 h-3.5 ${i < 3 ? 'text-emerald-600' : 'text-slate-400'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(c.cpl)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top Leads */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              Mais Leads
            </h3>
            {topByLeads.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {topByLeads.map((c, i) => {
                  const RankIcon = RANK_ICONS[i] || BarChart3
                  return (
                    <div
                      key={c.client_id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-2 -mx-2 transition-colors"
                      onClick={() => handleClientClick(c.client_id)}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          i < 3 ? 'bg-blue-100' : 'bg-slate-100'
                        }`}
                      >
                        <RankIcon
                          className={`w-3.5 h-3.5 ${i < 3 ? 'text-blue-600' : 'text-slate-400'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {formatNumber(c.leads)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
