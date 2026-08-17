/**
 * POST /api/clickup/oauth-callback
 *
 * Server-side proxy for ClickUp OAuth 2.0 token exchange.
 * Keeps CLICKUP_CLIENT_SECRET on the server.
 *
 * Body:
 *   { action: 'exchange', code, redirect_uri, client_slug, team_id? }
 *   { action: 'set-team', client_slug, team_id, team_name? }
 *
 * Returns (nunca o token):
 *   { integration: SanitizedIntegration, teams: Team[], user: User | null }
 *
 * Auth: Supabase JWT + membership no client_slug.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  allowMethods,
  applyCors,
  requireClientMembership,
  requireUserAuth,
} from '../_lib/security'
import { persistIntegration, sanitize } from '../_lib/integrations'

const CLICKUP_CLIENT_ID = process.env.CLICKUP_CLIENT_ID || ''
const CLICKUP_CLIENT_SECRET = process.env.CLICKUP_CLIENT_SECRET || ''
const CLICKUP_API = 'https://api.clickup.com/api/v2'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const { action, code, redirect_uri, client_slug, team_id, team_name } = (req.body ||
    {}) as {
    action?: string
    code?: string
    redirect_uri?: string
    client_slug?: string
    team_id?: string
    team_name?: string
  }

  const client = await requireClientMembership(auth, client_slug, res)
  if (!client) return

  // -------------------------------------------------------
  // set-team — troca o workspace ativo sem refazer o OAuth
  // -------------------------------------------------------
  if (action === 'set-team') {
    if (!team_id) return res.status(400).json({ error: '`team_id` is required.' })

    const { data, error } = await auth.serviceClient
      .from('client_integrations')
      .update({
        external_account_id: team_id,
        external_account_name: team_name || null,
        external_workspace_id: team_id,
      })
      .eq('client_id', client.id)
      .eq('provider', 'clickup')
      .select(
        'id, client_id, provider, external_account_id, external_account_name, status, ' +
          'last_synced_at, token_expires_at, metadata, created_at, updated_at, ' +
          'access_token, refresh_token',
      )
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'Nenhuma integração ClickUp para este cliente.' })

    return res.status(200).json({ integration: sanitize(data) })
  }

  if (action !== 'exchange') {
    return res.status(400).json({ error: `Unknown action: ${String(action)}` })
  }
  if (!CLICKUP_CLIENT_ID || !CLICKUP_CLIENT_SECRET) {
    return res.status(500).json({
      error: 'CLICKUP_CLIENT_ID / CLICKUP_CLIENT_SECRET não configurados no servidor.',
    })
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

    // O ClickUp nao tem "conta" unica: a identidade externa e o team/workspace.
    // Se a UI ainda nao sabe qual, grava no primeiro e sinaliza — o usuario
    // troca depois via action 'set-team', sem refazer o consentimento.
    const chosen = team_id
      ? teams.find((t) => t.id === team_id) ?? { id: team_id, name: team_name || '' }
      : teams[0]

    if (!chosen) {
      return res.status(422).json({
        error: 'A conta ClickUp autorizada não tem nenhum workspace acessível.',
      })
    }

    // =============================
    // 3. Persiste server-side
    // =============================
    const integration = await persistIntegration(auth.serviceClient, {
      clientId: client.id,
      provider: 'clickup',
      externalAccountId: chosen.id,
      externalAccountName: chosen.name || null,
      externalWorkspaceId: chosen.id,
      accessToken,
      metadata: {
        connected_by: auth.user.id,
        clickup_user_id: userJson.user?.id ?? null,
        clickup_username: userJson.user?.username ?? null,
        available_teams: teams.map((t) => ({ id: t.id, name: t.name })),
        pending_team_selection: !team_id && teams.length > 1,
      },
    })

    return res.status(200).json({
      integration,
      teams,
      user: userJson.user ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
