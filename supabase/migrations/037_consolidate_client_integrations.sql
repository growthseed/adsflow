-- =============================================================
-- 037_consolidate_client_integrations.sql
-- =============================================================
-- Consolida as tabelas de integração legadas (per-user) na tabela
-- unificada client_integrations (per-client), criada em 019.
--
-- Situação encontrada:
--   - src/server/**  (sync, portal MOAI, detail/compare)  -> client_integrations
--   - src/services/* (metaAdsService, googleAdsService,
--     googleAuthService, clickupAuthService, kommoAuthService) -> tabelas legadas
--
--   Ou seja: dois caminhos vivos lendo credenciais de lugares diferentes.
--
-- Esta migration NÃO derruba nada e NÃO altera o frontend. Ela:
--   1. Copia (backfill) as linhas legadas para client_integrations
--   2. Marca as tabelas legadas como DEPRECATED via COMMENT
--   3. Deixa registrado o que não pôde ser migrado (linhas sem client_id)
--
-- O corte do código para ler só de client_integrations e o DROP das
-- tabelas legadas ficam para uma migration posterior, depois que o
-- backfill for conferido em produção.
--
-- Idempotente: pode rodar mais de uma vez (ON CONFLICT DO NOTHING).
-- =============================================================

-- -----------------------------------------------------------
-- 0. PRÉ-CHECK — o que fica de fora
-- -----------------------------------------------------------
-- client_integrations.client_id é NOT NULL. As tabelas legadas permitem
-- client_id NULL (conta conectada por um usuário e nunca vinculada a um
-- cliente). Essas linhas NÃO têm para onde ir e são apenas reportadas.

DO $$
DECLARE
  v_orphans INT := 0;
  v_tmp INT;
BEGIN
  SELECT count(*) INTO v_tmp FROM public.ad_accounts WHERE client_id IS NULL;
  v_orphans := v_orphans + v_tmp;
  RAISE NOTICE 'ad_accounts sem client_id (nao migrados): %', v_tmp;

  SELECT count(*) INTO v_tmp FROM public.google_accounts WHERE client_id IS NULL;
  v_orphans := v_orphans + v_tmp;
  RAISE NOTICE 'google_accounts sem client_id (nao migrados): %', v_tmp;

  SELECT count(*) INTO v_tmp FROM public.clickup_configs WHERE client_id IS NULL;
  v_orphans := v_orphans + v_tmp;
  RAISE NOTICE 'clickup_configs sem client_id (nao migrados): %', v_tmp;

  SELECT count(*) INTO v_tmp FROM public.kommo_configs WHERE client_id IS NULL;
  v_orphans := v_orphans + v_tmp;
  RAISE NOTICE 'kommo_configs sem client_id (nao migrados): %', v_tmp;

  RAISE NOTICE 'TOTAL de linhas legadas orfas (sem client_id): %', v_orphans;
END $$;

-- -----------------------------------------------------------
-- 1. ad_accounts -> client_integrations  (meta_ads, google_ads)
-- -----------------------------------------------------------
-- A UNIQUE de destino é (client_id, provider, external_account_id), enquanto
-- a de origem é (user_id, platform, account_id). Dois usuários com a mesma
-- conta do mesmo cliente colapsam em uma linha só — o DISTINCT ON escolhe
-- deterministicamente a melhor candidata: com token, ativa, mais recente.

INSERT INTO public.client_integrations (
  client_id, provider, external_account_id, external_account_name,
  access_token, refresh_token, token_expires_at,
  status, last_synced_at, last_error, metadata
)
SELECT DISTINCT ON (a.client_id, a.platform, a.account_id)
  a.client_id,
  a.platform,
  a.account_id,
  a.account_name,
  a.access_token,
  a.refresh_token,
  a.token_expires_at,
  -- 'paused'/'disconnected' não existem no CHECK de client_integrations
  CASE a.status
    WHEN 'active' THEN 'active'
    WHEN 'error'  THEN 'error'
    ELSE 'revoked'
  END,
  a.last_sync_at,
  a.sync_error,
  COALESCE(a.metadata, '{}'::jsonb) || jsonb_build_object(
    'migrated_from', 'ad_accounts',
    'legacy_id', a.id,
    'legacy_user_id', a.user_id,
    'legacy_status', a.status,
    'currency', a.currency,
    'timezone', a.timezone
  )
FROM public.ad_accounts a
WHERE a.client_id IS NOT NULL
ORDER BY
  a.client_id, a.platform, a.account_id,
  (a.access_token IS NOT NULL) DESC,
  (a.status = 'active') DESC,
  a.updated_at DESC
ON CONFLICT (client_id, provider, external_account_id) DO NOTHING;

-- -----------------------------------------------------------
-- 2. google_accounts -> client_integrations
-- -----------------------------------------------------------
-- 'ga4' é o nome legado da mesma coisa que client_integrations chama
-- de 'google_analytics'. 'google_ads' e 'search_console' batem direto.
-- scopes[] não tem coluna equivalente e vai para metadata.

INSERT INTO public.client_integrations (
  client_id, provider, external_account_id, external_account_name,
  access_token, refresh_token, token_expires_at,
  status, last_synced_at, last_error, metadata
)
SELECT DISTINCT ON (g.client_id, mapped.provider, g.account_id)
  g.client_id,
  mapped.provider,
  g.account_id,
  g.account_name,
  g.access_token,
  g.refresh_token,
  g.token_expires_at,
  CASE g.status
    WHEN 'active' THEN 'active'
    WHEN 'error'  THEN 'error'
    ELSE 'revoked'
  END,
  g.last_sync_at,
  g.sync_error,
  jsonb_build_object(
    'migrated_from', 'google_accounts',
    'legacy_id', g.id,
    'legacy_user_id', g.user_id,
    'legacy_platform', g.platform,
    'legacy_status', g.status,
    'scopes', COALESCE(to_jsonb(g.scopes), '[]'::jsonb)
  )
FROM public.google_accounts g
CROSS JOIN LATERAL (
  SELECT CASE g.platform
    WHEN 'ga4' THEN 'google_analytics'
    ELSE g.platform
  END AS provider
) mapped
WHERE g.client_id IS NOT NULL
ORDER BY
  g.client_id, mapped.provider, g.account_id,
  (g.access_token IS NOT NULL) DESC,
  (g.refresh_token IS NOT NULL) DESC,
  (g.status = 'active') DESC,
  g.updated_at DESC
ON CONFLICT (client_id, provider, external_account_id) DO NOTHING;

-- -----------------------------------------------------------
-- 3. clickup_configs -> client_integrations  (clickup)
-- -----------------------------------------------------------
-- Não há account_id: a identidade externa do ClickUp é o team_id.
-- api_token é um token estático (não OAuth) e ocupa access_token.

INSERT INTO public.client_integrations (
  client_id, provider, external_account_id, external_account_name,
  external_workspace_id, access_token,
  status, last_synced_at, metadata
)
SELECT DISTINCT ON (c.client_id, c.team_id)
  c.client_id,
  'clickup',
  c.team_id,
  NULLIF(c.team_name, ''),
  c.team_id,
  c.api_token,
  CASE c.status
    WHEN 'active' THEN 'active'
    WHEN 'error'  THEN 'error'
    ELSE 'revoked'
  END,
  c.last_sync_at,
  jsonb_build_object(
    'migrated_from', 'clickup_configs',
    'legacy_id', c.id,
    'legacy_user_id', c.user_id,
    'legacy_status', c.status,
    'team_id', c.team_id,
    'team_name', c.team_name
  )
FROM public.clickup_configs c
WHERE c.client_id IS NOT NULL
ORDER BY
  c.client_id, c.team_id,
  (c.status = 'active') DESC,
  c.updated_at DESC
ON CONFLICT (client_id, provider, external_account_id) DO NOTHING;

-- -----------------------------------------------------------
-- 4. kommo_configs -> client_integrations  (kommo)
-- -----------------------------------------------------------
-- A identidade externa do Kommo é o subdomínio da conta.
-- pipeline_ids[] vai para metadata (é configuração, não credencial).

INSERT INTO public.client_integrations (
  client_id, provider, external_account_id, external_account_name,
  access_token, status, last_synced_at, metadata
)
SELECT DISTINCT ON (k.client_id, k.subdomain)
  k.client_id,
  'kommo',
  k.subdomain,
  k.subdomain,
  k.api_token,
  CASE k.status
    WHEN 'active' THEN 'active'
    WHEN 'error'  THEN 'error'
    ELSE 'revoked'
  END,
  k.last_sync_at,
  jsonb_build_object(
    'migrated_from', 'kommo_configs',
    'legacy_id', k.id,
    'legacy_user_id', k.user_id,
    'legacy_status', k.status,
    'subdomain', k.subdomain,
    'pipeline_ids', COALESCE(to_jsonb(k.pipeline_ids), '[]'::jsonb)
  )
FROM public.kommo_configs k
WHERE k.client_id IS NOT NULL
ORDER BY
  k.client_id, k.subdomain,
  (k.status = 'active') DESC,
  k.updated_at DESC
ON CONFLICT (client_id, provider, external_account_id) DO NOTHING;

-- -----------------------------------------------------------
-- 5. DEPRECAÇÃO — marca, não derruba
-- -----------------------------------------------------------
-- As tabelas continuam servindo o código atual em src/services/*.
-- O DROP só depois que esses services passarem a ler de
-- client_integrations (fase 2).

COMMENT ON TABLE public.ad_accounts IS
  'DEPRECATED (037). Substituida por client_integrations (providers meta_ads/google_ads). Ainda lida por src/services/metaAdsService.ts. Nao adicionar colunas novas aqui.';

COMMENT ON TABLE public.google_accounts IS
  'DEPRECATED (037). Substituida por client_integrations (google_ads/google_analytics/search_console). Ainda lida por src/services/googleAuthService.ts e googleAdsService.ts. Nao adicionar colunas novas aqui.';

COMMENT ON TABLE public.clickup_configs IS
  'DEPRECATED (037). Substituida por client_integrations (provider clickup). Ainda lida por src/services/clickupAuthService.ts. Nao adicionar colunas novas aqui.';

COMMENT ON TABLE public.kommo_configs IS
  'DEPRECATED (037). Substituida por client_integrations (provider kommo). Ainda lida por src/services/kommoAuthService.ts e server/sync/kommoSync.ts. Nao adicionar colunas novas aqui.';

-- Tabelas de 010_conversion_truth.sql: criadas e nunca usadas. Nenhuma linha
-- de codigo do projeto le ou escreve nelas. Marcadas para revisao, nao
-- derrubadas — pode haver escrita por integracao externa (n8n/webhook)
-- invisivel a partir do repositorio.

COMMENT ON TABLE public.lead_attribution IS
  'DEPRECATED (037). Sem nenhuma referencia no codigo do projeto. Conferir se algum processo externo (n8n/webhook) escreve aqui antes de derrubar.';

COMMENT ON TABLE public.platform_conversions IS
  'DEPRECATED (037). Sem nenhuma referencia no codigo do projeto. Conferir se algum processo externo (n8n/webhook) escreve aqui antes de derrubar.';

-- -----------------------------------------------------------
-- 6. RELATÓRIO PÓS-BACKFILL
-- -----------------------------------------------------------

DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '--- client_integrations por provider (pos-backfill) ---';
  FOR r IN
    SELECT provider,
           count(*) AS total,
           count(*) FILTER (WHERE metadata ? 'migrated_from') AS migradas
    FROM public.client_integrations
    GROUP BY provider
    ORDER BY provider
  LOOP
    RAISE NOTICE 'provider=% total=% migradas_de_legado=%', r.provider, r.total, r.migradas;
  END LOOP;
END $$;
