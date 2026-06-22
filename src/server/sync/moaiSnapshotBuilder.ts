/**
 * ============================================
 * MOAI Snapshot Builder — server-side
 * ============================================
 * Lê client_integrations da MOAI (provider IN clint/monday/meta_ads),
 * extrai dados dos três providers, normaliza, agrega e devolve um
 * ClientDashboardSnapshot pronto pra `WidgetRenderer` consumir.
 *
 * Não importa código de browser (sem React, sem import.meta.env).
 * Pode rodar em Vercel function ou cron node.
 * ============================================
 */

import { createClient } from '@supabase/supabase-js'
import { ENV } from './config.js'

// =============================================================
// TYPES
// =============================================================

interface IntegrationRow {
  id: string
  client_id: string
  provider: string
  access_token: string | null
  external_account_id: string | null
  metadata: Record<string, unknown> | null
  status: string
}

interface ClintDeal {
  id: string
  contact_id?: string
  email_contact?: string
  win?: 'true' | 'false' | '' | null
  amount_total?: number
  pipeline_id?: string
  stage_id?: string
  current_phase_name?: string
  created_at?: string
  closed_at?: string | null
  origin?: string
}

interface BuildOptions {
  /** clients.slug pra resolver (ex: 'moai') */
  clientSlug: string
  /** Refresh forçado do cache Monday */
  forceMondaySync?: boolean
}

// =============================================================
// HELPERS
// =============================================================

function supabaseAdmin() {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env não configurada (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  }
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY)
}

async function loadIntegrations(clientId: string): Promise<IntegrationRow[]> {
  const sb = supabaseAdmin()
  const { data, error } = await sb
    .from('client_integrations')
    .select('id, client_id, provider, access_token, external_account_id, metadata, status')
    .eq('client_id', clientId)
    .in('provider', ['clint', 'monday', 'meta_ads'])
    .eq('status', 'active')
  if (error) throw error
  return (data ?? []) as IntegrationRow[]
}

async function resolveClientId(slug: string): Promise<string | null> {
  const sb = supabaseAdmin()
  const { data, error } = await sb.from('clients').select('id, slug').eq('slug', slug).maybeSingle()
  if (error || !data) return null
  return data.id
}

// =============================================================
// CLINT FETCH (simples, REST direto)
// =============================================================

async function fetchClintDeals(token: string, limit = 500): Promise<ClintDeal[]> {
  // Endpoint Clint: /v1/deals (pagination via offset)
  const all: ClintDeal[] = []
  let offset = 0
  let batch: ClintDeal[] = []
  do {
    const r = await fetch(`https://api.clint.digital/v1/deals?limit=${limit}&offset=${offset}`, {
      headers: { 'api-token': token, 'Content-Type': 'application/json' },
    })
    if (!r.ok) {
      console.warn(`[clint] ${r.status}: ${await r.text()}`)
      break
    }
    const json = (await r.json()) as { data?: ClintDeal[]; results?: ClintDeal[] }
    batch = json.data ?? json.results ?? []
    all.push(...batch)
    offset += limit
    if (all.length > 20000) break // safety
  } while (batch.length === limit)
  return all
}

// =============================================================
// MONDAY FETCH (boards-chave MOAI)
// =============================================================

const MOAI_BOARD_KEYWORDS = {
  carteiras: ['carteira'],
  nps: ['nps'],
  conteudo: ['cronograma', 'redes sociais', 'founder', 'calendário', 'calendario'],
  inadimplencia: ['inadimpl', 'churn', 'pagamento'],
  health: ['health score'],
}

async function fetchMondayBoards(token: string): Promise<
  Array<{ id: string; name: string; workspace: { id: string; name: string }; items_count: number }>
> {
  const r = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      'API-Version': '2024-10',
    },
    body: JSON.stringify({
      query: `query { boards(limit: 500, state: active) { id name items_count workspace { id name } } }`,
    }),
  })
  if (!r.ok) throw new Error(`Monday ${r.status}`)
  const json = await r.json()
  return json?.data?.boards ?? []
}

