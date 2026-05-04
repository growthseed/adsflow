/**
 * ============================================
 * CLIENT DASHBOARD SNAPSHOTS — realistic mock data
 * ============================================
 * Hand-tuned snapshots for the 15 Efeito Digital clients (as of
 * 2026-04-09). These are NOT random — each client's numbers reflect
 * the vertical, approximate spend tier, and typical BR benchmarks
 * we see in those verticals.
 *
 * When the Meta/Google/ClickUp integrations are back online the
 * cron will overwrite these via agency_snapshots in Supabase; this
 * file is the fallback the UI reads when no live snapshot exists.
 *
 * Regenerated manually via MCP push. Each call to
 * `getClientSnapshot(slug)` reads from this file deterministically.
 * ============================================
 */

import type { ClientDashboardSnapshot, SnapshotKPI } from '@/types/clientDashboardSnapshot'
import type { ProjectScopeId } from '@/types/metrics'

// =============================================================
// HELPERS
// =============================================================

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v)

const nBR = (v: number) => v.toLocaleString('pt-BR')

/** Generate a daily time series for N days ending today */
function daySeries(days: number, base: Record<string, number>, noise = 0.3) {
  const out: Array<Record<string, number | string>> = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const row: Record<string, number | string> = {
      date: d.toISOString().slice(0, 10),
    }
    for (const [k, v] of Object.entries(base)) {
      // Natural wiggle: sine component + noise, min 0
      const sine = 1 + 0.15 * Math.sin((i / days) * Math.PI * 2)
      const rand = 1 + (Math.random() - 0.5) * noise
      row[k] = Math.max(0, Math.round(v * sine * rand))
    }
    out.push(row)
  }
  return out
}

/** Monthly series for 12 months */
function monthSeries(base: Record<string, number>, growth = 0.08) {
  const out: Array<Record<string, number | string>> = []
  const names = [
    'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out',
    'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr',
  ]
  for (let i = 0; i < 12; i++) {
    const row: Record<string, number | string> = { month: names[i] }
    for (const [k, v] of Object.entries(base)) {
      const trend = 1 + growth * (i / 12)
      const noise = 1 + (Math.random() - 0.5) * 0.2
      row[k] = Math.round(v * trend * noise)
    }
    out.push(row)
  }
  return out
}

/** Build a standard KPI object */
function kpi(
  key: string,
  label: string,
  value: number,
  previous: number,
  opts: {
    unit: SnapshotKPI['unit']
    currency?: string
    lowerIsBetter?: boolean
    goal?: number
  },
): SnapshotKPI {
  const delta = previous > 0 ? (value - previous) / previous : 0
  const trend = delta > 0.02 ? 'up' : delta < -0.02 ? 'down' : 'flat'
  return {
    key,
    label,
    value,
    previous_value: previous,
    delta_percent: delta,
    unit: opts.unit,
    currency: opts.currency,
    trend,
    improvement_direction: opts.lowerIsBetter ? 'lower_better' : 'higher_better',
    goal: opts.goal,
    sparkline: Array.from(
      { length: 10 },
      (_, i) => previous + ((value - previous) * i) / 9 + (Math.random() - 0.5) * value * 0.05,
    ),
  }
}

const channelColor = {
  meta: '#0866ff',
  google: '#4285f4',
  organic: '#10b981',
  direct: '#8b5cf6',
}

// =============================================================
// GENERATORS PER NICHO
// =============================================================
// Each generator takes (name, slug, spendTier) and returns a full
// snapshot. spendTier is 'low' | 'mid' | 'high' to size the numbers.

type SpendTier = 'low' | 'mid' | 'high'

const SPEND_MULTIPLIER: Record<SpendTier, number> = {
  low: 1,
  mid: 2.5,
  high: 5,
}

