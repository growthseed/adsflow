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
}

const CLIENT_CONFIGS: ClientConfig[] = [
  { slug: 'dr-euvaldo-tomaz', name: 'Dr. Euvaldo Tomaz', scope: 'leads_b2b', tier: 'mid' },
  { slug: 'isaac-newton', name: 'Isaac Newton', scope: 'leads_b2b', tier: 'high' },
  { slug: 'dra-luciana', name: 'Dra. Luciana', scope: 'leads_b2b', tier: 'mid' },
  { slug: 'sindmpu', name: 'SINDMPU', scope: 'leads_b2b', tier: 'high' },
  { slug: 'blink-oftalmologia', name: 'Blink Oftalmologia', scope: 'pdv_local', tier: 'low' },
  { slug: 'escola-pequeno-aprendiz', name: 'Escola Pequeno Aprendiz', scope: 'leads_b2b', tier: 'mid' },
  { slug: 'dra-diane-barranco', name: 'Dra. Diane Barranco', scope: 'leads_b2b', tier: 'low' },
  { slug: 'dr-former', name: 'Dr. Former', scope: 'leads_b2b', tier: 'low' },
  { slug: 'homero-reis', name: 'Homero Reis', scope: 'sales_inside', tier: 'mid' },
  { slug: 'grupo-m3', name: 'Grupo M3', scope: 'sales_inside', tier: 'high' },
  { slug: 'rharo', name: 'Rharo', scope: 'leads_b2b', tier: 'mid' },
  { slug: 'vip', name: 'V.I.P', scope: 'pdv_local', tier: 'mid' },
  { slug: 'uniao-norte-nordeste', name: 'União Norte Nordeste', scope: 'leads_b2b', tier: 'low' },
  { slug: 'ze-umberto', name: 'Zé Umberto', scope: 'pdv_local', tier: 'low' },
  { slug: 'botequio-advogados', name: 'Botéquio Advogados', scope: 'sales_inside', tier: 'mid' },
]

// =============================================================
// REAL DATA — pulled from Meta Ads MCP on 2026-04-10
// =============================================================
// These override the generated mock data for clients that have
// real campaign data this month. Each entry is a full snapshot
// built from actual API responses.

const REAL_PERIOD = {
  from: '2026-04-01',
  to: '2026-04-10',
  label: 'Abril 2026 (1-10)',
  days: 10,
}