function filterRelevantBoards(
  boards: Array<{ id: string; name: string; items_count: number }>,
): Array<{ id: string; name: string }> {
  const keys = Object.values(MOAI_BOARD_KEYWORDS).flat()
  return boards
    .filter((b) => {
      const n = b.name.toLowerCase()
      if (b.items_count === 0) return false
      if (n.startsWith('subelementos')) return false
      return keys.some((k) => n.includes(k))
    })
    .map((b) => ({ id: b.id, name: b.name }))
}

async function fetchMondayBoardItems(
  token: string,
  boardId: string,
): Promise<{ columns: unknown[]; items: unknown[] }> {
  const r = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      'API-Version': '2024-10',
    },
    body: JSON.stringify({
      query: `query($id: [ID!]) {
        boards(ids: $id) {
          columns { id title type }
          items_page(limit: 500) {
            items {
              id name
              column_values { id text type }
            }
          }
        }
      }`,
      variables: { id: boardId },
    }),
  })
  if (!r.ok) return { columns: [], items: [] }
  const json = await r.json()
  const b = json?.data?.boards?.[0]
  return {
    columns: b?.columns ?? [],
    items: b?.items_page?.items ?? [],
  }
}

async function cacheMondayBoard(
  clientId: string,
  board: { id: string; name: string },
  workspace: { id: string; name: string },
  columns: unknown[],
  items: unknown[],
): Promise<void> {
  const sb = supabaseAdmin()
  await sb.from('monday_boards_snapshot').upsert(
    {
      client_id: clientId,
      workspace_id: workspace.id,
      workspace_name: workspace.name,
      board_id: board.id,
      board_name: board.name,
      items_count: items.length,
      columns,
      items,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: 'client_id,board_id' },
  )
}

// =============================================================
// AGREGAÇÕES — Sales KPIs from Clint
// =============================================================

interface SalesKpis {
  qtd_leads: number
  qtd_vendas: number
  qtd_perdas: number
  qtd_abertos: number
  valor_vendas: number
  ticket_medio: number
  win_rate: number
  tempo_medio_fechamento: number
  deals_emposados_30d: number
}

function aggregateSalesKpis(deals: ClintDeal[]): SalesKpis {
  let won = 0
  let lost = 0
  let openCount = 0
  let revenue = 0
  let totalDays = 0
  let countDays = 0
  let emposados = 0
  const now = Date.now()

  for (const d of deals) {
    if (d.win === 'true') {
      won++
      revenue += Number(d.amount_total ?? 0)
      if (d.created_at && d.closed_at) {
        const days = (new Date(d.closed_at).getTime() - new Date(d.created_at).getTime()) / 86400000
        if (!Number.isNaN(days) && days >= 0) {
          totalDays += days
          countDays++
        }
      }
    } else if (d.win === 'false') {
      lost++
    } else {
      openCount++
      if (d.created_at) {
        const daysSinceCreated = (now - new Date(d.created_at).getTime()) / 86400000
        if (daysSinceCreated > 30) emposados++
      }
    }
  }

  const total = deals.length
  const winRate = total > 0 ? won / total : 0
  const tempoMedio = countDays > 0 ? totalDays / countDays : 0
  const ticket = won > 0 ? revenue / won : 0

  return {
    qtd_leads: total,
    qtd_vendas: won,
    qtd_perdas: lost,
    qtd_abertos: openCount,
    valor_vendas: revenue,
    ticket_medio: ticket,
    win_rate: winRate,
    tempo_medio_fechamento: tempoMedio,
    deals_emposados_30d: emposados,
  }
}

// =============================================================
// MAIN BUILD
// =============================================================

