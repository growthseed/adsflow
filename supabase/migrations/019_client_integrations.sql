-- =============================================================
-- 019_client_integrations.sql
-- =============================================================
-- Replaces the hardcoded AGENCY_CLIENTS map + frontend-supplied
-- access_tokens with a proper multi-tenant integration table.
--
-- After this migration ships, the flow becomes:
--   1. User OAuths with Meta/Google/LinkedIn from the app
--   2. App POSTs the resulting tokens to a secured edge function
--      that encrypts and stores them in client_integrations
--   3. The serverless proxies (api/google-ads, api/linkedin-proxy,
--      api/sync/*) read tokens from this table via service role,
--      NEVER from the request body
--
-- This closes the external audit findings:
--   - "access_token trafegando pelo frontend" (CRÍTICO)
--   - "mapeamento hardcoded AGENCY_CLIENTS" (ALTO)
--
-- =============================================================

-- -----------------------------------------------------------
-- 1. TABLE
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  -- Provider identifiers. Keep flexible — new platforms land here.
  provider TEXT NOT NULL CHECK (provider IN (
    'google_ads',
    'meta_ads',
    'google_analytics',
    'search_console',
    'google_my_business',
    'youtube',
    'linkedin',
    'clickup',
    'tiktok_ads'
  )),

  -- Account/list/property identifiers owned by the provider
  external_account_id TEXT NOT NULL,      -- e.g. "act_12345", customer_id, channel_id
  external_account_name TEXT,             -- human-readable label for the UI
  external_workspace_id TEXT,             -- optional extra scope (team, workspace)
  external_list_id TEXT,                  -- optional extra scope (clickup list)

  -- Credentials (encrypted client-side OR via pgcrypto server-side in a later migration)
  -- For MVP we store them raw BUT the column is not selectable by anon/authenticated
  -- RLS — only service role can read them.
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Status / metadata
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired', 'error')),
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One active integration per (client, provider, external_account_id)
  UNIQUE (client_id, provider, external_account_id)
);

CREATE INDEX IF NOT EXISTS idx_client_integrations_client
  ON public.client_integrations (client_id);
CREATE INDEX IF NOT EXISTS idx_client_integrations_provider
  ON public.client_integrations (provider);
CREATE INDEX IF NOT EXISTS idx_client_integrations_status
  ON public.client_integrations (status) WHERE status = 'active';

-- -----------------------------------------------------------
-- 2. UPDATED_AT TRIGGER
-- -----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_client_integrations_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_integrations_touch ON public.client_integrations;
CREATE TRIGGER trg_client_integrations_touch
  BEFORE UPDATE ON public.client_integrations
  FOR EACH ROW EXECUTE FUNCTION public.tg_client_integrations_touch_updated_at();

-- -----------------------------------------------------------
-- 3. RLS
-- -----------------------------------------------------------
-- Raw tokens are NEVER readable by end users. Service role only.
-- Members of the client can see sanitized rows (no token columns) via
-- a dedicated view.

ALTER TABLE public.client_integrations ENABLE ROW LEVEL SECURITY;

-- Deny-all default. Service role bypasses RLS, so server code still works.
DROP POLICY IF EXISTS "client_integrations_deny_all" ON public.client_integrations;
CREATE POLICY "client_integrations_deny_all"
  ON public.client_integrations
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- -----------------------------------------------------------
-- 4. SANITIZED VIEW (safe for frontend reads)
-- -----------------------------------------------------------

CREATE OR REPLACE VIEW public.client_integrations_public AS
SELECT
  ci.id,
  ci.client_id,
  ci.provider,
  ci.external_account_id,
  ci.external_account_name,
  ci.status,
  ci.last_synced_at,
  ci.last_error,
  ci.metadata,
  ci.created_at,
  ci.updated_at,
  -- derived booleans only, never the actual token
  (ci.access_token IS NOT NULL) AS has_access_token,
  (ci.refresh_token IS NOT NULL) AS has_refresh_token,
  (ci.token_expires_at IS NOT NULL AND ci.token_expires_at < now()) AS is_expired
FROM public.client_integrations ci
WHERE
  -- Members of the client can see their own integrations
  ci.client_id IN (
    SELECT client_id FROM public.client_members WHERE user_id = auth.uid()
  )
  -- Super admins see everything
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );

GRANT SELECT ON public.client_integrations_public TO authenticated;

-- -----------------------------------------------------------
-- 5. HELPER RPC — resolve integration for server-side use
-- -----------------------------------------------------------
-- Used by api/_lib/integrations.ts to look up a token for a given
-- client_slug + provider. SECURITY DEFINER because it needs to see
-- the raw token, but it's only callable by service role (we revoke
-- from public/authenticated below).

CREATE OR REPLACE FUNCTION public.get_client_integration(
  p_client_slug TEXT,
  p_provider TEXT
) RETURNS TABLE (
  id UUID,
  client_id UUID,
  provider TEXT,
  external_account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
  SELECT
    ci.id,
    ci.client_id,
    ci.provider,
    ci.external_account_id,
    ci.access_token,
    ci.refresh_token,
    ci.token_expires_at,
    ci.metadata
  FROM public.client_integrations ci
  INNER JOIN public.clients c ON c.id = ci.client_id
  WHERE c.slug = p_client_slug
    AND ci.provider = p_provider
    AND ci.status = 'active'
  ORDER BY ci.updated_at DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Lock it down — only service_role can call this.
REVOKE EXECUTE ON FUNCTION public.get_client_integration(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_client_integration(TEXT, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_client_integration(TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_client_integration(TEXT, TEXT) TO service_role;

-- -----------------------------------------------------------
-- 6. COMMENTS
-- -----------------------------------------------------------

COMMENT ON TABLE public.client_integrations IS
  'Per-client OAuth credentials and external account mappings. Replaces the hardcoded AGENCY_CLIENTS map. Raw tokens protected by deny-all RLS; server code uses service role + get_client_integration() RPC.';

COMMENT ON VIEW public.client_integrations_public IS
  'Sanitized view of client_integrations — exposes has_access_token booleans but never the actual token values. Safe for frontend SELECT.';

COMMENT ON FUNCTION public.get_client_integration(TEXT, TEXT) IS
  'Server-side only (service_role). Resolves the active integration for a client_slug+provider pair and returns the raw tokens. Call from api/_lib/integrations.ts.';