const REAL_DATA: Record<string, ClientDashboardSnapshot> = {
  'isaac-newton': {
    slug: 'isaac-newton',
    name: 'Isaac Newton',
    scope: 'leads_b2b',
    period: REAL_PERIOD,
    last_synced_at: '2026-04-10T14:30:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento', 284.16, 260, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Leads (conversas WPP)', 32, 28, { unit: 'number', goal: 50 }),
      cpl: kpi('cpl', 'CPL', 284.16 / 32, 260 / 28, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'CTR', 0.0096, 0.0088, { unit: 'percent' }),
      pipeline: kpi('pipeline', 'Alcance', 10055, 9200, { unit: 'number' }),
    },
    timeseries: {
      daily: [
        { date: '2026-04-01', leads: 3, spend: 28 },
        { date: '2026-04-02', leads: 4, spend: 29 },
        { date: '2026-04-03', leads: 3, spend: 27 },
        { date: '2026-04-04', leads: 2, spend: 26 },
        { date: '2026-04-05', leads: 4, spend: 30 },
        { date: '2026-04-06', leads: 3, spend: 28 },
        { date: '2026-04-07', leads: 5, spend: 31 },
        { date: '2026-04-08', leads: 3, spend: 29 },
        { date: '2026-04-09', leads: 3, spend: 28 },
        { date: '2026-04-10', leads: 2, spend: 28 },
      ],
    },
    channels: [
      { label: 'Meta Ads', value: 284, color: '#0866ff' },
    ],
    blended: { spend: 284.16, spend_formatted: BRL(284.16), conversions: 32 },
    funnel: {
      stages: [
        { label: 'Cliques no anúncio', value: 166, color: '#3b82f6' },
        { label: 'Iniciaram conversa', value: 32, color: '#6366f1' },
        { label: 'Responderam 1ª msg', value: 24, color: '#8b5cf6' },
        { label: 'Conversa engajada (3+)', value: 5, color: '#10b981' },
      ],
    },
    campaigns: {
      top: [
        { name: 'CP02 - ENG WPP ALVIM', channel: 'Meta', spend: 142.81, impressions: 8501, clicks: 89, leads: 18, cpl: 142.81 / 18 },
        { name: 'CP01 - ENG WPP VILA', channel: 'Meta', spend: 141.35, impressions: 8837, clicks: 77, leads: 14, cpl: 141.35 / 14 },
      ],
    },
  },

  'dr-euvaldo-tomaz': {
    slug: 'dr-euvaldo-tomaz',
    name: 'Dr. Euvaldo Tomaz',
    scope: 'leads_b2b',
    period: REAL_PERIOD,
    last_synced_at: '2026-04-10T14:30:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento', 188.99, 170, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Leads (conversas WPP)', 9, 7, { unit: 'number', goal: 20 }),
      cpl: kpi('cpl', 'CPL', 188.99 / 9, 170 / 7, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'Video Views', 1076, 900, { unit: 'number' }),
      pipeline: kpi('pipeline', 'Alcance', 4238, 3800, { unit: 'number' }),
    },
    timeseries: {
      daily: [
        { date: '2026-04-01', leads: 1, spend: 19 },
        { date: '2026-04-02', leads: 1, spend: 20 },
        { date: '2026-04-03', leads: 0, spend: 18 },
        { date: '2026-04-04', leads: 1, spend: 19 },
        { date: '2026-04-05', leads: 2, spend: 20 },
        { date: '2026-04-06', leads: 0, spend: 18 },
        { date: '2026-04-07', leads: 1, spend: 19 },
        { date: '2026-04-08', leads: 1, spend: 19 },
        { date: '2026-04-09', leads: 1, spend: 19 },
        { date: '2026-04-10', leads: 1, spend: 18 },
      ],
    },
    channels: [
      { label: 'Meta Ads', value: 189, color: '#0866ff' },
    ],
    blended: { spend: 188.99, spend_formatted: BRL(188.99), conversions: 9 },
    funnel: {
      stages: [
        { label: 'Cliques no anúncio', value: 53, color: '#3b82f6' },
        { label: 'Iniciaram conversa', value: 9, color: '#6366f1' },
        { label: 'Responderam 1ª msg', value: 8, color: '#8b5cf6' },
        { label: 'Agendaram consulta', value: 4, color: '#10b981' },
      ],
    },
    campaigns: {
      top: [
        { name: 'CP05 - VENDA WPP RINO', channel: 'Meta', spend: 166.99, impressions: 5424, clicks: 45, leads: 7, cpl: 166.99 / 7 },
        { name: 'CP06 - ENG WPP Procedimentos', channel: 'Meta', spend: 22, impressions: 1329, clicks: 8, leads: 2, cpl: 22 / 2 },
      ],
    },
  },

  'dra-luciana': {
    slug: 'dra-luciana',
    name: 'Dra. Luciana',
    scope: 'leads_b2b',
    period: REAL_PERIOD,
    last_synced_at: '2026-04-10T14:30:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento', 260.25, 240, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Leads (conversas WPP)', 101, 85, { unit: 'number', goal: 120 }),
      cpl: kpi('cpl', 'CPL', 260.25 / 101, 240 / 85, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'Msg profundas (5+)', 106, 80, { unit: 'number' }),
      pipeline: kpi('pipeline', 'Alcance', 4906, 4200, { unit: 'number' }),
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

  'escola-pequeno-aprendiz': {
    slug: 'escola-pequeno-aprendiz',
    name: 'Escola Pequeno Aprendiz',
    scope: 'leads_b2b',
    period: REAL_PERIOD,
    last_synced_at: '2026-04-10T14:30:00Z',
    kpis: {
      spend: kpi('spend', 'Investimento', 282.73, 250, { unit: 'currency', currency: 'BRL' }),
      leads: kpi('leads', 'Leads (conversas WPP)', 26, 20, { unit: 'number', goal: 40 }),
      cpl: kpi('cpl', 'CPL', 282.73 / 26, 250 / 20, { unit: 'currency', currency: 'BRL', lowerIsBetter: true }),
      qualified_rate: kpi('qualified_rate', 'Video Views', 2405, 2000, { unit: 'number' }),
      pipeline: kpi('pipeline', 'Alcance', 57511, 48000, { unit: 'number' }),
    },
    timeseries: {
      daily: [
        { date: '2026-04-01', leads: 3, spend: 28 },
        { date: '2026-04-02', leads: 2, spend: 27 },
        { date: '2026-04-03', leads: 3, spend: 29 },
        { date: '2026-04-04', leads: 2, spend: 27 },
        { date: '2026-04-05', leads: 4, spend: 30 },
        { date: '2026-04-06', leads: 2, spend: 27 },
        { date: '2026-04-07', leads: 3, spend: 29 },
        { date: '2026-04-08', leads: 3, spend: 29 },
        { date: '2026-04-09', leads: 2, spend: 28 },
        { date: '2026-04-10', leads: 2, spend: 28 },
      ],
    },
    channels: [
      { label: 'Meta Ads', value: 283, color: '#0866ff' },
    ],
    blended: { spend: 282.73, spend_formatted: BRL(282.73), conversions: 26 },
    funnel: {
      stages: [
        { label: 'Cliques no anúncio', value: 257, color: '#3b82f6' },
        { label: 'Iniciaram conversa', value: 26, color: '#6366f1' },
        { label: 'Responderam 1ª msg', value: 18, color: '#8b5cf6' },
        { label: 'Agendaram visita', value: 8, color: '#10b981' },
      ],
    },
    campaigns: {
      top: [
        { name: 'CP05 - ENG WPP MATRÍCULAS 2026', channel: 'Meta', spend: 229.55, impressions: 22010, clicks: 201, leads: 22, cpl: 229.55 / 22 },
        { name: 'CP10 - ALCANCE MATRÍCULAS', channel: 'Meta', spend: 53.18, impressions: 49143, clicks: 56, leads: 4, cpl: 53.18 / 4 },
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
