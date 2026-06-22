/**
 * Public Client Portal V3 — rota pública `/portal-v3/:slug`
 *
 * Versão otimizada com:
 *   - HeroBigNumber (Receita atribuída no topo com semáforo)
 *   - GoalRings (3 anéis: Investimento, Leads, ROAS vs Meta)
 *   - KPI Strip avançada (sparklines + variação)
 *   - AI Insights priorizados
 *   - AttributionDonut (Meta × Google × outros)
 *   - Campanhas Top performers
 *   - Histórico mensal (6 meses)
 *   - Daily activity
 *
 * Lê de src/data/snapshots/performance-snapshot.json (enriquecido).
 * NÃO depende de Supabase RPC — funciona 100% offline pra demo.
 */

import { useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Activity,
  Calendar,
  Award,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import performanceSnapshot from '@/data/snapshots/performance-snapshot.json'
import {
  HeroBigNumberWidget,
  GoalRingWidget,
  KpiCardAdvancedWidget,
  AIInsightWidget,
  AttributionDonutWidget,
  type AIInsight,
  type AttributionItem,
} from '@/components/canonical/widgets'

// ============================================
// Helpers
// ============================================

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v)

const BRL_DEC = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)

const NUM = (v: number) => v.toLocaleString('pt-BR')

const PLATFORM_COLORS: Record<string, string> = {
  meta_ads: '#0866ff',
  google_ads: '#4285f4',
  linkedin: '#0a66c2',
  organic: '#10b981',
  tiktok: '#000000',
}

const PLATFORM_LABELS: Record<string, string> = {
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  linkedin: 'LinkedIn',
  organic: 'Orgânico',
  tiktok: 'TikTok',
}

// ============================================
// Component
// ============================================

interface MonthlyHistoryItem {
  month: string
  label: string
  spend: number
  conversions: number
  sales?: number
  conversion_value?: number
  roas?: number
  partial?: boolean
}

interface DailyMetric {
  date: string
  spend: number
  clicks: number
  conversions: number
  impressions: number
}

interface CampaignSummary {
  id: string
  name: string
  status: string
  platform: string
  metrics: {
    spend: number
    conversions: number
    sales?: number
    conversion_value?: number
    roas?: number
    ctr?: number
    cpc?: number
  }
}

interface PlatformData {
  platform: string
  account_name: string
  summary: {
    spend: number
    impressions: number
    clicks: number
    conversions: number
    sales?: number
    conversion_value?: number
    roas?: number
    active_campaigns?: number
  }
  campaigns: CampaignSummary[]
  daily: DailyMetric[]
}

interface ClientPerformanceData {
  client_slug: string
  client_name: string
  period: { from: string; to: string; label: string }
  platforms: Record<string, PlatformData>
  blended: {
    total_spend: number
    total_impressions: number
    total_clicks: number
    total_conversions: number
    total_sales?: number
    total_conversion_value?: number
    roas?: number
    cpl?: number
    cac?: number
    ltv_estimated?: number
    ltv_cac_ratio?: number
    payback_meses?: number
    avg_ticket?: number
  }
  goals?: Record<string, { target: number; actual: number; period: string }>
  monthly_history?: MonthlyHistoryItem[]
  ai_insights?: AIInsight[]
}

