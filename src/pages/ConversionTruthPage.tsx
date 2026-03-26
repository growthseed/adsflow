/**
 * ============================================
 * CONVERSION TRUTH PAGE — Verdade da Conversão
 * ============================================
 * Side-by-side comparison: what platforms report
 * vs what actually happened in your CRM/business.
 */

import { useState, useEffect, useMemo } from 'react'
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  DollarSign,
  BarChart3,
  Target,
  ArrowRight,
  RefreshCw,
  Calendar,
  Info,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { conversionTruthService } from '@/services/conversionTruthService'
import type {
  ConversionTruthRow,
  ConversionQualityRow,
  ConversionGap,
  DateRange,
} from '@/services/conversionTruthService'

// =====================================================
// DATE HELPERS
// =====================================================

function getDefaultDateRange(): DateRange {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  return {
    from: from.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// =====================================================
// KPI CARD
// =====================================================

function KPICard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string
  subValue?: string
  color: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
    slate: { bg: 'bg-slate-50', icon: 'text-slate-600', border: 'border-slate-100' },
  }
  const c = colorMap[color] || colorMap.slate

  return (
    <div className={`bg-white border ${c.border} rounded-xl p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      {subValue && (
        <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>
      )}
    </div>
  )
}

// =====================================================
// REALITY RATE BADGE
// =====================================================

function RealityBadge({ rate }: { rate: number }) {
  let bg = 'bg-red-100 text-red-700'
  if (rate >= 80) bg = 'bg-emerald-100 text-emerald-700'
  else if (rate >= 50) bg = 'bg-amber-100 text-amber-700'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${bg}`}>
      {formatPercent(rate)}
    </span>
  )
}

// =====================================================
// QUALITY SCORE BAR
// =====================================================

