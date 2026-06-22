/**
 * ============================================
 * SYNC — Shared config, clients map, auth helpers
 * ============================================
 * Reused by /api/sync/clickup, /api/sync/performance,
 * /api/sync/agency. All server-side only (imports process.env).
 * ============================================
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

// =============================================================
// ENV — fail fast if anything critical is missing
// =============================================================

export const ENV = {
  // Cron auth
  CRON_SECRET: process.env.CRON_SECRET || '',

  // Supabase
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Meta Ads
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
  META_API_VERSION: process.env.VITE_META_API_VERSION || 'v23.0',

  // Google Ads — DEVELOPER_TOKEN is shared; sync uses a DESKTOP OAuth client
  // (different from the Web client in GOOGLE_ADS_CLIENT_ID used by the frontend
  // proxy at /api/google-ads). Refresh tokens are tied to the client that
  // generated them, so sync has its own triplet.
  GOOGLE_ADS_DEVELOPER_TOKEN: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
  GOOGLE_ADS_SYNC_CLIENT_ID: process.env.GOOGLE_ADS_SYNC_CLIENT_ID || '',
  GOOGLE_ADS_SYNC_CLIENT_SECRET: process.env.GOOGLE_ADS_SYNC_CLIENT_SECRET || '',
  GOOGLE_ADS_SYNC_REFRESH_TOKEN: process.env.GOOGLE_ADS_SYNC_REFRESH_TOKEN || '',
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '1011817676',
  GOOGLE_ADS_API_VERSION: process.env.GOOGLE_ADS_API_VERSION || 'v21',

  // ClickUp
  CLICKUP_API_TOKEN: process.env.CLICKUP_API_TOKEN || '',
  CLICKUP_OPERATIONS_SPACE_ID: process.env.CLICKUP_OPERATIONS_SPACE_ID || '90113696605',
} as const

// =============================================================
// AUTH — validate cron bearer or admin token
// =============================================================

/**
 * Validates that the request has a valid CRON_SECRET bearer.
 * Vercel crons auto-inject `Authorization: Bearer <CRON_SECRET>`.
 * Returns true if authorized, sends 401 response if not.
 */
export function requireCronAuth(req: VercelRequest, res: VercelResponse): boolean {
  const header = req.headers['authorization'] || ''
  const expected = `Bearer ${ENV.CRON_SECRET}`

  if (!ENV.CRON_SECRET) {
    res.status(500).json({ error: 'CRON_SECRET not configured' })
    return false
  }

  if (header !== expected) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }

  return true
}

// =============================================================
// CLIENT MAP
// =============================================================
// Historically this was a hardcoded AGENCY_CLIENTS array. The audit of
// 2026-04-09 flagged that as an anti-pattern for a multi-tenant platform
// (every new client needed a code deploy; impossible to sell to other
// agencies). As of migration 019 the source of truth is Supabase:
//
//   public.clients                — agency clients (slug, name, industry, ...)
//   public.client_integrations    — per-client provider accounts
//                                    (clickup folder, meta account, google CID)
//
// `loadAgencyClients()` below fetches and joins these two tables using the
// service role key and returns the same `AgencyClientMap` shape the cron
// fetchers expect. The hardcoded `AGENCY_CLIENTS` const is still exported as
// a last-resort fallback if Supabase is unreachable, but it's marked
// deprecated and should be removed once `loadAgencyClients` is proven stable
// in production.
// =============================================================

export interface AgencyClientMap {
  slug: string
  name: string
  short_name: string
  clickup_folder_id: string
  clickup_folder_name: string
  avatar_gradient: string
  industry?: string
  city?: string
  meta_account_id?: string
  google_ads_customer_id?: string
}

/**
 * Load the agency client map from Supabase. Falls back to the hardcoded
 * `AGENCY_CLIENTS` array if the DB is unreachable or returns zero rows
 * (so the cron keeps working during an outage).
 */
