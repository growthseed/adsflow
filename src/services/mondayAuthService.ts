/**
 * ============================================
 * MONDAY AUTH SERVICE — Personal Token JWT
 * ============================================
 * Manages Monday.com integration (ops 360°: workspaces, boards, items).
 *
 * Auth: Personal Token JWT
 *   - User generates token at Monday → Avatar → Developer → My API tokens → v2 Token
 *   - Token is a JWT containing { tid (team_id), uid (user_id), actid (account_id), rgn (region) }
 *   - Header: `Authorization: <token>` (no "Bearer" prefix)
 *
 * API: GraphQL v2 at https://api.monday.com/v2
 * Headers: `API-Version: 2024-10` (latest stable)
 *
 * Rate limit: 10M complexity points per minute.
 * Pagination: use `boards(limit: 500, page: N)` until count < limit.
 */

import supabase, { isSupabaseConfigured } from '@/lib/supabase'

// =====================================================
// CONFIG
// =====================================================

const MONDAY_API_URL = 'https://api.monday.com/v2'
const MONDAY_API_VERSION = '2024-10'

// =====================================================
// TYPES
// =====================================================

export interface MondayConfig {
  id: string
  client_id: string
  user_id: string
  token: string
  account_id: string
  team_id: string
  region: string
  workspaces_whitelist: string[] // se vazio, importa todos
  boards_whitelist: string[] // se vazio, importa todos
  status: 'active' | 'disconnected' | 'error'
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface MondayAccount {
  id: string
  name: string
  slug: string
  plan: { tier: string } | null
}

export interface MondayWorkspace {
  id: string
  name: string
  kind: 'open' | 'closed'
  description: string | null
}

export interface MondayBoard {
  id: string
  name: string
  workspace: { id: string; name: string }
  board_kind: 'public' | 'private' | 'share'
  items_count: number
}

export interface MondayColumn {
  id: string
  title: string
  type: string
  settings_str?: string
}

export interface MondayItem {
  id: string
  name: string
  group?: { id: string; title: string }
  column_values: Array<{
    id: string
    title?: string
    text: string | null
    value: string | null
    type?: string
  }>
}

export interface MondayMe {
  id: string
  name: string
  email: string
  account: MondayAccount
}

// =====================================================
// PARSE JWT (sem verificar assinatura — só pra extrair metadata)
// =====================================================

function parseTokenPayload(token: string): {
  tid?: number
  uid?: number
  actid?: number
  rgn?: string
  iad?: string
  per?: string
} | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // base64url → base64
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

// =====================================================
// API HELPERS
// =====================================================

async function mondayQuery<T = unknown>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const r = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      'API-Version': MONDAY_API_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!r.ok) {
    throw new Error(`Monday API ${r.status}: ${await r.text()}`)
  }
  const json = await r.json()
  if (json.errors) {
    throw new Error(`Monday API errors: ${JSON.stringify(json.errors)}`)
  }
  return json.data as T
}

// =====================================================
// PUBLIC API
// =====================================================

/** Valida o token e retorna o usuário + conta. Erro se inválido. */
export async function validateToken(token: string): Promise<MondayMe> {
  const data = await mondayQuery<{ me: MondayMe }>(
    token,
    'query { me { id name email account { id name slug plan { tier } } } }',
  )
  if (!data?.me?.id) throw new Error('Token inválido — me{} vazio')
  return data.me
}

/** Lista todos os workspaces ativos da conta. */
export async function listWorkspaces(token: string): Promise<MondayWorkspace[]> {
  const data = await mondayQuery<{ workspaces: MondayWorkspace[] }>(
    token,
    'query { workspaces { id name kind description } }',
  )
  return data.workspaces ?? []
}

