/**
 * POST /api/kommo/oauth-callback
 *
 * Server-side proxy for Kommo OAuth 2.0. Holds the KOMMO_CLIENT_SECRET.
 *
 * Two actions:
 *   { action: 'exchange', code, subdomain, redirect_uri, client_slug }
 *     → { integration, account, pipelines }   (nunca o token)
 *
 *   { action: 'refresh', subdomain, redirect_uri, client_slug }
 *     → { integration }
 *     O refresh_token vem do banco, NAO do browser.
 *
 * Kommo token endpoint lives on the account's own subdomain:
 *   POST https://{subdomain}.kommo.com/oauth2/access_token
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
import {
  getIntegrationCredentials,
  markIntegrationError,
  persistIntegration,
} from '../_lib/integrations'

const KOMMO_CLIENT_ID = process.env.KOMMO_CLIENT_ID || ''
const KOMMO_CLIENT_SECRET = process.env.KOMMO_CLIENT_SECRET || ''

function cleanSubdomain(raw: string): string {
  let s = String(raw || '').trim().toLowerCase()
  s = s.replace(/^https?:\/\//, '')
  s = s.replace(/\.kommo\.com\/?.*$/, '')
  s = s.replace(/\/$/, '')
  return s
}

interface KommoTokenPayload {
  token_type?: string
  expires_in?: number
  access_token?: string
  refresh_token?: string
  hint?: string
  title?: string
}

async function kommoTokenCall(
  subdomain: string,
  body: Record<string, string>,
): Promise<{ ok: boolean; status: number; payload: KommoTokenPayload }> {
  const resp = await fetch(
    `https://${subdomain}.kommo.com/oauth2/access_token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  const payload = (await resp.json().catch(() => ({}))) as KommoTokenPayload
  return { ok: resp.ok, status: resp.status, payload }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  if (!KOMMO_CLIENT_ID || !KOMMO_CLIENT_SECRET) {
    return res.status(500).json({
      error:
        'KOMMO_CLIENT_ID / KOMMO_CLIENT_SECRET não configurados no servidor.',
    })
  }

  const body = (req.body || {}) as {
    action?: string
    code?: string
    subdomain?: string
    redirect_uri?: string
    client_slug?: string
  }

  const client = await requireClientMembership(auth, body.client_slug, res)
  if (!client) return

  const subdomain = cleanSubdomain(body.subdomain || '')
  if (!subdomain) {
    return res.status(400).json({ error: '`subdomain` is required.' })
  }
  if (!body.redirect_uri) {
    return res.status(400).json({ error: '`redirect_uri` is required.' })
  }

  try {
    // ==========================
    // EXCHANGE authorization_code
    // ==========================
    if (body.action === 'exchange') {
      if (!body.code) {
        return res.status(400).json({ error: '`code` is required.' })
      }

      const { ok, status, payload } = await kommoTokenCall(subdomain, {
        client_id: KOMMO_CLIENT_ID,
        client_secret: KOMMO_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: body.code,
        redirect_uri: body.redirect_uri,
      })

      if (!ok || !payload.access_token || !payload.refresh_token) {
        return res.status(status || 502).json({
          error: `Kommo token exchange falhou: ${
            payload.title || payload.hint || 'unknown'
          }`,
        })
      }

      const accessToken = payload.access_token
      const base = `https://${subdomain}.kommo.com/api/v4`
      const authHeaders = { Authorization: `Bearer ${accessToken}` }

      const [accountRes, pipelinesRes] = await Promise.all([
        fetch(`${base}/account`, { headers: authHeaders }),
        fetch(`${base}/leads/pipelines`, { headers: authHeaders }),
      ])

      const account = accountRes.ok ? await accountRes.json().catch(() => null) : null
      let pipelines: unknown[] = []
      if (pipelinesRes.ok) {
        const p = (await pipelinesRes.json().catch(() => ({}))) as {
          _embedded?: { pipelines?: unknown[] }
        }
        pipelines = p._embedded?.pipelines ?? []
      }

      const accountName =
        (account as { name?: string } | null)?.name || subdomain

      const integration = await persistIntegration(auth.serviceClient, {
        clientId: client.id,
        provider: 'kommo',
        externalAccountId: subdomain,
        externalAccountName: accountName,
        accessToken,
        refreshToken: payload.refresh_token,
        expiresInSeconds: payload.expires_in ?? 86400,
        metadata: {
          connected_by: auth.user.id,
          subdomain,
          redirect_uri: body.redirect_uri,
          pipeline_ids: (pipelines as Array<{ id?: number }>).
            map((p) => p?.id).filter(Boolean),
        },
      })

      return res.status(200).json({ integration, account, pipelines })
    }

    // ==========================
    // REFRESH via refresh_token
    // ==========================
    if (body.action === 'refresh') {
      // O refresh_token sai do banco. O browser nao ve nem envia credencial.
      const stored = await getIntegrationCredentials(
        auth.serviceClient,
        client.id,
        'kommo',
      )
      if (!stored?.refreshToken) {
        return res.status(404).json({
          error: 'Nenhuma integração Kommo com refresh_token para este cliente.',
        })
      }

      const { ok, status, payload } = await kommoTokenCall(subdomain, {
        client_id: KOMMO_CLIENT_ID,
        client_secret: KOMMO_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: stored.refreshToken,
        redirect_uri: body.redirect_uri,
      })

      if (!ok || !payload.access_token) {
        const detail = payload.title || payload.hint || 'unknown'
        await markIntegrationError(auth.serviceClient, stored.id, detail)
        return res.status(status || 502).json({
          error: `Kommo refresh falhou: ${detail}`,
        })
      }

      const integration = await persistIntegration(auth.serviceClient, {
        clientId: client.id,
        provider: 'kommo',
        externalAccountId: stored.externalAccountId,
        externalAccountName:
          (stored.metadata.account_name as string | undefined) ?? subdomain,
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token ?? stored.refreshToken,
        expiresInSeconds: payload.expires_in ?? 86400,
        metadata: { ...stored.metadata, refreshed_by: auth.user.id },
      })

      return res.status(200).json({ integration })
    }

    return res.status(400).json({ error: `Unknown action: ${body.action}` })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