export async function loadAgencyClients(): Promise<AgencyClientMap[]> {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[loadAgencyClients] Supabase not configured — using hardcoded fallback')
    return AGENCY_CLIENTS
  }

  try {
    // 1. Pull all active clients
    const clientsUrl = `${ENV.SUPABASE_URL}/rest/v1/clients?status=eq.active&select=id,slug,name,industry`
    const clientsRes = await fetch(clientsUrl, {
      headers: {
        apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    })
    if (!clientsRes.ok) throw new Error(`clients fetch ${clientsRes.status}`)
    const clientsRows = (await clientsRes.json()) as Array<{
      id: string
      slug: string
      name: string
      industry: string | null
    }>

    if (clientsRows.length === 0) {
      console.warn('[loadAgencyClients] clients table empty — using hardcoded fallback')
      return AGENCY_CLIENTS
    }

    // 2. Pull all active integrations
    const integUrl = `${ENV.SUPABASE_URL}/rest/v1/client_integrations?status=eq.active&select=client_id,provider,external_account_id,external_account_name`
    const integRes = await fetch(integUrl, {
      headers: {
        apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    })
    if (!integRes.ok) throw new Error(`integrations fetch ${integRes.status}`)
    const integRows = (await integRes.json()) as Array<{
      client_id: string
      provider: string
      external_account_id: string
      external_account_name: string | null
    }>

    // 3. Index integrations by client_id → provider
    const byClient = new Map<string, Record<string, { id: string; name: string | null }>>()
    for (const row of integRows) {
      const bag = byClient.get(row.client_id) || {}
      bag[row.provider] = { id: row.external_account_id, name: row.external_account_name }
      byClient.set(row.client_id, bag)
    }

    // 4. Stitch together the AgencyClientMap shape the fetchers expect.
    // short_name / avatar_gradient / city are cosmetic fields only used by
    // the UI side of the snapshot — default them sensibly.
    return clientsRows.map((c): AgencyClientMap => {
      const intg = byClient.get(c.id) || {}
      const clickup = intg['clickup']
      const meta = intg['meta_ads']
      const google = intg['google_ads']

      return {
        slug: c.slug,
        name: c.name,
        short_name: c.name
          .split(/\s+/)
          .map((w) => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        clickup_folder_id: clickup?.id || '',
        clickup_folder_name: clickup?.name || '',
        avatar_gradient: 'from-slate-500 to-neutral-700',
        industry: c.industry ?? undefined,
        meta_account_id: meta?.id,
        google_ads_customer_id: google?.id,
      }
    })
  } catch (err) {
    console.error('[loadAgencyClients] fetch failed, using hardcoded fallback:', err)
    return AGENCY_CLIENTS
  }
}

/**
 * @deprecated Use `await loadAgencyClients()` instead. This hardcoded array
 * is kept as an emergency fallback for when Supabase is unreachable. New
 * clients should be inserted into `public.clients` + `public.client_integrations`
 * via the admin UI, not added here.
 */
export const AGENCY_CLIENTS: AgencyClientMap[] = [
  {
    slug: 'dr-euvaldo-tomaz',
    name: 'Dr. Euvaldo Tomaz',
    short_name: 'DE',
    clickup_folder_id: '90116051679',
    clickup_folder_name: 'CL01 - Dr. Euvaldo Tomaz',
    avatar_gradient: 'from-blue-500 to-cyan-600',
    industry: 'Saúde / Oftalmologia',
    city: 'Macapá, AP',
    meta_account_id: 'act_2413246135708611',
  },
  {
    slug: 'isaac-newton',
    name: 'Isaac Newton',
    short_name: 'IN',
    clickup_folder_id: '90115986444',
    clickup_folder_name: 'CL 02 - Isaac Newton',
    avatar_gradient: 'from-indigo-500 to-purple-600',
    industry: 'Educação',
    city: 'Macapá, AP',
    meta_account_id: 'act_3482049598727995',
  },
  {
    slug: 'dra-luciana',
    name: 'Dra. Luciana',
    short_name: 'DL',
    clickup_folder_id: '90116151000',
    clickup_folder_name: 'CL03 - Dra. Luciana (B+ e Fature+)',
    avatar_gradient: 'from-pink-500 to-rose-600',
    industry: 'Saúde / Dermatologia',
    city: 'Macapá, AP',
    meta_account_id: 'act_726604442982185',
  },
  {
    slug: 'sindmpu',
    name: 'SINDMPU',
    short_name: 'SI',
    clickup_folder_id: '90116940873',
    clickup_folder_name: 'CL04 - SINDMPU',
    avatar_gradient: 'from-emerald-500 to-teal-600',
    industry: 'Sindicato / Associação',
    city: 'Brasília, DF',
    meta_account_id: 'act_1577594032862758',
  },
  {
    slug: 'blink-oftalmologia',
    name: 'Blink Oftalmologia',
    short_name: 'BL',
    clickup_folder_id: '90116051703',
    clickup_folder_name: 'CL10 - Blink Oftalmologia',
    avatar_gradient: 'from-sky-500 to-blue-600',
    industry: 'Saúde / Oftalmologia',
    city: 'Brasília, DF',
    google_ads_customer_id: '2699618496',
  },
  {
    slug: 'escola-pequeno-aprendiz',
    name: 'Escola Pequeno Aprendiz',
    short_name: 'PA',
    clickup_folder_id: '90117036530',
    clickup_folder_name: 'CL12 - Pequeno Aprendiz',
    avatar_gradient: 'from-amber-500 to-orange-600',
    industry: 'Educação Infantil',
    city: 'Macapá, AP',
    meta_account_id: 'act_665886981393269',
    google_ads_customer_id: '2302878546',
  },
  {
    slug: 'dra-diane-barranco',
    name: 'Dra. Diane Barranco',
    short_name: 'DB',
    clickup_folder_id: '90117061437',
    clickup_folder_name: 'CL12 - Dra Diane Barranco',
    avatar_gradient: 'from-fuchsia-500 to-pink-600',
    industry: 'Saúde',
    city: 'Macapá, AP',
    meta_account_id: 'act_554015346419436',
  },
  {
    slug: 'dr-former',
    name: 'Dr. Former',
    short_name: 'DF',
    clickup_folder_id: '90117643529',
    clickup_folder_name: 'CL12 - Dr. Former',
    avatar_gradient: 'from-red-500 to-orange-600',
    industry: 'Saúde',
    city: 'Macapá, AP',
  },
  {
    slug: 'homero-reis',
    name: 'Homero Reis',
    short_name: 'HR',
    clickup_folder_id: '90117134048',
    clickup_folder_name: 'CL16 - Homero Reis',
    avatar_gradient: 'from-violet-500 to-purple-600',
    industry: 'Coaching / Consultoria',
    city: 'Brasília, DF',
    meta_account_id: 'act_720926888081448',
  },
  {
    slug: 'grupo-m3',
    name: 'Grupo M3',
    short_name: 'M3',
    clickup_folder_id: '90117264469',
    clickup_folder_name: 'CL17 - Grupo M3',
    avatar_gradient: 'from-slate-600 to-gray-800',
    industry: 'Facilities / Terceirização B2B',
    city: 'Brasília, DF',
    google_ads_customer_id: '4989960017',
  },
  {
    slug: 'rharo',
    name: 'Rharo',
    short_name: 'RH',
    clickup_folder_id: '90117344470',
    clickup_folder_name: 'CL18 - Rharo',
    avatar_gradient: 'from-cyan-500 to-blue-600',
    industry: 'Eventos / Podcast',
    city: 'Brasília, DF',
    meta_account_id: 'act_699397972116933',
  },
  {
    slug: 'vip',
    name: 'V.I.P',
    short_name: 'VI',
    clickup_folder_id: '90117471958',
    clickup_folder_name: 'CL19 - V.I.P',
    avatar_gradient: 'from-yellow-500 to-amber-600',
    industry: 'Serviços',
    city: 'Macapá, AP',
    meta_account_id: 'act_2794306287585741',
  },
  {
    slug: 'uniao-norte-nordeste',
    name: 'União Norte Nordeste',
    short_name: 'UN',
    clickup_folder_id: '90117578724',
    clickup_folder_name: 'CL22 - União Norte Nordeste',
    avatar_gradient: 'from-blue-600 to-indigo-700',
    industry: 'Igreja / Associação',
    city: 'Belém, PA',
  },
  {
    slug: 'ze-umberto',
    name: 'Zé Umberto',
    short_name: 'ZU',
    clickup_folder_id: '90117591305',
    clickup_folder_name: 'CL23 - Zé Umberto',
    avatar_gradient: 'from-green-500 to-emerald-600',
    industry: 'Alimentação',
    city: 'Macapá, AP',
  },
  {
    slug: 'botequio-advogados',
    name: 'Botéquio Advogados',
    short_name: 'BA',
    clickup_folder_id: '90117779770',
    clickup_folder_name: 'CL24 - Botéquio Advogados',
    avatar_gradient: 'from-stone-600 to-neutral-800',
    industry: 'Advocacia',
    city: 'Brasília, DF',
    meta_account_id: 'act_938822304907712',
  },
]

// =============================================================
// SUPABASE WRITE helper (service role, bypasses RLS)
// =============================================================

export interface SnapshotInsert {
  kind: 'clickup' | 'performance' | 'combined' | 'moai'
  period_from?: string
  period_to?: string
  data: unknown
  sync_status?: 'ok' | 'partial' | 'failed'
  error_log?: string
  duration_ms?: number
}

export async function insertSnapshot(payload: SnapshotInsert): Promise<{
  ok: boolean
  id?: string
  error?: string
}> {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: 'Supabase not configured (URL or SERVICE_ROLE_KEY missing)' }
  }

  const url = `${ENV.SUPABASE_URL}/rest/v1/agency_snapshots`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      kind: payload.kind,
      period_from: payload.period_from || null,
      period_to: payload.period_to || null,
      data: payload.data,
      sync_status: payload.sync_status || 'ok',
      error_log: payload.error_log || null,
      duration_ms: payload.duration_ms || null,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error')
    return { ok: false, error: `Supabase insert failed (${response.status}): ${text}` }
  }

  const rows = (await response.json()) as Array<{ id: string }>
  return { ok: true, id: rows[0]?.id }
}

// =============================================================
// CORS + method helpers
// =============================================================

/**
 * Sync endpoints are cron-only (auth via CRON_SECRET bearer). They do not need
 * CORS at all — they're never called from a browser. Setting `Access-Control-
 * Allow-Origin: *` here was a leftover from when these were callable from the
 * frontend, and the audit flagged it as an open proxy surface. Now we only
 * emit a no-store cache header.
 */
export function setCommonHeaders(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  // Intentionally no Access-Control-Allow-* — these endpoints are server-to-
  // server (Vercel cron → our function) and should never satisfy a browser
  // preflight. If a new origin legitimately needs one of these, add it to the
  // per-route handler via api/_lib/security.ts `applyCors`.
}
