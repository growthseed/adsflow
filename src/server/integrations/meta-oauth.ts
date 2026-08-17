/**
 * ============================================
 * META OAUTH — troca e custódia de token por cliente
 * ============================================
 * Fecha a lacuna que o diagnóstico apontava como "onde o OAuth realmente
 * falta": não havia callback nenhum do Meta. O login client-side via FB SDK
 * só escolhia assets, e o sync usava META_ACCESS_TOKEN — um token global,
 * o mesmo para todos os clientes.
 *
 * Aqui o short-lived token do SDK vira long-lived (60 dias) no servidor,
 * usando o APP_SECRET, e é gravado por cliente em client_integrations.
 *
 * Roda como op do router /api/integrations porque o plano Hobby do Vercel
 * está em 12/12 functions — não há slot para um endpoint próprio.
 *
 * Ops:
 *   meta-oauth-exchange  (POST) — short-lived → long-lived → grava
 *   meta-oauth-accounts  (GET)  — lista ad accounts do token guardado
 *   meta-oauth-select    (POST) — fixa qual ad account o cliente usa
 * ============================================
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  allowMethods,
  applyCors,
  requireClientMembership,
  requireUserAuth,
} from '../../../api/_lib/security.js'
import {
  getIntegrationCredentials,
  persistIntegration,
} from '../../../api/_lib/integrations.js'

const APP_ID = process.env.META_APP_ID || process.env.VITE_FACEBOOK_APP_ID || ''
const APP_SECRET = process.env.META_APP_SECRET || ''
const API_VERSION = process.env.META_API_VERSION || 'v21.0'
const GRAPH = `https://graph.facebook.com/${API_VERSION}`

interface MetaAdAccount {
  id: string
  account_id: string
  name: string
  currency?: string
  timezone_name?: string
  account_status?: number
}

/**
 * Troca short-lived por long-lived. O Meta devolve ~60 dias para tokens de
 * usuário; System User tokens não expiram e passam por aqui inalterados.
 */
async function exchangeForLongLived(shortLivedToken: string): Promise<{
  access_token: string
  expires_in: number | null
}> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: APP_ID,
    client_secret: APP_SECRET,
    fb_exchange_token: shortLivedToken,
  })

  const resp = await fetch(`${GRAPH}/oauth/access_token?${params}`)
  const payload = (await resp.json().catch(() => ({}))) as {
    access_token?: string
    expires_in?: number
    error?: { message?: string }
  }

  if (!resp.ok || !payload.access_token) {
    throw new Error(
      `Meta token exchange falhou: ${payload.error?.message || resp.statusText}`,
    )
  }

  // System User token não traz expires_in — é permanente.
  return {
    access_token: payload.access_token,
    expires_in: payload.expires_in ?? null,
  }
}

async function fetchAdAccounts(token: string): Promise<MetaAdAccount[]> {
  const fields = 'id,account_id,name,currency,timezone_name,account_status'
  const resp = await fetch(`${GRAPH}/me/adaccounts?fields=${fields}&limit=200`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = (await resp.json().catch(() => ({}))) as {
    data?: MetaAdAccount[]
    error?: { message?: string }
  }
  if (!resp.ok) {
    throw new Error(`Meta /me/adaccounts falhou: ${payload.error?.message || resp.statusText}`)
  }
  return payload.data ?? []
}

// =============================================================
// OP: meta-oauth-exchange
// =============================================================

export async function runMetaOAuthExchange(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const { client_slug, short_lived_token, account_id, account_name } = (req.body ||
    {}) as {
    client_slug?: string
    short_lived_token?: string
    account_id?: string
    account_name?: string
  }

  const client = await requireClientMembership(auth, client_slug, res)
  if (!client) return

  if (!APP_ID || !APP_SECRET) {
    return res.status(500).json({
      error:
        'META_APP_ID / META_APP_SECRET não configurados no servidor. Sem o app secret não há como emitir token long-lived.',
    })
  }
  if (!short_lived_token) {
    return res.status(400).json({ error: '`short_lived_token` é obrigatório.' })
  }

  try {
    const { access_token, expires_in } = await exchangeForLongLived(short_lived_token)
    const accounts = await fetchAdAccounts(access_token)

    // Sem escolha explícita, usa a primeira conta e sinaliza pendência —
    // mesmo padrão do ClickUp, para não travar o fluxo de conexão.
    const chosen = account_id
      ? accounts.find((a) => a.account_id === account_id || a.id === account_id)
      : accounts[0]

    if (!chosen) {
      return res.status(422).json({
        error: account_id
          ? `Conta ${account_id} não está acessível por este token.`
          : 'O token não dá acesso a nenhuma conta de anúncios.',
      })
    }

    const integration = await persistIntegration(auth.serviceClient, {
      clientId: client.id,
      provider: 'meta_ads',
      externalAccountId: chosen.id, // act_XXXX
      externalAccountName: account_name || chosen.name,
      accessToken: access_token,
      expiresInSeconds: expires_in,
      metadata: {
        connected_by: auth.user.id,
        account_id: chosen.account_id,
        currency: chosen.currency ?? null,
        timezone: chosen.timezone_name ?? null,
        is_permanent: expires_in === null,
        available_accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
        pending_account_selection: !account_id && accounts.length > 1,
      },
    })

    return res.status(200).json({
      integration,
      accounts,
      // Sinaliza System User token, que não precisa de renovação.
      is_permanent: expires_in === null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(502).json({ error: message })
  }
}

// =============================================================
// OP: meta-oauth-accounts
// =============================================================

export async function runMetaOAuthAccounts(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['GET'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const clientSlug = String(req.query.client_slug || '')
  const client = await requireClientMembership(auth, clientSlug, res)
  if (!client) return

  const creds = await getIntegrationCredentials(auth.serviceClient, client.id, 'meta_ads')
  if (!creds?.accessToken) {
    return res.status(404).json({ error: 'Nenhuma integração Meta para este cliente.' })
  }

  try {
    const accounts = await fetchAdAccounts(creds.accessToken)
    return res.status(200).json({ accounts, current: creds.externalAccountId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(502).json({ error: message })
  }
}

// =============================================================
// OP: meta-oauth-select
// =============================================================

export async function runMetaOAuthSelect(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const { client_slug, account_id, account_name } = (req.body || {}) as {
    client_slug?: string
    account_id?: string
    account_name?: string
  }

  const client = await requireClientMembership(auth, client_slug, res)
  if (!client) return
  if (!account_id) {
    return res.status(400).json({ error: '`account_id` é obrigatório.' })
  }

  const creds = await getIntegrationCredentials(auth.serviceClient, client.id, 'meta_ads')
  if (!creds) {
    return res.status(404).json({ error: 'Nenhuma integração Meta para este cliente.' })
  }

  const integration = await persistIntegration(auth.serviceClient, {
    clientId: client.id,
    provider: 'meta_ads',
    externalAccountId: account_id,
    externalAccountName: account_name ?? account_id,
    accessToken: creds.accessToken,
    refreshToken: creds.refreshToken,
    expiresAt: creds.tokenExpiresAt,
    metadata: { ...creds.metadata, pending_account_selection: false },
  })

  if (creds.externalAccountId !== account_id) {
    await auth.serviceClient
      .from('client_integrations')
      .delete()
      .eq('client_id', client.id)
      .eq('provider', 'meta_ads')
      .eq('external_account_id', creds.externalAccountId)
  }

  return res.status(200).json({ integration })
}