function QualityBar({ score }: { score: number }) {
  let barColor = 'bg-red-500'
  if (score >= 80) barColor = 'bg-emerald-500'
  else if (score >= 50) barColor = 'bg-amber-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600 w-8 text-right">{score}%</span>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function ConversionTruthPage() {
  const { activeClient } = useAuth()
  const clientId = activeClient?.client_id || ''

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)
  const [truthData, setTruthData] = useState<ConversionTruthRow[]>([])
  const [qualityData, setQualityData] = useState<ConversionQualityRow[]>([])
  const [gap, setGap] = useState<ConversionGap>({ platformSays: 0, realityIs: 0, gap: 0, realityRate: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, dateRange])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [truth, quality, gapResult] = await Promise.all([
        conversionTruthService.getConversionTruth(clientId, dateRange),
        conversionTruthService.getConversionQuality(clientId),
        conversionTruthService.getConversionGap(clientId, dateRange),
      ])
      setTruthData(truth)
      setQualityData(quality)
      setGap(gapResult)
    } catch (err) {
      console.error('[ConversionTruthPage] Error loading data:', err)
      setError('Erro ao carregar dados de conversão.')
    } finally {
      setLoading(false)
    }
  }

  // Aggregate KPI totals
  const totals = useMemo(() => {
    const totalSpend = truthData.reduce((s, r) => s + (r.total_spend || 0), 0)
    const totalRealLeads = truthData.reduce((s, r) => s + (r.real_leads || 0), 0)
    const totalQualified = truthData.reduce((s, r) => s + (r.qualified_leads || 0), 0)
    const totalRevenue = truthData.reduce((s, r) => s + (r.real_revenue || 0), 0)
    const realCPL = totalRealLeads > 0 ? totalSpend / totalRealLeads : 0
    const realROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
    return { totalSpend, totalRealLeads, totalQualified, totalRevenue, realCPL, realROAS }
  }, [truthData])

  // Quality map for the table
  const qualityMap = useMemo(() => {
    const map = new Map<string, ConversionQualityRow>()
    for (const q of qualityData) {
      if (q.campaign_name) map.set(q.campaign_name, q)
    }
    return map
  }, [qualityData])

  // ── No client selected ──
  if (!clientId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Selecione um cliente para ver a Verdade da Conversão.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            Verdade da Conversão
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare o que as plataformas reportam vs. o que realmente aconteceu no seu CRM.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className="text-sm text-slate-700 border-none outline-none bg-transparent w-32"
            />
            <ArrowRight className="w-3 h-3 text-slate-300" />
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className="text-sm text-slate-700 border-none outline-none bg-transparent w-32"
            />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={BarChart3}
          label="Conversões Reportadas"
          value={gap.platformSays.toLocaleString('pt-BR')}
          subValue="Segundo as plataformas"
          color="slate"
        />
        <KPICard
          icon={Users}
          label="Leads Reais"
          value={gap.realityIs.toLocaleString('pt-BR')}
          subValue={`${totals.totalQualified} qualificados`}
          color={gap.realityRate >= 80 ? 'green' : gap.realityRate >= 50 ? 'amber' : 'red'}
          trend={gap.realityRate >= 80 ? 'up' : 'down'}
        />
        <KPICard
          icon={Target}
          label="Taxa de Realidade"
          value={formatPercent(gap.realityRate)}
          subValue={`Gap: ${Math.abs(gap.gap)} leads`}
          color={gap.realityRate >= 80 ? 'green' : gap.realityRate >= 50 ? 'amber' : 'red'}
        />
        <KPICard
          icon={DollarSign}
          label="CPL Real"
          value={formatCurrency(totals.realCPL)}
          subValue={`Investimento: ${formatCurrency(totals.totalSpend)}`}
          color="blue"
        />
      </div>

      {/* ── Truth vs Platform Visual ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Platform says */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">O que a plataforma diz</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400">Conversões</p>
              <p className="text-xl font-bold text-slate-700">{gap.platformSays.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">CPL Reportado</p>
              <p className="text-xl font-bold text-slate-700">
                {formatCurrency(gap.platformSays > 0 ? totals.totalSpend / gap.platformSays : 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">ROAS Reportado</p>
              <p className="text-xl font-bold text-slate-700">
                {truthData.length > 0
                  ? (truthData.reduce((s, r) => s + (r.reported_roas || 0), 0) / truthData.length).toFixed(2) + 'x'
                  : '0.00x'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Gap */}
        <div className={`border rounded-xl p-5 shadow-sm flex flex-col items-center justify-center text-center ${
          gap.realityRate >= 80
            ? 'bg-emerald-50 border-emerald-200'
            : gap.realityRate >= 50
            ? 'bg-amber-50 border-amber-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <AlertTriangle className={`w-8 h-8 mb-3 ${
            gap.realityRate >= 80 ? 'text-emerald-500' : gap.realityRate >= 50 ? 'text-amber-500' : 'text-red-500'
          }`} />
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Gap de Conversão</p>
          <p className={`text-4xl font-black ${
            gap.realityRate >= 80 ? 'text-emerald-700' : gap.realityRate >= 50 ? 'text-amber-700' : 'text-red-700'
          }`}>
            {formatPercent(gap.realityRate)}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {gap.gap < 0
              ? `${Math.abs(gap.gap)} leads a menos que o reportado`
              : gap.gap > 0
              ? `${gap.gap} leads a mais que o reportado`
              : 'Dados alinhados'}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
            <Info className="w-3 h-3" />
            <span>Taxa de Realidade = Leads Reais / Reportados</span>
          </div>
        </div>

        {/* Right: Reality */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-700">O que realmente aconteceu</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400">Leads Reais</p>
              <p className="text-xl font-bold text-emerald-700">{gap.realityIs.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">CPL Real</p>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(totals.realCPL)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">ROAS Real</p>
              <p className="text-xl font-bold text-emerald-700">{totals.realROAS.toFixed(2)}x</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Comparison Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Comparativo por Campanha</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Carregando dados...</p>
          </div>
        ) : truthData.length === 0 ? (
          <div className="p-8 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Nenhum dado de conversão encontrado para o período.</p>
            <p className="text-xs text-slate-400 mt-1">
              Adicione leads de atribuição ou sincronize dados da plataforma para começar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Campanha</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Conv. Plataforma</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Leads Reais</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Gap</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Taxa Realidade</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">CPL Reportado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">CPL Real</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {truthData.map((row, idx) => {
                  const quality = qualityMap.get(row.campaign_name || '')
                  const rowGap = row.real_leads - row.platform_leads

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-slate-900 truncate max-w-[220px]">
                            {row.campaign_name || 'Sem nome'}
                          </p>
                          <p className="text-xs text-slate-400">{row.platform || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 font-medium">
                        {row.platform_conversions.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {row.real_leads.toLocaleString('pt-BR')}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        rowGap < 0 ? 'text-red-600' : rowGap > 0 ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {rowGap > 0 ? '+' : ''}{rowGap}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <RealityBadge rate={row.reality_rate} />
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatCurrency(row.reported_cpl)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(row.real_cpl)}
                      </td>
                      <td className="px-4 py-3 w-32">
                        <QualityBar score={quality?.quality_score || 0} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
