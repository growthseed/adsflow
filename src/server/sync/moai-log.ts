import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

type LogPayload = {
  ok?: boolean
  run_id?: string | null
  client_slug?: string
  source?: string
  mode?: string
  rows_raw?: number
  rows_staged?: number
  rows_mart?: number
  warnings?: unknown[]
  error?: string | null
  finished_at?: string
  payload?: unknown
  items?: LogPayload[]
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyHeaders(res)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method not allowed' })
  if (!requireSyncAuth(req, res)) return

  const body = req.body as LogPayload
  const items = Array.isArray(body.items) ? body.items : [body]
  const sb = supabaseAdmin()

  try {
    for (const item of items) {
      if (!item.run_id || !item.source) continue
      await sb.from('moai_sync_run_steps').insert({
        run_id: item.run_id,
        client_slug: item.client_slug || 'moai',
        source: item.source,
        mode: item.mode || null,
        status: item.ok === false ? 'failed' : 'ok',
        rows_raw: Number(item.rows_raw || 0),
        rows_staged: Number(item.rows_staged || 0),
        rows_mart: Number(item.rows_mart || 0),
        warnings: item.warnings || [],
        error: item.error || null,
        finished_at: item.finished_at || new Date().toISOString(),
        payload: item.payload || item,
      })
    }

    if (body.run_id && body.items) {
      await sb
        .from('moai_sync_runs')
        .update({
          status: body.ok === false ? 'partial' : 'ok',
          finished_at: new Date().toISOString(),
          total_rows_raw: Number(body.items.reduce((sum, item) => sum + Number(item.rows_raw || 0), 0)),
          total_rows_staged: Number(body.items.reduce((sum, item) => sum + Number(item.rows_staged || 0), 0)),
          total_rows_mart: Number(body.items.reduce((sum, item) => sum + Number(item.rows_mart || 0), 0)),
          error: body.ok === false ? 'One or more sync steps failed' : null,
          metadata: body,
        })
        .eq('run_id', body.run_id)
    }

    return res.status(200).json(body)
  } catch (error) {
    console.error('[moai-log] error', error)
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