export async function buildMoaiSnapshot(opts: BuildOptions): Promise<{
  ok: boolean
  snapshot?: Record<string, unknown>
  errors?: string[]
  diagnostics: Record<string, unknown>
}> {
  const errors: string[] = []
  const diagnostics: Record<string, unknown> = {
    started_at: new Date().toISOString(),
  }

  // Resolve cliente
  const clientId = await resolveClientId(opts.clientSlug)
  if (!clientId) {
    return {
      ok: false,
      errors: [`client slug '${opts.clientSlug}' não encontrado`],
      diagnostics,
    }
  }
  diagnostics.client_id = clientId

  // Carrega integrations
  const integrations = await loadIntegrations(clientId)
  diagnostics.integrations = integrations.map((i) => ({ provider: i.provider, status: i.status }))

  const clintInt = integrations.find((i) => i.provider === 'clint')
  const mondayInt = integrations.find((i) => i.provider === 'monday')

  // === CLINT ===
  let salesKpis: SalesKpis | null = null
  if (clintInt?.access_token) {
    try {
      const deals = await fetchClintDeals(clintInt.access_token)
      diagnostics.clint_deals_count = deals.length
      salesKpis = aggregateSalesKpis(deals)
      diagnostics.sales_kpis = salesKpis
    } catch (e) {
      errors.push(`clint: ${e instanceof Error ? e.message : String(e)}`)
    }
  } else {
    errors.push('clint: token não configurado em client_integrations')
  }

  // === MONDAY ===
  const mondayBoardsCached: Array<{ board_id: string; board_name: string; items_count: number }> = []
  if (mondayInt?.access_token) {
    try {
      const boards = await fetchMondayBoards(mondayInt.access_token)
      diagnostics.monday_boards_total = boards.length
      const relevant = filterRelevantBoards(boards)
      diagnostics.monday_boards_relevant = relevant.length

      // Limita a 25 boards-chave (rate limit safety)
      const toFetch = relevant.slice(0, 25)
      for (const b of toFetch) {
        try {
          const ws = boards.find((x) => x.id === b.id)?.workspace ?? { id: '?', name: '?' }
          const { columns, items } = await fetchMondayBoardItems(mondayInt.access_token, b.id)
          await cacheMondayBoard(clientId, b, ws, columns, items)
          mondayBoardsCached.push({
            board_id: b.id,
            board_name: b.name,
            items_count: items.length,
          })
        } catch (e) {
          errors.push(`monday board ${b.id}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
      diagnostics.monday_cached = mondayBoardsCached.length
    } catch (e) {
      errors.push(`monday: ${e instanceof Error ? e.message : String(e)}`)
    }
  } else {
    errors.push('monday: token não configurado em client_integrations')
  }

  // === SNAPSHOT FINAL ===
  // Estrutura mínima preenchendo KPIs com dados reais + estrutura mock pros widgets que ainda não temos query
  const snapshot = {
    slug: opts.clientSlug,
    name: 'MOAI · Clube de Líderes',
    scope: 'leads_b2b' as const,
    period: {
      from: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      label: 'Mês atual',
      days: 30,
    },
    last_synced_at: new Date().toISOString(),
    kpis: salesKpis ? buildSnapshotKpis(salesKpis) : {},
    // Estruturas downstream — virão das views SQL nas próximas iterações
    diagnostics,
  }

  diagnostics.finished_at = new Date().toISOString()
  return { ok: errors.length === 0, snapshot, errors, diagnostics }
}

function buildSnapshotKpis(s: SalesKpis) {
  const fmt = (k: string, label: string, value: number, unit: 'number' | 'currency' | 'percent', dir: 'higher_better' | 'lower_better' = 'higher_better') => ({
    [k]: {
      key: k,
      label,
      value,
      previous_value: value,
      delta_percent: 0,
      trend: 'flat',
      unit,
      currency: unit === 'currency' ? 'BRL' : undefined,
      improvement_direction: dir,
    },
  })
  return {
    ...fmt('qtd_leads', 'Qtd Leads', s.qtd_leads, 'number'),
    ...fmt('qtd_vendas', 'Vendas', s.qtd_vendas, 'number'),
    ...fmt('win_rate', 'Win Rate', s.win_rate, 'percent'),
    ...fmt('ticket_medio', 'Ticket médio', s.ticket_medio, 'currency'),
    ...fmt('pipeline_open', 'Pipeline OPEN', s.qtd_abertos, 'number'),
    ...fmt('deals_emposados', 'Empoçados +30d', s.deals_emposados_30d, 'number', 'lower_better'),
    ...fmt('tempo_medio_fechamento', 'Tempo médio (d)', s.tempo_medio_fechamento, 'number', 'lower_better'),
    ...fmt('receita_mes', 'Receita do mês', s.valor_vendas, 'currency'),
  }
}