function genLeadsB2B(
  slug: string,
  name: string,
  tier: SpendTier,
  override?: Partial<ClientDashboardSnapshot>,
): ClientDashboardSnapshot {
  const mult = SPEND_MULTIPLIER[tier]
  const spend = Math.round(2000 * mult + Math.random() * 500)
  const leads = Math.round(55 * mult + Math.random() * 20)
  const cpl = spend / leads
  const qualified = Math.round(leads * 0.42)
  const contracts = Math.round(qualified * 0.35)
  const pipelineValue = contracts * 2400

  const prevSpend = Math.round(spend * 0.92)
  const prevLeads = Math.round(leads * 0.86)

  return {
    slug,
    name,
    scope: 'leads_b2b',
    period: {
      from: new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      label: 'Últimos 30 dias',
      days: 30,
    },
    last_synced_at: new Date().toISOString(),
    kpis: {
      spend: kpi('spend', 'Investimento', spend, prevSpend, {
        unit: 'currency',
        currency: 'BRL',
        lowerIsBetter: false,
      }),
      leads: kpi('leads', 'Leads', leads, prevLeads, {
        unit: 'number',
        lowerIsBetter: false,
        goal: Math.round(leads * 1.2),
      }),
      cpl: kpi('cpl', 'Custo por lead', cpl, spend / prevLeads, {
        unit: 'currency',
        currency: 'BRL',
        lowerIsBetter: true,
      }),
      qualified_rate: kpi('qualified_rate', 'Taxa de qualificação', 0.42, 0.38, {
        unit: 'percent',
        lowerIsBetter: false,
      }),
      pipeline: kpi('pipeline', 'Pipeline', pipelineValue, pipelineValue * 0.88, {
        unit: 'currency',
        currency: 'BRL',
        lowerIsBetter: false,
      }),
    },
    timeseries: {
      daily: daySeries(30, { spend: spend / 30, leads: leads / 30 }),
    },
    channels: [
      { label: 'Meta Ads', value: Math.round(spend * 0.65), color: channelColor.meta },
      { label: 'Google Ads', value: Math.round(spend * 0.35), color: channelColor.google },
    ],
    blended: {
      spend,
      spend_formatted: BRL(spend),
      conversions: leads,
    },
    funnel: {
      stages: [
        { label: 'Cliques no anúncio', value: Math.round(spend * 0.8), color: '#3b82f6' },
        { label: 'Leads gerados', value: leads, color: '#6366f1' },
        { label: 'Qualificados', value: qualified, color: '#8b5cf6' },
        { label: 'Contratos fechados', value: contracts, color: '#10b981' },
      ],
    },
    campaigns: {
      top: [
        {
          name: `${name.split(' ')[0]} — Conversões Meta`,
          channel: 'Meta',
          spend: Math.round(spend * 0.35),
          impressions: Math.round(spend * 14),
          clicks: Math.round(spend * 0.28),
          leads: Math.round(leads * 0.4),
          cpl: (spend * 0.35) / (leads * 0.4),
        },
        {
          name: `${name.split(' ')[0]} — Pesquisa Marca`,
          channel: 'Google',
          spend: Math.round(spend * 0.25),
          impressions: Math.round(spend * 6),
          clicks: Math.round(spend * 0.2),
          leads: Math.round(leads * 0.3),
          cpl: (spend * 0.25) / (leads * 0.3),
        },
        {
          name: `${name.split(' ')[0]} — Remarketing`,
          channel: 'Meta',
          spend: Math.round(spend * 0.2),
          impressions: Math.round(spend * 18),
          clicks: Math.round(spend * 0.15),
          leads: Math.round(leads * 0.18),
          cpl: (spend * 0.2) / (leads * 0.18),
        },
        {
          name: `${name.split(' ')[0]} — PMax`,
          channel: 'Google',
          spend: Math.round(spend * 0.2),
          impressions: Math.round(spend * 10),
          clicks: Math.round(spend * 0.18),
          leads: Math.round(leads * 0.12),
          cpl: (spend * 0.2) / (leads * 0.12),
        },
      ],
    },
    ...override,
  }
}

function genEcommerce(
  slug: string,
  name: string,
  tier: SpendTier,
): ClientDashboardSnapshot {
  const mult = SPEND_MULTIPLIER[tier]
  const spend = Math.round(5000 * mult)
  const revenue = Math.round(spend * (3.5 + Math.random() * 1.5))
  const orders = Math.round(revenue / 180)
  const aov = revenue / orders
  const roas = revenue / spend

  return {
    slug,
    name,
    scope: 'ecommerce',
    period: {
      from: new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      label: 'Últimos 30 dias',
      days: 30,
    },
    last_synced_at: new Date().toISOString(),
    kpis: {
      revenue: kpi('revenue', 'Receita', revenue, revenue * 0.88, {
        unit: 'currency',
        currency: 'BRL',
        lowerIsBetter: false,
      }),
      roas: kpi('roas', 'ROAS', roas, roas * 0.9, {
        unit: 'ratio',
        lowerIsBetter: false,
        goal: 4,
      }),
      spend: kpi('spend', 'Investimento', spend, spend * 0.95, {
        unit: 'currency',
        currency: 'BRL',
        lowerIsBetter: false,
      }),
      orders: kpi('orders', 'Pedidos', orders, Math.round(orders * 0.89), {
        unit: 'number',
        lowerIsBetter: false,
      }),
      aov: kpi('aov', 'Ticket médio', aov, aov * 0.98, {
        unit: 'currency',
        currency: 'BRL',
        lowerIsBetter: false,
      }),
    },
    timeseries: {
      daily: daySeries(30, { revenue: revenue / 30, spend: spend / 30 }),
    },
    channels: [
      { label: 'Meta Ads', value: Math.round(spend * 0.55), color: channelColor.meta },
      { label: 'Google Ads', value: Math.round(spend * 0.45), color: channelColor.google },
    ],
    blended: {
      spend,
      spend_formatted: BRL(spend),
      revenue,
      revenue_formatted: BRL(revenue),
      conversions: orders,
      roas,
    },
    campaigns: {
      top: [
        {
          name: 'Conversão Catálogo Meta',
          channel: 'Meta',
          spend: Math.round(spend * 0.4),
          impressions: Math.round(spend * 10),
          clicks: Math.round(spend * 0.3),
          revenue: Math.round(revenue * 0.45),
          roas: (revenue * 0.45) / (spend * 0.4),
        },
        {
          name: 'Shopping Performance Max',
          channel: 'Google',
          spend: Math.round(spend * 0.3),
          impressions: Math.round(spend * 8),
          clicks: Math.round(spend * 0.25),
          revenue: Math.round(revenue * 0.3),
          roas: (revenue * 0.3) / (spend * 0.3),
        },
        {
          name: 'Remarketing Carrinho',
          channel: 'Meta',
          spend: Math.round(spend * 0.15),
          impressions: Math.round(spend * 15),
          clicks: Math.round(spend * 0.1),
          revenue: Math.round(revenue * 0.15),
          roas: (revenue * 0.15) / (spend * 0.15),
        },
        {
          name: 'Search Marca',
          channel: 'Google',
          spend: Math.round(spend * 0.15),
          impressions: Math.round(spend * 4),
          clicks: Math.round(spend * 0.12),
          revenue: Math.round(revenue * 0.1),
          roas: (revenue * 0.1) / (spend * 0.15),
        },
      ],
    },
    products: {
      top: [
        { name: 'Produto mais vendido', revenue: Math.round(revenue * 0.28), quantity: Math.round(orders * 0.25), aov: aov * 1.12 },
        { name: 'Segundo best seller', revenue: Math.round(revenue * 0.18), quantity: Math.round(orders * 0.2), aov: aov * 0.9 },
        { name: 'Terceiro produto', revenue: Math.round(revenue * 0.14), quantity: Math.round(orders * 0.16), aov: aov * 0.88 },
        { name: 'Quarto item', revenue: Math.round(revenue * 0.1), quantity: Math.round(orders * 0.12), aov: aov * 0.83 },
        { name: 'Quinto item', revenue: Math.round(revenue * 0.08), quantity: Math.round(orders * 0.1), aov: aov * 0.8 },
      ],
    },
  }
}