/** Lista TODOS os boards ativos com paginação automática. */
export async function listAllBoards(token: string): Promise<MondayBoard[]> {
  const all: MondayBoard[] = []
  let page = 1
  let batch: MondayBoard[] = []
  do {
    const data = await mondayQuery<{ boards: MondayBoard[] }>(
      token,
      `query($page: Int!) {
        boards(limit: 500, page: $page, state: active) {
          id name board_kind items_count
          workspace { id name }
        }
      }`,
      { page },
    )
    batch = data.boards ?? []
    all.push(...batch)
    page++
  } while (batch.length === 500)
  return all
}

/** Lê items de um board específico (com paginação interna). */
export async function listBoardItems(
  token: string,
  boardId: string,
  limit = 500,
): Promise<{ board: MondayBoard; columns: MondayColumn[]; items: MondayItem[] }> {
  const data = await mondayQuery<{
    boards: Array<{
      id: string
      name: string
      board_kind: 'public' | 'private' | 'share'
      items_count: number
      workspace: { id: string; name: string }
      columns: MondayColumn[]
      items_page: {
        cursor: string | null
        items: MondayItem[]
      }
    }>
  }>(
    token,
    `query($boardId: [ID!], $limit: Int!) {
      boards(ids: $boardId) {
        id name board_kind items_count
        workspace { id name }
        columns { id title type settings_str }
        items_page(limit: $limit) {
          cursor
          items {
            id name
            group { id title }
            column_values { id text value type }
          }
        }
      }
    }`,
    { boardId, limit },
  )
  const b = data.boards?.[0]
  if (!b) throw new Error(`Board ${boardId} não encontrado`)

  // Paginação adicional se houver cursor
  let allItems = [...(b.items_page?.items ?? [])]
  let cursor = b.items_page?.cursor
  while (cursor) {
    const next = await mondayQuery<{
      next_items_page: { cursor: string | null; items: MondayItem[] }
    }>(
      token,
      `query($cursor: String!, $limit: Int!) {
        next_items_page(cursor: $cursor, limit: $limit) {
          cursor
          items { id name group { id title } column_values { id text value type } }
        }
      }`,
      { cursor, limit },
    )
    allItems = allItems.concat(next.next_items_page?.items ?? [])
    cursor = next.next_items_page?.cursor ?? null
  }

  return {
    board: {
      id: b.id,
      name: b.name,
      workspace: b.workspace,
      board_kind: b.board_kind,
      items_count: b.items_count,
    },
    columns: b.columns,
    items: allItems,
  }
}

// =====================================================
// SUPABASE INTEGRATION
// =====================================================

/** Salva a config do Monday para o client_id no Supabase. */
export async function saveMondayIntegration(
  clientId: string,
  token: string,
  workspacesWhitelist: string[] = [],
  boardsWhitelist: string[] = [],
): Promise<MondayConfig> {
  if (!isSupabaseConfigured) throw new Error('Supabase não configurado')

  const payload = parseTokenPayload(token)
  const me = await validateToken(token)

  const { data, error } = await supabase
    .from('client_integrations')
    .upsert(
      {
        client_id: clientId,
        provider: 'monday',
        config: {
          token,
          account_id: me.account.id,
          team_id: payload?.tid?.toString() ?? null,
          region: payload?.rgn ?? null,
          workspaces_whitelist: workspacesWhitelist,
          boards_whitelist: boardsWhitelist,
          me: {
            id: me.id,
            name: me.name,
            email: me.email,
            account_name: me.account.name,
            account_slug: me.account.slug,
          },
        },
        status: 'active',
        last_sync_at: null,
      },
      { onConflict: 'client_id,provider' },
    )
    .select()
    .single()

  if (error) throw error
  return data as unknown as MondayConfig
}

/** Carrega a config do Monday para um client_id. */
export async function getMondayConfig(clientId: string): Promise<MondayConfig | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('client_integrations')
    .select('*')
    .eq('client_id', clientId)
    .eq('provider', 'monday')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    ...data.config,
    id: data.id,
    client_id: data.client_id,
    user_id: data.user_id,
    status: data.status,
    last_sync_at: data.last_sync_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as MondayConfig
}
