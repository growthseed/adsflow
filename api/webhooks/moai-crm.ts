import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

type CrmWebhookPayload = {
  id?: string | number
  event?: string
  event_type?: string
  type?: string
  entity?: string
  resource?: string
  source?: string
  data?: Record<string, unknown> | Record<string, unknown>[]
  payload?: Record<string, unknown>
  deal?: Record<string, unknown>
  contact?: Record<string, unknown>
  [key: string]: unknown
}

function applyHeaders(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
}

function getSecretCandidates() {
  return [
    process.env.MOAI_CRM_WEBHOOK_SECRET,
    process.env.MOAI_CLINT_WEBHOOK_SECRET,
    process.env.MOAI_CLINK_WEBHOOK_SECRET,
    process.env.MOAI_SYNC_SECRET,
  ].filter(Boolean) as string[]
}

function requireWebhookAuth(req: VercelRequest, res: VercelResponse): boolean {
  const candidates = getSecretCandidates()
  if (candidates.length === 0) {
    res.status(500).json({ ok: false, error: 'MOAI_CRM_WEBHOOK_SECRET not configured' })
    return false
  }

  const auth = String(req.headers.authorization || '')
  const headerSecret = String(
    req.headers['x-moai-webhook-secret'] ||
      req.headers['x-clint-webhook-secret'] ||
      req.headers['x-clink-webhook-secret'] ||
      req.headers['x-webhook-secret'] ||
      '',
  )

  const ok = candidates.some((secret) => auth === `Bearer ${secret}` || headerSecret === secret)
  if (!ok) {
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

function pickEntity(body: CrmWebhookPayload): string {
  const raw = String(body.entity || body.resource || body.type || body.event_type || body.event || 'crm_event')
    .toLowerCase()
    .replace(/[^a-z0-9_:-]+/g, '_')

  if (raw.includes('deal') || raw.includes('negocio') || raw.includes('opportun')) return 'deal'
  if (raw.includes('contact') || raw.includes('contato') || raw.includes('lead')) return 'contact'
  if (raw.includes('stage') || raw.includes('etapa')) return 'stage'
  return raw.slice(0, 80) || 'crm_event'
}

function pickSource(body: CrmWebhookPayload): string {
  const source = String(body.source || '').toLowerCase()
  if (source.includes('clink')) return 'clink'
  if (source.includes('clint')) return 'clint'
  return 'crm_webhook'
}

function pickEventType(body: CrmWebhookPayload): string {
  return String(body.event_type || body.event || body.type || 'upsert')
}

function pickRecords(body: CrmWebhookPayload): Array<Record<string, unknown>> {
  if (Array.isArray(body.data)) return body.data
  if (body.data && typeof body.data === 'object') return [body.data]
  if (body.payload && typeof body.payload === 'object') return [body.payload]
  if (body.deal && typeof body.deal === 'object') return [body.deal]
  if (body.contact && typeof body.contact === 'object') return [body.contact]
  return [body as Record<string, unknown>]
}

function pickExternalId(record: Record<string, unknown>, body: CrmWebhookPayload): string {
  return String(
    record.id ||
      record.external_id ||
      record.uuid ||
      record.deal_id ||
      record.contact_id ||
      body.id ||
      '',
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyHeaders(res)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method not allowed' })
  if (!requireWebhookAuth(req, res)) return

  const body = (req.body || {}) as CrmWebhookPayload
  const source = pickSource(body)
  const entity = pickEntity(body)
  const eventType = pickEventType(body)
  const runId = `moai-webhook-${source}-${new Date().toISOString().slice(0, 10)}`
  const records = pickRecords(body)
  const sb = supabaseAdmin()

  try {
    const rows = records.map((record) => ({
      client_slug: 'moai',
      run_id: runId,
      source,
      entity,
      external_id: pickExternalId(record, body),
      occurred_at: String(record.updated_at || record.created_at || record.date || '') || null,
      payload: {
        event_type: eventType,
        received_at: new Date().toISOString(),
        body,
        record,
      },
    }))

    const { error } = await sb.from('moai_raw_records').insert(rows)
    if (error && !error.message.toLowerCase().includes('duplicate')) throw error

    await sb.from('moai_sync_run_steps').insert({
      run_id: runId,
      client_slug: 'moai',
      source,
      mode: 'webhook',
      status: 'ok',
      rows_raw: rows.length,
      warnings: [],
      finished_at: new Date().toISOString(),
      payload: {
        event_type: eventType,
        entity,
        source,
      },
    })

    return res.status(200).json({
      ok: true,
      source,
      entity,
      event_type: eventType,
      rows_raw: rows.length,
      run_id: runId,
    })
  } catch (error) {
    console.error('[moai-crm-webhook] error', error)
    await sb.from('moai_sync_run_steps').insert({
      run_id: runId,
      client_slug: 'moai',
      source,
      mode: 'webhook',
      status: 'failed',
      rows_raw: 0,
      error: error instanceof Error ? error.message : String(error),
      finished_at: new Date().toISOString(),
      payload: { event_type: eventType, entity, source },
    })

    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

