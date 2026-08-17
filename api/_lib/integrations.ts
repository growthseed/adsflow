/**
 * ============================================
 * PERSISTENCIA DE INTEGRACOES — server-side only
 * ============================================
 * Fecha o achado da auditoria que a migration 019 dizia estar fechando e
 * nao estava: "access_token trafegando pelo frontend".
 *
 * Antes: o callback trocava o code por token e DEVOLVIA o token ao browser,
 * que gravava em ad_accounts/google_accounts/clickup_configs/kommo_configs.
 * O token passava pelo JS do cliente em toda conexao.
 *
 * Agora: o callback chama persistIntegration() e devolve ao browser apenas
 * o resultado sanitizado (nome da conta, status, has_access_token). O token
 * nunca sai do servidor.
 *
 * Isso tambem e o que destrava a fase 2 da migration 037: o front NAO
 * consegue escrever em client_integrations (RLS deny-all), so o service
 * role — por isso os dois caminhos de dados coexistiam.
 * ============================================
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================
// TIPOS
// =============================================================

/** Providers aceitos pelo CHECK de client_integrations (019 + 030 + 031). */
export type Provider =
  | 'google_ads'
  | 'meta_ads'
  | 'google_analytics'
  | 'search_console'
  | 'google_my_business'
  | 'youtube'
  | 'linkedin'
  | 'clickup'
  | 'tiktok_ads'
  | 'kommo'
  | 'clint'
  | 'monday'
  | 'rdstation'
  | 'pipedrive'
  | 'hubspot'

export interface PersistInput {
  /** Cliente dono da integracao. Resolvido por requireClientMembership(). */
  clientId: string
  provider: Provider
  /** Identidade da conta no provider: act_123, customer_id, team_id, subdominio. */
  externalAccountId: string
  externalAccountName?: string | null
  externalWorkspaceId?: string | null
  externalListId?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  /** Segundos ate expirar (o que os providers devolvem). Convertido aqui. */
  expiresInSeconds?: number | null
  /** Timestamp absoluto, quando o provider ja devolve pronto. */
  expiresAt?: string | null
  metadata?: Record<string, unknown>
}

/** O que pode voltar para o browser. Sem token, nunca. */
export interface SanitizedIntegration {
  id: string
  client_id: string
  provider: Provider
  external_account_id: string
  external_account_name: string | null
  status: string
  last_synced_at: string | null
  has_access_token: boolean
  has_refresh_token: boolean
  token_expires_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// =============================================================
// PERSISTIR
// =============================================================

/**
 * Grava (ou atualiza) uma integracao usando service role e devolve a versao
 * sanitizada. Respeita a UNIQUE (client_id, provider, external_account_id).
 *
 * Reconectar preserva o refresh_token antigo quando o provider nao manda um
 * novo — Google so devolve refresh_token no primeiro consentimento, e
 * sobrescrever com null quebraria o sync silenciosamente.
 */
export async function persistIntegration(
  serviceClient: SupabaseClient,
  input: PersistInput,
): Promise<SanitizedIntegration> {
  const {
    clientId,
    provider,
    externalAccountId,
    externalAccountName = null,
    externalWorkspaceId = null,
    externalListId = null,
    accessToken = null,
    refreshToken = null,
    expiresInSeconds = null,
    expiresAt = null,
    metadata = {},
  } = input

  if (!clientId) throw new Error('persistIntegration: clientId obrigatorio')
  if (!externalAccountId) throw new Error('persistIntegration: externalAccountId obrigatorio')

  const tokenExpiresAt =
    expiresAt ??
    (expiresInSeconds != null
      ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
      : null)

  // Refresh token sobrevive a reconexao sem novo refresh_token.
  let effectiveRefreshToken = refreshToken
  if (!effectiveRefreshToken) {
    const { data: existing } = await serviceClient
      .from('client_integrations')
      .select('refresh_token')
      .eq('client_id', clientId)
      .eq('provider', provider)
      .eq('external_account_id', externalAccountId)
      .maybeSingle()
    const existingRow = existing as unknown as { refresh_token?: string | null } | null
    effectiveRefreshToken = existingRow?.refresh_token ?? null
  }

  const row = {
    client_id: clientId,
    provider,
    external_account_id: externalAccountId,
    external_account_name: externalAccountName,
    external_workspace_id: externalWorkspaceId,
    external_list_id: externalListId,
    access_token: accessToken,
    refresh_token: effectiveRefreshToken,
    token_expires_at: tokenExpiresAt,
    status: 'active' as const,
    last_error: null,
    metadata: { ...metadata, connected_at: new Date().toISOString() },
  }

  const { data, error } = await serviceClient
    .from('client_integrations')
    .upsert(row, { onConflict: 'client_id,provider,external_account_id' })
    .select(
      'id, client_id, provider, external_account_id, external_account_name, status, ' +
        'last_synced_at, token_expires_at, metadata, created_at, updated_at, ' +
        'access_token, refresh_token',
    )
    .single()

  if (error) throw new Error(`Falha ao gravar integracao: ${error.message}`)

  return sanitize(data as unknown as Record<string, unknown>)
}

/**
 * Remove os campos de credencial de uma linha de client_integrations,
 * trocando por booleanos derivados. Use SEMPRE antes de responder ao browser.
 */
export function sanitize(row: Record<string, unknown>): SanitizedIntegration {
  const { access_token, refresh_token, ...safe } = row
  return {
    ...(safe as Omit<SanitizedIntegration, 'has_access_token' | 'has_refresh_token'>),
    has_access_token: Boolean(access_token),
    has_refresh_token: Boolean(refresh_token),
  }
}

// =============================================================
// LER (server-side)
// =============================================================

export interface IntegrationCredentials {
  id: string
  clientId: string
  provider: Provider
  externalAccountId: string
  accessToken: string | null
  refreshToken: string | null
  tokenExpiresAt: string | null
  metadata: Record<string, unknown>
}

/**
 * Resolve as credenciais de um cliente+provider para uso server-side.
 * Nunca exponha o retorno disto numa resposta HTTP.
 */
export async function getIntegrationCredentials(
  serviceClient: SupabaseClient,
  clientId: string,
  provider: Provider,
): Promise<IntegrationCredentials | null> {
  const { data, error } = await serviceClient
    .from('client_integrations')
    .select(
      'id, client_id, provider, external_account_id, access_token, refresh_token, ' +
        'token_expires_at, metadata',
    )
    .eq('client_id', clientId)
    .eq('provider', provider)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  // O select vem como string; o supabase-js nao consegue inferir a forma da
  // linha, entao o shape e afirmado aqui, num ponto so.
  const row = data as unknown as Record<string, unknown>

  return {
    id: row.id as string,
    clientId: row.client_id as string,
    provider: row.provider as Provider,
    externalAccountId: row.external_account_id as string,
    accessToken: (row.access_token as string | null) ?? null,
    refreshToken: (row.refresh_token as string | null) ?? null,
    tokenExpiresAt: (row.token_expires_at as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }
}

/** Marca a integracao como quebrada, para a UI mostrar "reconectar". */
export async function markIntegrationError(
  serviceClient: SupabaseClient,
  integrationId: string,
  message: string,
): Promise<void> {
  await serviceClient
    .from('client_integrations')
    .update({ status: 'error', last_error: message.slice(0, 500) })
    .eq('id', integrationId)
}
