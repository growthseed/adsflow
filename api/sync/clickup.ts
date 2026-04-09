/**
 * ============================================
 * POST /api/sync/clickup
 * ============================================
 * Triggers a full ClickUp snapshot fetch and writes
 * the result to public.agency_snapshots (kind='clickup').
 *
 * Auth: Bearer CRON_SECRET (Vercel cron auto-injects).
 * ============================================
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCronAuth, setCommonHeaders, insertSnapshot } from '../../src/server/sync/config.js'
import { fetchClickUpSnapshot } from '../../src/server/sync/clickupFetcher.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCommonHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!requireCronAuth(req, res)) return

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
