/**
 * ============================================
 * POST /api/sync/clickup
 * ============================================
 * Triggers a full ClickUp snapshot fetch and writes
 * the result to public.agency_snapshots (kind='clickup').
 *
 * Auth: cron secret for scheduled GETs; active agency admin JWT for manual POSTs.
 * ============================================
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCronAuth, setCommonHeaders, insertSnapshot } from '../../src/server/sync/config.js'
import { fetchClickUpSnapshot } from '../../src/server/sync/clickupFetcher.js'
import { requireUserAuth } from '../_lib/security.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCommonHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  // Scheduled jobs use the cron secret. Manual refresh uses a verified
  // staff session; never send the cron credential to the browser.
  const cronSecret = process.env.CRON_SECRET
  const isCron = !!cronSecret && req.headers.authorization === `Bearer ${cronSecret}`
  if (req.method === 'GET' || isCron) {
    if (!requireCronAuth(req, res)) return
  } else {
    const auth = await requireUserAuth(req, res)
    if (!auth) return
    if (auth.globalRole !== 'admin' && auth.globalRole !== 'super_admin') {
      return res.status(403).json({ error: 'Somente administradores podem sincronizar a agencia.' })
    }
    const { data: profile, error } = await auth.serviceClient
      .from('users').select('is_active').eq('id', auth.user.id).maybeSingle()
    if (error || profile?.is_active !== true) {
      return res.status(403).json({ error: 'Conta sem acesso ativo.' })
    }
  }

  const startedAt = Date.now()

  try {
    const snapshot = await fetchClickUpSnapshot()
    const duration = Date.now() - startedAt

    const result = await insertSnapshot({
      kind: 'clickup',
      data: snapshot,
      sync_status: 'ok',
      duration_ms: duration,
    })

    if (!result.ok) {
      return res.status(500).json({
        error: 'Supabase insert failed',
        details: result.error,
        captured: {
          clients: snapshot.clients.length,
          total_tasks: snapshot.aggregate.total_active_tasks,
        },
      })
    }

    return res.status(200).json({
      ok: true,
      snapshot_id: result.id,
      duration_ms: duration,
      clients: snapshot.clients.length,
      total_active_tasks: snapshot.aggregate.total_active_tasks,
      total_overdue: snapshot.aggregate.total_overdue,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[sync/clickup]', message)

    await insertSnapshot({
      kind: 'clickup',
      data: {},
      sync_status: 'failed',
      error_log: message,
      duration_ms: Date.now() - startedAt,
    }).catch(() => null)

    return res.status(500).json({ ok: false, error: message })
  }
}