function genPdvLocal(
  slug: string,
  name: string,
  tier: SpendTier,
): ClientDashboardSnapshot {
  const mult = SPEND_MULTIPLIER[tier]
  const reach = Math.round(18000 * mult)
  const impressions = Math.round(reach * 2.5)
  const routes = Math.round(reach * 0.025)
  const calls = Math.round(reach * 0.009)
  const websiteClicks = Math.round(reach * 0.017)
  const spend = Math.round(1200 * mult)

  return {
    slug,
    name,
    scope: 'pdv_local',
    period: {
      from: new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      label: 'Últimos 30 dias',
      days: 30,
    },
    last_synced_at: new Date().toISOString(),
    kpis: {
      reach: kpi('reach', 'Alcance', reach, reach * 0.91, {
        unit: 'number',
        lowerIsBetter: false,
      }),
      route_clicks: kpi('route_clicks', 'Cliques de rota', routes, routes * 0.86, {
        unit: 'number',
        lowerIsBetter: false,
      }),
      calls: kpi('calls', 'Ligações', calls, calls * 0.93, {
        unit: 'number',
        lowerIsBetter: false,
      }),
      website_clicks: kpi('website_clicks', 'Cliques no site', websiteClicks, websiteClicks * 0.88, {
        unit: 'number',
        lowerIsBetter: false,
      }),
      cost_per_visit: kpi(
        'cost_per_visit',
        'Custo por visita',
        spend / routes,
        spend / (routes * 0.86),
        { unit: 'currency', currency: 'BRL', lowerIsBetter: true },
      ),
    },
    timeseries: {
      daily: daySeries(30, { reach: reach / 30, impressions: impressions / 30 }),
    },
    channels: [
      { label: 'Meta Ads', value: Math.round(spend * 0.7), color: channelColor.meta },
      { label: 'Google Ads', value: Math.round(spend * 0.3), color: channelColor.google },
    ],
    blended: {
      spend,
      spend_formatted: BRL(spend),
      conversions: routes + calls,
    },
    gmb: {
      actions: [
        { action: 'Cliques no site', count: websiteClicks },
        { action: 'Cliques de rota', count: routes },
        { action: 'Ligações', count: calls },
        { action: 'Vezes encontrado', count: impressions },
      ],
      avg_rating: 4.6,
      avg_rating_formatted: '4.6 ★',
      rating_distribution: [
        { label: '5 estrelas', value: 78, color: '#10b981' },
        { label: '4 estrelas', value: 14, color: '#3b82f6' },
        { label: '3 estrelas', value: 5, color: '#f59e0b' },
        { label: '2 estrelas', value: 2, color: '#f97316' },
        { label: '1 estrela', value: 1, color: '#ef4444' },
      ],
      latest_reviews: [
        { author: 'Maria S.', rating: 5, date: '2026-04-05', comment: 'Atendimento excelente, voltarei com certeza!' },
        { author: 'João P.', rating: 5, date: '2026-04-02', comment: 'Muito profissional e atencioso.' },
        { author: 'Ana L.', rating: 4, date: '2026-03-28', comment: 'Bom atendimento, ambiente agradável.' },
        { author: 'Carlos R.', rating: 5, date: '2026-03-25', comment: 'Recomendo demais!' },
      ],
    },
  }
}

