/**
 * ============================================
 * POST /api/sync/performance
 * ============================================
 * Triggers a full Meta Ads + Google Ads snapshot fetch
 * and writes the result to public.agency_snapshots
 * (kind='performance').
 *
 * Auth: Bearer CRON_SECRET.
 * ============================================
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCronAuth, setCommonHeaders, insertSnapshot } from '../../src/server/sync/config.js'
import { fetchPerformanceSnapshot } from '../../src/server/sync/performanceFetcher.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCommonHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!requireCronAuth(req, res)) return

  const startedAt = Date.now()

  try {
    const snapshot = await fetchPerformanceSnapshot()
    const duration = Date.now() - startedAt

    const clients = Object.values(snapshot.clients)
    const clientCount = clients.length
    const totalSpend = clients.reduce(
      (sum: number, c) => sum + c.blended.total_spend,
      0,
    )
    const totalConversions = clients.reduce(
      (sum: number, c) => sum + c.blended.total_conversions,
      0,
    )

    const result = await insertSnapshot({
      kind: 'performance',
      period_from: snapshot.period.from,
      period_to: snapshot.period.to,
      data: snapshot,
      sync_status: 'ok',
      duration_ms: duration,
    })

    if (!result.ok) {
      return res.status(500).json({
        error: 'Supabase insert failed',
        details: result.error,
        captured: { clients: clientCount, total_spend: totalSpend },
      })
    }

    return res.status(200).json({
      ok: true,
      snapshot_id: result.id,
      duration_ms: duration,
      period: snapshot.period,
      clients: clientCount,
      total_spend: totalSpend,
      total_conversions: totalConversions,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[sync/performance]', message)

    await insertSnapshot({
      kind: 'performance',
      data: {},
      sync_status: 'failed',
      error_log: message,
      duration_ms: Date.now() - startedAt,
    }).catch(() => null)

    return res.status(500).json({ ok: false, error: message })
  }
}
