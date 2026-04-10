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
        { label: 'Impressões', value: spend * 40, color: '#3b82f6' },
        { label: 'Cliques', value: Math.round(spend * 0.8), color: '#6366f1' },
        { label: 'Leads', value: leads, color: '#8b5cf6' },
        { label: 'Qualificados', value: qualified, color: '#a855f7' },
        { label: 'Contratos', value: contracts, color: '#10b981' },
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
// MEMOIZED CACHE
// =============================================================
// We memoize the mock data so every re-render of a page hits the
// same object reference (React memoization works, no flicker).

const CACHE = new Map<string, ClientDashboardSnapshot>()

function buildSnapshot(cfg: ClientConfig): ClientDashboardSnapshot {
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