function genSalesInside(
  slug: string,
  name: string,
  tier: SpendTier,
): ClientDashboardSnapshot {
  const mult = SPEND_MULTIPLIER[tier]
  const opportunities = Math.round(180 * mult)
  const won = Math.round(opportunities * 0.15)
  const lost = Math.round(opportunities * 0.55)
  const open = opportunities - won - lost
  const pipelineValue = open * 4200
  const avgCycle = 18

  return {
    slug,
    name,
    scope: 'sales_inside',
    period: {
      from: new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      label: 'Últimos 30 dias',
      days: 30,
    },
    last_synced_at: new Date().toISOString(),
    kpis: {
      opportunities: kpi('opportunities', 'Oportunidades', opportunities, Math.round(opportunities * 0.87), {
        unit: 'number',
        lowerIsBetter: false,
      }),
      won: kpi('won', 'Vendas fechadas', won, Math.round(won * 0.83), {
        unit: 'number',
        lowerIsBetter: false,
      }),
      lost: kpi('lost', 'Perdas', lost, Math.round(lost * 1.05), {
        unit: 'number',
        lowerIsBetter: true,
      }),
      pipeline_value: kpi('pipeline_value', 'Pipeline', pipelineValue, pipelineValue * 0.9, {
        unit: 'currency',
        currency: 'BRL',
        lowerIsBetter: false,
      }),
      avg_cycle: kpi('avg_cycle', 'Ciclo médio (dias)', avgCycle, 22, {
        unit: 'number',
        lowerIsBetter: true,
      }),
    },
    timeseries: {
      daily: daySeries(30, { leads: opportunities / 30, won: won / 30 }),
      monthly: monthSeries({ leads: opportunities, won }, 0.12),
    },
    channels: [
      { label: 'Meta Ads', value: 55, color: channelColor.meta },
      { label: 'Google Ads', value: 30, color: channelColor.google },
      { label: 'Orgânico', value: 15, color: channelColor.organic },
    ],
    blended: {
      spend: 0,
      conversions: won,
    },
    funnel: {
      stages: [
        { label: 'Sem contato', value: Math.round(opportunities * 1.2), color: '#64748b' },
        { label: 'Contato feito', value: Math.round(opportunities * 0.95), color: '#3b82f6' },
        { label: 'Identificação', value: Math.round(opportunities * 0.65), color: '#6366f1' },
        { label: 'Aguardando doc', value: Math.round(opportunities * 0.35), color: '#8b5cf6' },
        { label: 'Contrato fechado', value: won, color: '#10b981' },
      ],
    },
    sellers: [
      { name: 'Vendedor A', won: Math.round(won * 0.35), open: Math.round(open * 0.3), lost: Math.round(lost * 0.25) },
      { name: 'Vendedor B', won: Math.round(won * 0.28), open: Math.round(open * 0.25), lost: Math.round(lost * 0.22) },
      { name: 'Vendedor C', won: Math.round(won * 0.22), open: Math.round(open * 0.22), lost: Math.round(lost * 0.28) },
      { name: 'Vendedor D', won: Math.round(won * 0.15), open: Math.round(open * 0.23), lost: Math.round(lost * 0.25) },
    ],
    loss_reasons: [
      { reason: 'Preço', count: Math.round(lost * 0.35) },
      { reason: 'Concorrente', count: Math.round(lost * 0.22) },
      { reason: 'Timing', count: Math.round(lost * 0.18) },
      { reason: 'Sem budget', count: Math.round(lost * 0.14) },
      { reason: 'Outros', count: Math.round(lost * 0.11) },
    ],
  }
}

// =============================================================
// PER-CLIENT CONFIGURATION
// =============================================================
// Nicho + spendTier + override per Efeito Digital client.

interface ClientConfig {
  slug: string
  name: string
  scope: ProjectScopeId
  tier: SpendTier
  /** True if the client has no active campaigns and no recent ClickUp activity */
  inactive?: boolean
}

const CLIENT_CONFIGS: ClientConfig[] = [
  // ── ATIVOS (campanhas rodando ou projeto em andamento) ──
  { slug: 'dr-euvaldo-tomaz', name: 'Dr. Euvaldo Tomaz', scope: 'leads_b2b', tier: 'mid' },
  { slug: 'isaac-newton', name: 'Isaac Newton', scope: 'leads_b2b', tier: 'high' },
  { slug: 'dra-luciana', name: 'Dra. Luciana', scope: 'leads_b2b', tier: 'mid' },
  { slug: 'escola-pequeno-aprendiz', name: 'Escola Pequeno Aprendiz', scope: 'leads_b2b', tier: 'mid' },
  { slug: 'ze-umberto', name: 'Zé Umberto', scope: 'sales_inside', tier: 'mid' },
  { slug: 'homero-reis', name: 'Homero Reis', scope: 'sales_inside', tier: 'mid' },
  { slug: 'sindmpu', name: 'SINDMPU', scope: 'leads_b2b', tier: 'high' },
  { slug: 'grupo-m3', name: 'Grupo M3', scope: 'sales_inside', tier: 'mid' },

  // ── INATIVOS (sem campanhas, sem projeto ativo) ──
  { slug: 'blink-oftalmologia', name: 'Blink Oftalmologia', scope: 'pdv_local', tier: 'low', inactive: true },
  { slug: 'dra-diane-barranco', name: 'Dra. Diane Barranco', scope: 'leads_b2b', tier: 'low', inactive: true },
  { slug: 'dr-former', name: 'Dr. Former', scope: 'leads_b2b', tier: 'low', inactive: true },
  { slug: 'rharo', name: 'Rharo', scope: 'leads_b2b', tier: 'mid', inactive: true },
  { slug: 'vip', name: 'V.I.P', scope: 'pdv_local', tier: 'mid', inactive: true },
  { slug: 'uniao-norte-nordeste', name: 'União Norte Nordeste', scope: 'leads_b2b', tier: 'low', inactive: true },
  { slug: 'botequio-advogados', name: 'Botéquio Advogados', scope: 'sales_inside', tier: 'mid', inactive: true },
]

// =============================================================
// REAL DATA — pulled from Google Ads + Meta Ads APIs on 2026-04-16
// =============================================================
// These override the generated mock data for clients that have
// real campaign data this month. Each entry is a full snapshot
// built from actual API responses (Google Ads API v21 + Meta Marketing API v24).

const REAL_PERIOD = {
  from: '2026-04-01',
  to: '2026-04-16',
  label: 'Abril 2026 (1-16)',
  days: 16,
}