export default function PublicClientPortalV3Page() {
  const { slug } = useParams<{ slug: string }>()

  const client = useMemo<ClientPerformanceData | null>(() => {
    if (!slug) return null
    const clients = (performanceSnapshot as { clients: Record<string, ClientPerformanceData> }).clients
    return clients[slug] ?? null
  }, [slug])

  if (!slug) return <Navigate to="/portal-v3/homero-reis" replace />

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Cliente não encontrado
          </h1>
          <p className="text-slate-600 mb-4">
            O slug <code className="px-2 py-0.5 bg-slate-200 rounded">{slug}</code> não existe nos snapshots.
          </p>
          <p className="text-sm text-slate-500">
            Clientes disponíveis:{' '}
            {Object.keys((performanceSnapshot as { clients: Record<string, unknown> }).clients).join(', ')}
          </p>
        </div>
      </div>
    )
  }

  const b = client.blended
  const goals = client.goals ?? {}
  const monthly = client.monthly_history ?? []
  const insights = client.ai_insights ?? []

  // Calcula variação vs mês anterior (último vs penúltimo do histórico)
  const variations = useMemo(() => {
    if (monthly.length < 2) return { spend: null, leads: null, revenue: null, roas: null }
    const cur = monthly[monthly.length - 1]
    const prev = monthly[monthly.length - 2]
    const variation = (a: number, p: number) => (p > 0 ? (a - p) / p : null)
    return {
      spend: variation(cur.spend, prev.spend),
      leads: variation(cur.conversions, prev.conversions),
      revenue: variation(cur.conversion_value ?? 0, prev.conversion_value ?? 0),
      roas: variation(cur.roas ?? 0, prev.roas ?? 0),
    }
  }, [monthly])

  // Sparklines (últimos 6 meses)
  const sparkSpend = monthly.map((m) => m.spend)
  const sparkLeads = monthly.map((m) => m.conversions)

  // Atribuição (cada plataforma)
  const attributionData: AttributionItem[] = Object.values(client.platforms)
    .filter((p) => p.summary.spend > 0)
    .map((p) => ({
      platform: p.platform,
      label: PLATFORM_LABELS[p.platform] ?? p.platform,
      spend: p.summary.spend,
      revenue: p.summary.conversion_value ?? 0,
      roas: p.summary.roas ?? 0,
      color: PLATFORM_COLORS[p.platform] ?? '#64748b',
    }))

  // Top campanhas por ROAS
  const allCampaigns: CampaignSummary[] = Object.values(client.platforms).flatMap(
    (p) => p.campaigns ?? [],
  )
  const topCampaigns = [...allCampaigns]
    .filter((c) => c.metrics.spend > 0)
    .sort((a, b) => (b.metrics.roas ?? 0) - (a.metrics.roas ?? 0))
    .slice(0, 5)

  // Daily breakdown agregado (todas plataformas somadas por data)
  const dailyAgg = useMemo(() => {
    const map = new Map<string, { date: string; spend: number; conversions: number; clicks: number }>()
    Object.values(client.platforms).forEach((p) => {
      ;(p.daily ?? []).forEach((d) => {
        const cur = map.get(d.date) ?? { date: d.date, spend: 0, conversions: 0, clicks: 0 }
        cur.spend += d.spend
        cur.conversions += d.conversions
        cur.clicks += d.clicks
        map.set(d.date, cur)
      })
    })
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [client])

  // Pacing: dias decorridos do mês
  const today = new Date()
  const periodDay = today.getDate()
  const periodTotalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{client.client_name}</h1>
            <p className="text-xs text-slate-500">
              Relatório de Performance · {client.period.label}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>{periodDay} de {periodTotalDays} dias</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ========== AI INSIGHTS ========== */}
        {insights.length > 0 && <AIInsightWidget insights={insights} maxItems={3} />}

        {/* ========== HERO ========== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HeroBigNumberWidget
            label="Receita Atribuída"
            value={BRL(b.total_conversion_value ?? 0)}
            variationPct={variations.revenue}
            comparisonLabel="vs. mês anterior"
            helperText={`${b.total_sales ?? 0} vendas fechadas no período`}
            higherIsBetter
          />
          <HeroBigNumberWidget
            label="ROAS (Retorno sobre Investimento)"
            value={`${(b.roas ?? 0).toFixed(2).replace('.', ',')}x`}
            variationPct={variations.roas}
            comparisonLabel="vs. mês anterior"
            helperText={`Cada R$ 1 investido retornou R$ ${(b.roas ?? 0).toFixed(2).replace('.', ',')}`}
            higherIsBetter
          />
        </section>

        {/* ========== GOAL RINGS ========== */}
        {goals && Object.keys(goals).length > 0 && (
          <section className="rounded-2xl bg-white ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Metas do mês</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atingimento até {today.toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Target className="w-5 h-5 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {goals.spend && (
                <GoalRingWidget
                  label="Investimento"
                  current={goals.spend.actual}
                  target={goals.spend.target}
                  format={BRL}
                  subText={`Meta: ${BRL(goals.spend.target)}`}
                  higherIsBetter={false}
                />
              )}
              {goals.leads && (
                <GoalRingWidget
                  label="Leads"
                  current={goals.leads.actual}
                  target={goals.leads.target}
                  format={(v) => NUM(Math.round(v))}
                  subText={`Meta: ${NUM(goals.leads.target)}`}
                />
              )}
              {goals.sales && (
                <GoalRingWidget
                  label="Vendas"
                  current={goals.sales.actual}
                  target={goals.sales.target}
                  format={(v) => NUM(Math.round(v))}
                  subText={`Meta: ${NUM(goals.sales.target)}`}
                />
              )}
              {goals.roas && (
                <GoalRingWidget
                  label="ROAS"
                  current={goals.roas.actual}
                  target={goals.roas.target}
                  format={(v) => `${v.toFixed(1).replace('.', ',')}x`}
                  subText={`Meta: ${goals.roas.target}x`}
                />
              )}
            </div>
          </section>
        )}

        {/* ========== KPI STRIP ========== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCardAdvancedWidget
            label="Investimento"
            value={BRL(b.total_spend)}
            Icon={DollarSign}
            hint="período"
            variationPct={variations.spend}
            higherIsBetter={false}
            sparkline={sparkSpend}
          />
          <KpiCardAdvancedWidget
            label="Leads gerados"
            value={NUM(b.total_conversions)}
            Icon={Users}
            hint="período"
            variationPct={variations.leads}
            higherIsBetter
            sparkline={sparkLeads}
          />
          <KpiCardAdvancedWidget
            label="Custo por Lead"
            value={BRL_DEC(b.cpl ?? 0)}
            Icon={Activity}
            variationPct={variations.spend != null && variations.leads != null
              ? (1 + variations.spend) / (1 + variations.leads) - 1
              : null}
            higherIsBetter={false}
          />
          <KpiCardAdvancedWidget
            label="LTV : CAC"
            value={`${(b.ltv_cac_ratio ?? 0).toFixed(1).replace('.', ',')}x`}
            Icon={Award}
            hint="ideal ≥ 3x"
            higherIsBetter
          />
        </section>

        {/* ========== ATRIBUIÇÃO ========== */}
        {attributionData.length > 1 && (
          <section>
            <AttributionDonutWidget
              title="De onde veio a receita?"
              subtitle="Atribuição cross-platform por canal pago"
              data={attributionData}
            />
          </section>
        )}

        {/* ========== HISTÓRICO MENSAL ========== */}
        {monthly.length > 0 && (
          <section className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Histórico mensal</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Últimos {monthly.length} meses · Receita × Investimento
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      BRL(Number(value)),
                      String(name) === 'spend' ? 'Investimento' : 'Receita',
                    ]}
                    labelStyle={{ color: '#0f172a' }}
                  />
                  <Bar dataKey="conversion_value" name="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spend" name="spend" fill="#0866ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ========== ATIVIDADE DIÁRIA ========== */}
        {dailyAgg.length > 0 && (
          <section className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Atividade diária</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Investimento e leads por dia
                </p>
              </div>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <AreaChart data={dailyAgg}>
                  <defs>
                    <linearGradient id="grad-spend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0866ff" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0866ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(d: string) => d.slice(8, 10)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip formatter={(value) => BRL_DEC(Number(value))} />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="#0866ff"
                    strokeWidth={2}
                    fill="url(#grad-spend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ========== TOP CAMPANHAS ========== */}
        {topCampaigns.length > 0 && (
          <section className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Top 5 campanhas por ROAS
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Período atual</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 pr-3">Campanha</th>
                    <th className="text-left py-2 px-3">Canal</th>
                    <th className="text-right py-2 px-3">Investimento</th>
                    <th className="text-right py-2 px-3">Leads</th>
                    <th className="text-right py-2 px-3">Vendas</th>
                    <th className="text-right py-2 pl-3">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((c, i) => (
                    <tr
                      key={c.id}
                      className={i % 2 ? 'bg-slate-50/50' : ''}
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.status === 'enabled' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          <span className="font-medium text-slate-800">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {PLATFORM_LABELS[c.platform] ?? c.platform}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                        {BRL_DEC(c.metrics.spend)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                        {NUM(c.metrics.conversions)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                        {NUM(c.metrics.sales ?? 0)}
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular-nums">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                            (c.metrics.roas ?? 0) >= 3
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : (c.metrics.roas ?? 0) >= 1
                                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                          }`}
                        >
                          {(c.metrics.roas ?? 0).toFixed(1).replace('.', ',')}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ========== FINANCEIRAS DETALHADAS ========== */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              CAC (Custo de Aquisição)
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
              {BRL_DEC(b.cac ?? 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">por venda fechada</p>
          </div>
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              LTV Estimado
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
              {BRL(b.ltv_estimated ?? 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">vida útil do cliente</p>
          </div>
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Ticket Médio
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
              {BRL(b.avg_ticket ?? 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">por venda</p>
          </div>
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Payback CAC
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
              {(b.payback_meses ?? 0).toFixed(1).replace('.', ',')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">meses pra recuperar</p>
          </div>
        </section>

        {/* ========== FOOTER ========== */}
        <footer className="pt-8 pb-4 text-center">
          <p className="text-xs text-slate-400">
            Relatório gerado pelo <span className="font-semibold">Ads Flow</span>{' '}
            · Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Powered by Efeito Digital
          </p>
        </footer>
      </main>
     </div>
  )
}
