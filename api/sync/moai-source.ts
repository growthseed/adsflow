import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type SourceName = 'clint' | 'monday' | 'meta_ads' | 'google_ads' | 'maia'

type SyncJob = {
  run_id: string
  client_slug?: string
  mode?: 'full' | 'partial' | 'manual'
  reason?: string
  requested_at?: string
  source: SourceName
  priority?: number
  scope?: string[]
  range?: { since?: string; until?: string }
  ad_account_id?: string
  customer_id?: string | null
}

type SyncResult = {
  ok: boolean
  source: SourceName
  run_id: string
  rows_raw: number
  rows_staged: number
  rows_mart: number
  warnings: string[]
  error?: string | null
  job: SyncJob
}

const CLINT_ENDPOINTS: Record<string, string> = {
  deals: '/v1/deals',
  contacts: '/v1/contacts',
  groups: '/v1/groups',
  origins: '/v1/origins',
  users: '/v1/users',
  tags: '/v1/tags',
  account_fields: '/v1/account/fields',
}

function applyHeaders(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
}

function requireSyncAuth(req: VercelRequest, res: VercelResponse): boolean {
  const header = String(req.headers.authorization || '')
  const allowed = [process.env.MOAI_SYNC_SECRET, process.env.CRON_SECRET]
    .filter(Boolean)
    .map((secret) => `Bearer ${secret}`)

  if (allowed.length === 0) {
    res.status(500).json({ ok: false, error: 'MOAI_SYNC_SECRET or CRON_SECRET not configured' })
    return false
  }

  if (!allowed.includes(header)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return false
  }

  return true
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Supabase env missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

function normalizeJob(body: unknown): SyncJob {
  const job = body as Partial<SyncJob>
  if (!job.run_id) throw new Error('run_id is required')
  if (!job.source) throw new Error('source is required')
  if (!['clint', 'monday', 'meta_ads', 'google_ads', 'maia'].includes(job.source)) {
    throw new Error(`Unsupported source: ${job.source}`)
  }
  return {
    run_id: job.run_id,
    client_slug: job.client_slug || 'moai',
    mode: job.mode || 'manual',
    reason: job.reason,
    requested_at: job.requested_at,
    source: job.source,
    priority: job.priority,
    scope: Array.isArray(job.scope) ? job.scope : [],
    range: job.range || {},
    ad_account_id: job.ad_account_id,
    customer_id: job.customer_id,
  }
}

async function ensureRun(sb: SupabaseClient, job: SyncJob) {
  const { error } = await sb.from('moai_sync_runs').upsert(
    {
      run_id: job.run_id,
      client_slug: job.client_slug || 'moai',
      mode: job.mode || 'manual',
      reason: job.reason || null,
      status: 'running',
      metadata: {
        requested_at: job.requested_at,
      },
    },
    { onConflict: 'run_id' },
  )
  if (error) throw error
}

async function insertStepStart(sb: SupabaseClient, job: SyncJob) {
  const { error } = await sb.from('moai_sync_run_steps').insert({
    run_id: job.run_id,
    client_slug: job.client_slug || 'moai',
    source: job.source,
    mode: job.mode || 'manual',
    status: 'running',
    payload: job,
  })
  if (error) console.warn('[moai-source] step start insert failed', error.message)
}

async function insertRawRecords(
  sb: SupabaseClient,
  job: SyncJob,
  entity: string,
  records: Array<Record<string, unknown>>,
) {
  if (records.length === 0) return 0
  let inserted = 0
  for (let i = 0; i < records.length; i += 500) {
    const batch = records.slice(i, i + 500).map((record) => ({
      client_slug: job.client_slug || 'moai',
      run_id: job.run_id,
      source: job.source,
      entity,
      external_id: String(record.id || record.external_id || record.uuid || ''),
      occurred_at: String(record.updated_at || record.created_at || record.date || '') || null,
      payload: record,
    }))

    const { error } = await sb.from('moai_raw_records').insert(batch)
    if (error && !error.message.toLowerCase().includes('duplicate')) throw error
    inserted += batch.length
  }
  return inserted
}

async function fetchClintPage(path: string, page: number) {
  const token = process.env.CLINT_API_TOKEN || process.env.MOAI_CLINT_API_TOKEN || ''
  if (!token) throw new Error('CLINT_API_TOKEN missing')

  const url = new URL(`https://api.clint.digital${path}`)
  url.searchParams.set('limit', '1000')
  url.searchParams.set('page', String(page))

  const response = await fetch(url, {
    headers: {
      'api-token': token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'adflow-moai-sync/1.0',
    },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Clint ${path} failed (${response.status}): ${text}`)
  }

  return (await response.json()) as {
    data?: Array<Record<string, unknown>>
    hasNext?: boolean
    totalPages?: number
  } | Array<Record<string, unknown>>
}

async function collectClintEntity(entity: string) {
  const path = CLINT_ENDPOINTS[entity]
  if (!path) return []

  const records: Array<Record<string, unknown>> = []
  let page = 1
  while (page <= 200) {
    const payload = await fetchClintPage(path, page)
    if (Array.isArray(payload)) {
      records.push(...payload)
      break
    }

    const rows = Array.isArray(payload.data) ? payload.data : []
    records.push(...rows)
    if (!payload.hasNext) break
    if (payload.totalPages && page >= payload.totalPages) break
    page += 1
  }
  return records
}

async function syncClint(sb: SupabaseClient, job: SyncJob): Promise<SyncResult> {
  const warnings: string[] = []
  const scope = job.scope?.length ? job.scope : ['deals', 'contacts', 'groups', 'origins', 'users', 'account_fields']
  let rowsRaw = 0

  for (const entity of scope) {
    if (!CLINT_ENDPOINTS[entity]) {
      warnings.push(`Ignored unsupported Clint entity: ${entity}`)
      continue
    }
    const records = await collectClintEntity(entity)
    rowsRaw += await insertRawRecords(sb, job, entity, records)
  }

  return {
    ok: true,
    source: 'clint',
    run_id: job.run_id,
    rows_raw: rowsRaw,
    rows_staged: 0,
    rows_mart: 0,
    warnings,
    job,
  }
}

function pendingConnector(job: SyncJob, detail: string): SyncResult {
  return {
    ok: true,
    source: job.source,
    run_id: job.run_id,
    rows_raw: 0,
    rows_staged: 0,
    rows_mart: 0,
    warnings: [detail],
    job,
  }
}

async function runJob(sb: SupabaseClient, job: SyncJob): Promise<SyncResult> {
  if (job.source === 'clint') return syncClint(sb, job)
  if (job.source === 'monday') return pendingConnector(job, 'Monday connector pending: configure MONDAY_API_TOKEN and board map.')
  if (job.source === 'meta_ads') return pendingConnector(job, 'Meta Ads connector pending: configure system user token and campaign/adset/ad ingestion.')
  if (job.source === 'google_ads') return pendingConnector(job, 'Google Ads connector pending: configure developer token, OAuth refresh token and customer id.')
  return pendingConnector(job, 'Maia connector pending: confirm base URL and authentication model.')
}

async function finishStep(sb: SupabaseClient, result: SyncResult) {
  const { error } = await sb.from('moai_sync_run_steps').insert({
    run_id: result.run_id,
    client_slug: result.job.client_slug || 'moai',
    source: result.source,
    mode: result.job.mode || 'manual',
    status: result.ok ? 'ok' : 'failed',
    rows_raw: result.rows_raw,
    rows_staged: result.rows_staged,
    rows_mart: result.rows_mart,
    warnings: result.warnings,
    error: result.error || null,
    finished_at: new Date().toISOString(),
    payload: result,
  })
  if (error) console.warn('[moai-source] finish step insert failed', error.message)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyHeaders(res)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method not allowed' })
  if (!requireSyncAuth(req, res)) return

  let job: SyncJob
  try {
    job = normalizeJob(req.body)
  } catch (error) {
    return res.status(400).json({ ok: false, error: error instanceof Error ? error.message : String(error) })
  }

  const sb = supabaseAdmin()
  await ensureRun(sb, job)
  await insertStepStart(sb, job)

  try {
    const result = await runJob(sb, job)
    await finishStep(sb, result)
    return res.status(200).json(result)
  } catch (error) {
    const result: SyncResult = {
      ok: false,
      source: job.source,
      run_id: job.run_id,
      rows_raw: 0,
      rows_staged: 0,
      rows_mart: 0,
      warnings: [],
      error: error instanceof Error ? error.message : String(error),
      job,
    }
    await finishStep(sb, result)
    console.error('[moai-source] sync failed', result)
    return res.status(500).json(result)
  }
}