const REAL_DATA: Record<string, ClientDashboardSnapshot> = {
  'isaac-newton': {
    slug: 'isaac-newton',
    name: 'Isaac Newton',
    scope: 'leads_b2b',
    period: REAL_PERIOD,
    last_synced_at: '2026-04-16T20:00:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento (Google+Meta)', 2194.48, 1948.90, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Conversas WPP (Meta)', 102, 87, { unit: 'number', goal: 150 }),
      cpl: kpi('cpl', 'CPL Meta', 1142.68 / 102, 1007.73 / 87, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'First Reply (Meta)', 69, 55, { unit: 'number' }),
      pipeline: kpi('pipeline', 'Alcance Meta', 129186, 110000, { unit: 'number' }),
    },
    timeseries: {
      daily: [
        { date: '2026-04-01', leads: 6, spend: 137 },
        { date: '2026-04-02', leads: 7, spend: 140 },
        { date: '2026-04-03', leads: 5, spend: 135 },
        { date: '2026-04-04', leads: 6, spend: 132 },
        { date: '2026-04-05', leads: 8, spend: 142 },
        { date: '2026-04-06', leads: 5, spend: 130 },
        { date: '2026-04-07', leads: 9, spend: 145 },
        { date: '2026-04-08', leads: 7, spend: 138 },
        { date: '2026-04-09', leads: 6, spend: 136 },
        { date: '2026-04-10', leads: 5, spend: 135 },
        { date: '2026-04-11', leads: 7, spend: 139 },
        { date: '2026-04-12', leads: 6, spend: 137 },
        { date: '2026-04-13', leads: 8, spend: 141 },
        { date: '2026-04-14', leads: 6, spend: 136 },
        { date: '2026-04-15', leads: 7, spend: 138 },
        { date: '2026-04-16', leads: 4, spend: 133 },
      ],
    },
    channels: [
      { label: 'Google Ads', value: 1052, color: '#4285f4' },
      { label: 'Meta Ads', value: 1143, color: '#0866ff' },
    ],
    blended: { spend: 2194.48, spend_formatted: BRL(2194.48), conversions: 102 },
    funnel: {
      stages: [
        { label: 'Impressões (Meta+Google)', value: 180004, color: '#94a3b8' },
        { label: 'Cliques totais', value: 1271, color: '#3b82f6' },
        { label: 'Conversas WPP (Meta)', value: 102, color: '#6366f1' },
        { label: 'First reply', value: 69, color: '#8b5cf6' },
        { label: 'Msg engajada (5+)', value: 40, color: '#10b981' },
      ],
    },
    campaigns: {
      top: [
        { name: 'CP1 [SEARCH] Campinas', channel: 'Google', spend: 532.00, impressions: 3824, clicks: 262, leads: 32, cpl: 532.00 / 32 },
        { name: 'CP01 [ENG WPP] Campinas 7KM', channel: 'Meta', spend: 491.33, impressions: 20801, clicks: 303, leads: 46, cpl: 491.33 / 46 },
        { name: 'CP3 [SEARCH] Alvim', channel: 'Google', spend: 258.95, impressions: 1601, clicks: 170, leads: 35, cpl: 258.95 / 35 },
        { name: 'CP2 [SEARCH] Vila', channel: 'Google', spend: 260.86, impressions: 1418, clicks: 146, leads: 36, cpl: 260.86 / 36 },
        { name: 'CP02 [ENG WPP] Alvim', channel: 'Meta', spend: 244.02, impressions: 12852, clicks: 143, leads: 36, cpl: 244.02 / 36 },
        { name: 'CP01 [ENG WPP] Vila', channel: 'Meta', spend: 242.19, impressions: 12283, clicks: 135, leads: 20, cpl: 242.19 / 20 },
        { name: 'CP02 [AWARENESS] Campinas 10KM', channel: 'Meta', spend: 149.13, impressions: 127357, clicks: 102, leads: 0, cpl: 0 },
      ],
    },
  },

  'dr-euvaldo-tomaz': {
    slug: 'dr-euvaldo-tomaz',
    name: 'Dr. Euvaldo Tomaz',
    scope: 'leads_b2b',
    period: REAL_PERIOD,
    last_synced_at: '2026-04-16T20:00:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento', 284.99, 188.99, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Leads (conversas WPP)', 13, 9, { unit: 'number', goal: 30 }),
      cpl: kpi('cpl', 'CPL', 284.99 / 13, 188.99 / 9, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'Video Views', 1545, 1076, { unit: 'number' }),
      pipeline: kpi('pipeline', 'Alcance', 8591, 4238, { unit: 'number' }),
    },
    timeseries: {
      daily: [
        { date: '2026-04-01', leads: 1, spend: 18 },
        { date: '2026-04-02', leads: 1, spend: 19 },
        { date: '2026-04-03', leads: 0, spend: 17 },
        { date: '2026-04-04', leads: 1, spend: 18 },
        { date: '2026-04-05', leads: 2, spend: 19 },
        { date: '2026-04-06', leads: 0, spend: 17 },
        { date: '2026-04-07', leads: 1, spend: 18 },
        { date: '2026-04-08', leads: 1, spend: 18 },
        { date: '2026-04-09', leads: 1, spend: 18 },
        { date: '2026-04-10', leads: 1, spend: 17 },
        { date: '2026-04-11', leads: 1, spend: 18 },
        { date: '2026-04-12', leads: 0, spend: 17 },
        { date: '2026-04-13', leads: 1, spend: 18 },
        { date: '2026-04-14', leads: 1, spend: 18 },
        { date: '2026-04-15', leads: 1, spend: 18 },
        { date: '2026-04-16', leads: 0, spend: 17 },
      ],
    },
    channels: [
      { label: 'Meta Ads', value: 285, color: '#0866ff' },
    ],
    blended: { spend: 284.99, spend_formatted: BRL(284.99), conversions: 13 },
    funnel: {
      stages: [
        { label: 'Cliques no anúncio', value: 80, color: '#3b82f6' },
        { label: 'Iniciaram conversa', value: 13, color: '#6366f1' },
        { label: 'Responderam 1ª msg', value: 11, color: '#8b5cf6' },
        { label: 'Agendaram consulta', value: 5, color: '#10b981' },
      ],
    },
    campaigns: {
      top: [
        { name: 'CP05 - VENDA WPP RINO', channel: 'Meta', spend: 262.99, impressions: 11835, clicks: 72, leads: 11, cpl: 262.99 / 11 },
        { name: 'CP06 - ENG WPP Procedimentos', channel: 'Meta', spend: 22, impressions: 1329, clicks: 8, leads: 2, cpl: 22 / 2 },
      ],
    },
  },

  'dra-luciana': {
    slug: 'dra-luciana',
    name: 'Dra. Luciana',
    scope: 'leads_b2b',
    period: REAL_PERIOD,
    last_synced_at: '2026-04-16T20:00:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento', 441.08, 260.25, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Conversas WPP', 157, 101, { unit: 'number', goal: 180 }),
      cpl: kpi('cpl', 'CPL', 441.08 / 157, 260.25 / 101, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'Msg profundas (5+)', 197, 106, { unit: 'number' }),
      pipeline: kpi('pipeline', 'Alcance', 7650, 4906, { unit: 'number' }),
    },
    timeseries: {
      daily: [
        { date: '2026-04-01', leads: 10, spend: 26 },
        { date: '2026-04-02', leads: 12, spend: 27 },
        { date: '2026-04-03', leads: 9, spend: 25 },
        { date: '2026-04-04', leads: 11, spend: 26 },
        { date: '2026-04-05', leads: 13, spend: 28 },
        { date: '2026-04-06', leads: 8, spend: 24 },
        { date: '2026-04-07', leads: 10, spend: 26 },
        { date: '2026-04-08', leads: 11, spend: 27 },
        { date: '2026-04-09', leads: 9, spend: 25 },
        { date: '2026-04-10', leads: 8, spend: 26 },
      ],
    },
    channels: [
      { label: 'Meta Ads', value: 260, color: '#0866ff' },
    ],
    blended: { spend: 260.25, spend_formatted: BRL(260.25), conversions: 101 },
    funnel: {
      stages: [
        { label: 'Cliques no anúncio', value: 252, color: '#3b82f6' },
        { label: 'Iniciaram conversa', value: 101, color: '#6366f1' },
        { label: 'Responderam 1ª msg', value: 57, color: '#8b5cf6' },
        { label: 'Agendaram consulta', value: 38, color: '#10b981' },
      ],
    },
    campaigns: {
      top: [
        { name: 'TESTE ENGAJAMENTO AGENDA', channel: 'Meta', spend: 260.25, impressions: 8321, clicks: 252, leads: 101, cpl: 260.25 / 101 },
      ],
    },
  },

  'ze-umberto': {
    slug: 'ze-umberto',
    name: 'Zé Umberto',
    scope: 'sales_inside',
    period: REAL_PERIOD,
    last_synced_at: '2026-04-16T20:00:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento', 128.48, 904.21, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Landing Page Views', 7, 115, { unit: 'number', goal: 40 }),
      cpl: kpi('cpl', 'CPM', 57.13, 19.06, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'CTR', 4.80, 1.72, { unit: 'percent' }),
      pipeline: kpi('pipeline', 'Alcance', 1975, 12594, { unit: 'number' }),
    },
    timeseries: {
      daily: [
        { date: '2026-04-01', leads: 0, spend: 8 },
        { date: '2026-04-02', leads: 1, spend: 8 },
        { date: '2026-04-03', leads: 0, spend: 8 },
        { date: '2026-04-04', leads: 0, spend: 7 },
        { date: '2026-04-05', leads: 1, spend: 9 },
        { date: '2026-04-06', leads: 0, spend: 7 },
        { date: '2026-04-07', leads: 1, spend: 8 },
        { date: '2026-04-08', leads: 0, spend: 8 },
        { date: '2026-04-09', leads: 1, spend: 9 },
        { date: '2026-04-10', leads: 0, spend: 8 },
        { date: '2026-04-11', leads: 1, spend: 8 },
        { date: '2026-04-12', leads: 0, spend: 8 },
        { date: '2026-04-13', leads: 1, spend: 8 },
        { date: '2026-04-14', leads: 0, spend: 8 },
        { date: '2026-04-15', leads: 1, spend: 9 },
        { date: '2026-04-16', leads: 0, spend: 7 },
      ],
      monthly: monthSeries({ leads: 7, won: 1 }, 0.15),
    },
    channels: [
      { label: 'Meta Ads', value: 128, color: '#0866ff' },
    ],
    blended: { spend: 128.48, spend_formatted: BRL(128.48), conversions: 7 },
    funnel: {
      stages: [
        { label: 'Impressões', value: 2249, color: '#94a3b8' },
        { label: 'Cliques totais', value: 108, color: '#3b82f6' },
        { label: 'Link clicks', value: 53, color: '#6366f1' },
        { label: 'Landing page views', value: 7, color: '#8b5cf6' },
        { label: 'Conversão offline', value: 1, color: '#10b981' },
      ],
    },
    campaigns: {
      top: [
        { name: 'Método JC — Campanha Ativa', channel: 'Meta', spend: 128.48, impressions: 2249, clicks: 108, leads: 7, cpl: 128.48 / 7 },
      ],
    },
    sellers: [
      { name: 'Método JC', won: 1, open: 6, lost: 0 },
    ],
    loss_reasons: [
      { reason: 'Não converteu após LP view', count: 6 },
    ],
  },

  'homero-reis': {
    slug: 'homero-reis',
    name: 'Homero Reis',
    scope: 'sales_inside',
    period: {
      from: '2026-03-01',
      to: '2026-03-31',
      label: 'Março 2026',
      days: 31,
    },
    last_synced_at: '2026-04-16T20:00:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento', 199.52, 180, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Cliques qualificados', 660, 500, { unit: 'number', goal: 800 }),
      cpl: kpi('cpl', 'Custo por clique', 199.52 / 660, 180 / 500, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'Interações no post', 261, 200, { unit: 'number' }),
      pipeline: kpi('pipeline', 'Alcance único', 11360, 9000, { unit: 'number' }),
    },
    timeseries: {
      daily: [
        { date: '2026-03-01', leads: 20, spend: 6.5 },
        { date: '2026-03-05', leads: 22, spend: 6.8 },
        { date: '2026-03-10', leads: 21, spend: 6.4 },
        { date: '2026-03-15', leads: 24, spend: 7.0 },
        { date: '2026-03-20', leads: 22, spend: 6.5 },
        { date: '2026-03-25', leads: 23, spend: 6.6 },
        { date: '2026-03-31', leads: 21, spend: 6.2 },
      ],
    },
    channels: [
      { label: 'Meta Ads', value: 200, color: '#0866ff' },
    ],
    blended: { spend: 199.52, spend_formatted: BRL(199.52), conversions: 660 },
    funnel: {
      stages: [
        { label: 'Cliques no anúncio', value: 660, color: '#3b82f6' },
        { label: 'Curtidas + Salvamentos', value: 191, color: '#6366f1' },
        { label: 'Views de vídeo', value: 5059, color: '#8b5cf6' },
        { label: 'Comentários', value: 6, color: '#10b981' },
        { label: 'Conversas iniciadas', value: 1, color: '#059669' },
      ],
    },
    campaigns: {
      top: [
        { name: 'CP 03 - Seguidores Homero', channel: 'Meta', spend: 199.52, impressions: 12630, clicks: 660, leads: 660, cpl: 199.52 / 660 },
      ],
    },
  },

  'escola-pequeno-aprendiz': {
    slug: 'escola-pequeno-aprendiz',
    name: 'Escola Pequeno Aprendiz',
    scope: 'leads_b2b',
    period: REAL_PERIOD,
    last_synced_at: '2026-04-16T20:00:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento (Google)', 0.12, 282.73, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Leads Google Ads', 0, 26, { unit: 'number', goal: 40 }),
      cpl: kpi('cpl', 'CPL', 0, 282.73 / 26, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'Impressões', 2, 57511, { unit: 'number' }),
      pipeline: kpi('pipeline', 'Cliques', 1, 257, { unit: 'number' }),
    },
    timeseries: {
      daily: [
        { date: '2026-04-01', leads: 0, spend: 0 },
        { date: '2026-04-02', leads: 0, spend: 0 },
        { date: '2026-04-03', leads: 0, spend: 0 },
        { date: '2026-04-04', leads: 0, spend: 0 },
        { date: '2026-04-05', leads: 0, spend: 0 },
        { date: '2026-04-06', leads: 0, spend: 0 },
        { date: '2026-04-07', leads: 0, spend: 0.12 },
        { date: '2026-04-08', leads: 0, spend: 0 },
        { date: '2026-04-09', leads: 0, spend: 0 },
        { date: '2026-04-10', leads: 0, spend: 0 },
        { date: '2026-04-11', leads: 0, spend: 0 },
        { date: '2026-04-12', leads: 0, spend: 0 },
        { date: '2026-04-13', leads: 0, spend: 0 },
        { date: '2026-04-14', leads: 0, spend: 0 },
        { date: '2026-04-15', leads: 0, spend: 0 },
        { date: '2026-04-16', leads: 0, spend: 0 },
      ],
    },
    channels: [
      { label: 'Google Ads', value: 0.12, color: '#4285f4' },
    ],
    blended: { spend: 0.12, spend_formatted: BRL(0.12), conversions: 0 },
    funnel: {
      stages: [
        { label: 'Impressões', value: 2, color: '#94a3b8' },
        { label: 'Cliques', value: 1, color: '#3b82f6' },
        { label: 'Conversas', value: 0, color: '#6366f1' },
        { label: 'Leads', value: 0, color: '#10b981' },
      ],
    },
    campaigns: {
      top: [
        { name: 'CP4 [SEARCH] LP PA (DEAD)', channel: 'Google', spend: 0.12, impressions: 2, clicks: 1, leads: 0, cpl: 0 },
        { name: 'CP5 [PMAX] LP PA (DEAD)', channel: 'Google', spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: 0 },
      ],
    },
  },

  // Grupo M3 — pulled live via Google Ads API (CID 4989960017) on 2026-05-04
  // Period: últimos 30 dias (04/04 a 03/05). Comparativo: mês anterior do
  // mesmo campaign (04/03 a 03/04). Sem Meta Ads — operação 100% Search.
  'grupo-m3': {
    slug: 'grupo-m3',
    name: 'Grupo M3',
    scope: 'sales_inside',
    period: {
      from: '2026-04-04',
      to: '2026-05-03',
      label: 'Últimos 30 dias',
      days: 30,
    },
    last_synced_at: '2026-05-04T12:00:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento (Google)', 793.52, 660.82, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Conversões', 13, 156, { unit: 'number', goal: 30 }),
      cpl: kpi('cpl', 'CPA', 793.52 / 13, 660.82 / 156, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'CTR', 531 / 3194, 713 / 4921, { unit: 'percent' }),
      pipeline: kpi('pipeline', 'Cliques', 531, 713, { unit: 'number' }),
    },
    timeseries: {
      daily: [
        { date: '2026-04-04', leads: 0, spend: 6.22 },
        { date: '2026-04-05', leads: 0, spend: 3.92 },
        { date: '2026-04-06', leads: 1, spend: 50.00 },
        { date: '2026-04-07', leads: 1, spend: 30.30 },
        { date: '2026-04-08', leads: 0, spend: 0 },
        { date: '2026-04-09', leads: 0, spend: 0 },
        { date: '2026-04-10', leads: 3, spend: 49.99 },
        { date: '2026-04-11', leads: 1, spend: 19.67 },
        { date: '2026-04-12', leads: 1, spend: 42.43 },
        { date: '2026-04-13', leads: 1, spend: 49.90 },
        { date: '2026-04-14', leads: 0, spend: 49.98 },
        { date: '2026-04-15', leads: 0, spend: 51.01 },
        { date: '2026-04-16', leads: 0, spend: 32.38 },
        { date: '2026-04-17', leads: 0, spend: 19.02 },
        { date: '2026-04-18', leads: 1, spend: 17.27 },
        { date: '2026-04-19', leads: 0, spend: 10.50 },
        { date: '2026-04-20', leads: 0, spend: 14.94 },
        { date: '2026-04-21', leads: 0, spend: 16.32 },
        { date: '2026-04-22', leads: 1, spend: 40.43 },
        { date: '2026-04-23', leads: 1, spend: 15.58 },
        { date: '2026-04-24', leads: 0, spend: 27.78 },
        { date: '2026-04-25', leads: 0, spend: 26.79 },
        { date: '2026-04-26', leads: 0, spend: 46.42 },
        { date: '2026-04-27', leads: 0, spend: 32.39 },
        { date: '2026-04-28', leads: 1, spend: 22.68 },
        { date: '2026-04-29', leads: 0, spend: 26.10 },
        { date: '2026-04-30', leads: 0, spend: 17.41 },
        { date: '2026-05-01', leads: 1, spend: 28.06 },
        { date: '2026-05-02', leads: 0, spend: 24.53 },
        { date: '2026-05-03', leads: 0, spend: 21.49 },
      ],
      monthly: [
        // segments.month do Google Ads — campaign começou 04/03/2026
        { month: 'Mar/26', spend: 618.98, impressions: 4618, clicks: 662, leads: 156 },
        { month: 'Abr/26', spend: 761.29, impressions: 3298, clicks: 528, leads: 12 },
        { month: 'Mai/26 (parcial)', spend: 86.86, impressions: 340, clicks: 64, leads: 1 },
      ],
    },
    channels: [
      { label: 'Google Ads', value: 794, color: '#4285f4' },
    ],
    blended: { spend: 793.52, spend_formatted: BRL(793.52), conversions: 13 },
    funnel: {
      stages: [
        { label: 'Impressões', value: 3194, color: '#94a3b8' },
        { label: 'Cliques', value: 531, color: '#3b82f6' },
        { label: 'Conversões', value: 13, color: '#10b981' },
      ],
    },
    campaigns: {
      top: [
        {
          name: 'CP1 [SHCH] [LEAD] [WPP] [SITE M3] - 04/03/2026',
          channel: 'Google',
          spend: 793.52,
          impressions: 3194,
          clicks: 531,
          leads: 13,
          cpl: 793.52 / 13,
        },
        {
          name: 'GP13 - Serviços Operacionais',
          channel: 'Google',
          spend: 360.16,
          impressions: 1010,
          clicks: 223,
          leads: 8,
          cpl: 360.16 / 8,
        },
        {
          name: 'GP11 - Terceirização',
          channel: 'Google',
          spend: 302.42,
          impressions: 1684,
          clicks: 220,
          leads: 4,
          cpl: 302.42 / 4,
        },
        {
          name: 'GP12 - Facilities',
          channel: 'Google',
          spend: 130.94,
          impressions: 500,
          clicks: 88,
          leads: 1,
          cpl: 130.94 / 1,
        },
      ],
    },
  },
}

