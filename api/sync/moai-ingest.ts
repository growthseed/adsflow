import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

type IngestPayload = {
  run_id?: string
  client_slug?: string
  source: string
  entity: string
  mode?: string
  records: Array<Record<string, unknown>>
  metadata?: Record<string, unknown>
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

function getExternalId(record: Record<string, unknown>) {
  return String(record.id || record.external_id || record.uuid || record.deal_id || record.contact_id || record.item_id || record.ad_id || '')
}

function getOccurredAt(record: Record<string, unknown>) {
  return String(record.updated_at || record.created_at || record.date || record.date_start || record.timestamp || '') || null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyHeaders(res)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method not allowed' })
  if (!requireSyncAuth(req, res)) return

  const body = req.body as Partial<IngestPayload>
  if (!body.source || !body.entity) return res.status(400).json({ ok: false, error: 'source and entity are required' })
  if (!Array.isArray(body.records)) return res.status(400).json({ ok: false, error: 'records[] is required' })

  const sb = supabaseAdmin()
  const runId = body.run_id || `moai-ingest-${body.source}-${new Date().toISOString()}`
  const clientSlug = body.client_slug || 'moai'
  let inserted = 0

  try {
    await sb.from('moai_sync_runs').upsert(
      {
        run_id: runId,
        client_slug: clientSlug,
        mode: body.mode || 'n8n',
        reason: 'n8n_source_ingest',
        status: 'running',
        metadata: body.metadata || {},
      },
      { onConflict: 'run_id' },
    )

    for (let i = 0; i < body.records.length; i += 500) {
      const batch = body.records.slice(i, i + 500).map((record) => ({
        client_slug: clientSlug,
        run_id: runId,
        source: body.source,
        entity: body.entity,
        external_id: getExternalId(record),
        occurred_at: getOccurredAt(record),
        payload: record,
      }))

      const { error } = await sb.from('moai_raw_records').insert(batch)
      if (error && !error.message.toLowerCase().includes('duplicate')) throw error
      inserted += batch.length
    }

    await sb.from('moai_sync_run_steps').insert({
      run_id: runId,
      client_slug: clientSlug,
      source: body.source,
      mode: body.mode || 'n8n',
      status: 'ok',
      rows_raw: inserted,
      rows_staged: 0,
      rows_mart: 0,
      warnings: [],
      finished_at: new Date().toISOString(),
      payload: {
        source: body.source,
        entity: body.entity,
        metadata: body.metadata || {},
      },
    })

    return res.status(200).json({
      ok: true,
      run_id: runId,
      source: body.source,
      entity: body.entity,
      rows_raw: inserted,
    })
  } catch (error) {
    console.error('[moai-ingest] error', error)
    await sb.from('moai_sync_run_steps').insert({
      run_id: runId,
      client_slug: clientSlug,
      source: body.source,
      mode: body.mode || 'n8n',
      status: 'failed',
      rows_raw: inserted,
      error: error instanceof Error ? error.message : String(error),
      finished_at: new Date().toISOString(),
      payload: { source: body.source, entity: body.entity },
    })

    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      rows_raw: inserted,
    })
  }
}

