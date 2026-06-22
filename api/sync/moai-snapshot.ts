/**
 * ============================================
 * POST/GET /api/sync/moai-snapshot
 * ============================================
 * POST  → roda buildMoaiSnapshot live (Clint+Monday+Meta) e cacheia
 * GET   → devolve o snapshot mais recente do cache (json)
 *
 * Query params:
 *   slug      cliente (default: 'moai')
 *   force     boolean (POST only) — força refresh Monday mesmo se cache fresh
 *
 * Auth:
 *   POST exige Bearer CRON_SECRET (rodado por cron Vercel ou admin manual)
 *   GET pode ser público (snapshot enxuto sem dados sensíveis) — TODO: lock por tenant
 * ============================================
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCronAuth, setCommonHeaders, insertSnapshot } from '../../src/server/sync/config.js'
import { buildMoaiSnapshot } from '../../src/server/sync/moaiSnapshotBuilder.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCommonHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const slug = (req.query.slug as string) || 'moai'

  // ===== POST: build live =====
  if (req.method === 'POST') {
    if (!requireCronAuth(req, res)) return
    const startedAt = Date.now()
    try {
      const result = await buildMoaiSnapshot({
        clientSlug: slug,
        forceMondaySync: req.query.force === 'true',
      })
      const duration = Date.now() - startedAt

      // Salva no client_dashboard_snapshots (ou agency_snapshots como kind)
      await insertSnapshot({
        kind: 'moai',
        period_from: (result.snapshot?.period as { from?: string } | undefined)?.from ?? '',
        period_to: (result.snapshot?.period as { to?: string } | undefined)?.to ?? '',
        data: result.snapshot,
        sync_status: result.ok ? 'ok' : 'partial',
        duration_ms: duration,
      })

      return res.status(200).json({
        ok: result.ok,
        duration_ms: duration,
        diagnostics: result.diagnostics,
        errors: result.errors,
        snapshot_preview: {
          slug: (result.snapshot as { slug?: string } | undefined)?.slug,
          last_synced_at: (result.snapshot as { last_synced_at?: string } | undefined)?.last_synced_at,
          kpi_count: Object.keys(((result.snapshot as { kpis?: object } | undefined)?.kpis) ?? {}).length,
        },
      })
    } catch (e) {
      console.error('[moai-snapshot] POST error', e)
      return res.status(500).json({
        error: 'build failed',
        message: e instanceof Error ? e.message : String(e),
      })
    }
  }

  // ===== GET: read most recent =====
  if (req.method === 'GET') {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      if (!url || !key) {
        return res.status(503).json({ error: 'supabase env missing' })
      }
      const sb = createClient(url, key)
      const { data, error } = await sb
        .from('agency_snapshots')
        .select('id, period_from, period_to, data, created_at, sync_status')
        .eq('kind', 'moai')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) return res.status(500).json({ error: error.message })
      if (!data) return res.status(404).json({ error: 'no snapshot yet' })

      return res.status(200).json({
        ok: true,
        snapshot: data.data,
        meta: {
          id: data.id,
          generated_at: data.created_at,
          period_from: data.period_from,
          period_to: data.period_to,
          sync_status: data.sync_status,
        },
      })
    } catch (e) {
      console.error('[moai-snapshot] GET error', e)
      return res.status(500).json({
        error: 'read failed',
        message: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return res.status(405).json({ error: 'method not allowed' })
}