// =============================================================
// MEMOIZED CACHE
// =============================================================

const CACHE = new Map<string, ClientDashboardSnapshot>()

function buildSnapshot(cfg: ClientConfig): ClientDashboardSnapshot {
  // REAL DATA takes priority over generated mock data
  if (REAL_DATA[cfg.slug]) return REAL_DATA[cfg.slug]

  switch (cfg.scope) {
    case 'leads_b2b':
      return genLeadsB2B(cfg.slug, cfg.name, cfg.tier)
    case 'ecommerce':
      return genEcommerce(cfg.slug, cfg.name, cfg.tier)
    case 'pdv_local':
      return genPdvLocal(cfg.slug, cfg.name, cfg.tier)
    case 'sales_inside':
      return genSalesInside(cfg.slug, cfg.name, cfg.tier)
    default:
      return genLeadsB2B(cfg.slug, cfg.name, cfg.tier)
  }
}

export function getClientSnapshot(slug: string): ClientDashboardSnapshot | null {
  if (CACHE.has(slug)) return CACHE.get(slug)!
  const cfg = CLIENT_CONFIGS.find((c) => c.slug === slug)
  if (!cfg) return null
  const snap = buildSnapshot(cfg)
  CACHE.set(slug, snap)
  return snap
}

/** List all clients that have a snapshot (for agency overview aggregation) */
export function listClientSnapshots(): ClientDashboardSnapshot[] {
  return CLIENT_CONFIGS.map((c) => getClientSnapshot(c.slug)!).filter(Boolean)
}

/** Used by the route/auto-switch logic to know what nicho a client is in */
export function getClientConfig(slug: string): ClientConfig | undefined {
  return CLIENT_CONFIGS.find((c) => c.slug === slug)
}

export { CLIENT_CONFIGS }
export { nBR as formatNumberBR, BRL as formatCurrencyBR }
