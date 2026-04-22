/**
 * POST /api/clickup/oauth-callback
 *
 * Server-side proxy for ClickUp OAuth 2.0 token exchange.
 * Keeps CLICKUP_CLIENT_SECRET on the server.
 *
 * Body:
 *   { action: 'exchange', code: string, redirect_uri: string }
 *
 * Returns:
 *   { access_token: string, teams: Team[], user: User | null }
 *
 * Auth: Supabase JWT (so anonymous callers can't burn the secret).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { allowMethods, applyCors, requireUserAuth } from '../_lib/security'

const CLICKUP_CLIENT_ID = process.env.CLICKUP_CLIENT_ID || ''
const CLICKUP_CLIENT_SECRET = process.env.CLICKUP_CLIENT_SECRET || ''
const CLICKUP_API = 'https://api.clickup.com/api/v2'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  if (!CLICKUP_CLIENT_ID || !CLICKUP_CLIENT_SECRET) {
    return res.status(500).json({
      error:
        'CLICKUP_CLIENT_ID / CLICKUP_CLIENT_SECRET não configurados no servidor.',
    })
  }

  const { action, code, redirect_uri } = (req.body || {}) as {
    action?: string
    code?: string
    redirect_uri?: string
  }

  if (action !== 'exchange') {
    return res.status(400).json({ error: `Unknown action: ${String(action)}` })
  }
  if (!code) {
    return res.status(400).json({ error: '`code` is required.' })
  }

  try {
    // =============================
    // 1. Exchange code -> token
    // =============================
    const tokenResp = await fetch(`${CLICKUP_API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLICKUP_CLIENT_ID,
        client_secret: CLICKUP_CLIENT_SECRET,
        code,
        redirect_uri: redirect_uri || undefined,
      }),
    })

    const tokenPayload = (await tokenResp.json().catch(() => ({}))) as {
      access_token?: string
      err?: string
      ECODE?: string
    }

    if (!tokenResp.ok || !tokenPayload.access_token) {
      return res.status(tokenResp.status || 502).json({
        error: `ClickUp token exchange falhou: ${
          tokenPayload.err || tokenPayload.ECODE || tokenResp.statusText
        }`,
      })
    }

    const accessToken = tokenPayload.access_token

    // =============================
    // 2. Fetch teams + user for UI
    // =============================
    const [teamsRes, userRes] = await Promise.all([
      fetch(`${CLICKUP_API}/team`, { headers: { Authorization: accessToken } }),
      fetch(`${CLICKUP_API}/user`, { headers: { Authorization: accessToken } }),
    ])

    const teamsJson = (await teamsRes.json().catch(() => ({}))) as {
      teams?: Array<{
        id: string
        name: string
        color?: string
        avatar?: string | null
        members?: Array<unknown>
      }>
    }

    const userJson = userRes.ok
      ? ((await userRes.json()) as {
          user?: {
            id: number
            username: string
            email: string
            color?: string
            profilePicture?: string | null
          }
        })
      : { user: null }

    const teams = (teamsJson.teams || []).map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      avatar: t.avatar ?? null,
      members: Array.isArray(t.members) ? t.members.length : undefined,
    }))

    return res.status(200).json({
      access_token: accessToken,
      teams,
      user: userJson.user ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
