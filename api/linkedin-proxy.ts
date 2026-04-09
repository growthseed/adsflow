/**
 * ============================================
 * LINKEDIN API — Vercel Serverless Proxy
 * ============================================
 * Handles OAuth token exchange/refresh and API calls.
 * Keeps client_secret server-side.
 *
 * Actions: exchange, refresh, analytics, posts
 *
 * Env vars:
 *   LINKEDIN_CLIENT_ID
 *   LINKEDIN_CLIENT_SECRET
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  applyCors,
  allowMethods,
  requireUserAuth,
  requireClientMembership,
} from './_lib/security'

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || ''
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const { action, client_slug, ...body } = req.body || {}

  // analytics/followers act on a specific client's org — require membership.
  // exchange/refresh are OAuth bootstrap, authenticated user is enough.
  if (action === 'analytics' || action === 'followers') {
    const client = await requireClientMembership(auth, client_slug, res)
    if (!client) return
  }

  try {
    switch (action) {
      case 'exchange': {
        const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: body.code,
            redirect_uri: body.redirect_uri,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
          }),
        })
        if (!response.ok) throw new Error(await response.text())
        return res.json(await response.json())
      }

      case 'refresh': {
        const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: body.refresh_token,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
          }),
        })
        if (!response.ok) throw new Error(await response.text())
        return res.json(await response.json())
      }

      case 'analytics': {
        const response = await fetch(
          `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${body.organization_id}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${body.start_ms}&timeIntervals.timeRange.end=${body.end_ms}`,
          { headers: { Authorization: `Bearer ${body.access_token}` } },
        )
        if (!response.ok) throw new Error(await response.text())
        return res.json(await response.json())
      }

      case 'followers': {
        const response = await fetch(
          `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${body.organization_id}`,
          { headers: { Authorization: `Bearer ${body.access_token}` } },
        )
        if (!response.ok) throw new Error(await response.text())
        return res.json(await response.json())
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[linkedin-proxy] ${action} error:`, message)
    return res.status(500).json({ error: message })
  }
}
