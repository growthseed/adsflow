/**
 * GET /api/crons/run?job=pacing-tick | alerts-evaluate | reports-deliver
 *
 * Handler único que roteia os 3 jobs de cron do V2. Consolidado pra
 * respeitar o limite de 12 serverless functions do Vercel Hobby.
 * Cada schedule em vercel.json aponta pra esta função com ?job=<name>.
 *
 * Auth: Bearer CRON_SECRET (Vercel cron auto-injeta no header).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

import { requireCronAuth } from '../../src/server/sync/config.js'
import { runPacingTick }      from '../../src/server/crons/pacing-tick.js'
import { runAlertsEvaluate }  from '../../src/server/crons/alerts-evaluate.js'
import { runReportsDeliver }  from '../../src/server/crons/reports-deliver.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireCronAuth(req, res)) return

  const job = String(req.query.job || '').trim()
  switch (job) {
    case 'pacing-tick':
      return runPacingTick(req, res)
    case 'alerts-evaluate':
      return runAlertsEvaluate(req, res)
    case 'reports-deliver':
      return runReportsDeliver(req, res)
    default:
      return res.status(400).json({
        error: `unknown job "${job}"`,
        valid: ['pacing-tick', 'alerts-evaluate', 'reports-deliver'],
      })
  }
}
