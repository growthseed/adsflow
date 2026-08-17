-- =============================================================
-- 038_deprecate_moai_portal.sql
-- =============================================================
-- O Portal MOAI foi descontinuado. Todo o codigo do portal saiu do
-- repositorio (rotas /moai, 17 modulos, hooks, snapshot builder,
-- webhook de CRM). O estado anterior esta na tag git archive/moai-portal.
--
-- Contexto do que ja estava quebrado antes da remocao: o front chamava
-- GET /api/sync/moai-snapshot, function que nao existia no deploy desde
-- 50d6deb (movida para src/server para caber no limite de 12 functions
-- do plano Hobby e nunca religada). O portal servia moaiMockSnapshot.ts.
--
-- Esta migration NAO derruba nada. Marca os objetos de banco do portal
-- como DEPRECATED para quem abrir o schema depois entender por que existe
-- um bloco de tabelas sem nenhum consumidor. O DROP fica para quando o
-- conteudo delas for conferido — pode haver historico do cliente ali, e
-- isso nao da para inspecionar a partir do repositorio.
--
-- Objetos alcancados (nome comecando com moai_/vw_moai_/get_moai_/_moai_):
--   032 — 5 views consolidadas (membros, nps, cohort, inadimplencia, conteudo)
--   033 — moai_user_access, moai_dashboard_visibility + RPCs de acesso
--   034 — observabilidade de sync (runs, steps, raw_records, quality checks)
--   035 — mart de reporting (member_profiles, paid_media_daily, snapshots)
--   036 — 8 RPCs de conteudo
--   20260620 — touchpoints + views de atribuicao/coorte
--
-- Idempotente. Usa catalogo do Postgres em vez de nomes fixos, entao nao
-- quebra se alguma assinatura de funcao tiver mudado.
-- =============================================================

DO $$
DECLARE
  r RECORD;
  v_tabelas INT := 0;
  v_views   INT := 0;
  v_funcs   INT := 0;
  c_nota CONSTANT TEXT :=
    'DEPRECATED (038). Portal MOAI descontinuado — nenhum consumidor no codigo. '
    'Codigo do portal na tag git archive/moai-portal. Conferir conteudo antes de derrubar.';
BEGIN
  -- Tabelas e views
  FOR r IN
    SELECT c.oid::regclass AS obj, c.relkind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind IN ('r', 'v', 'm')          -- table, view, matview
       AND (c.relname LIKE 'moai\_%' OR c.relname LIKE 'vw\_moai\_%')
  LOOP
    IF r.relkind = 'r' THEN
      EXECUTE format('COMMENT ON TABLE %s IS %L', r.obj, c_nota);
      v_tabelas := v_tabelas + 1;
    ELSIF r.relkind = 'm' THEN
      EXECUTE format('COMMENT ON MATERIALIZED VIEW %s IS %L', r.obj, c_nota);
      v_views := v_views + 1;
    ELSE
      EXECUTE format('COMMENT ON VIEW %s IS %L', r.obj, c_nota);
      v_views := v_views + 1;
    END IF;
  END LOOP;

  -- Funcoes / RPCs (regprocedure resolve a assinatura sozinho)
  FOR r IN
    SELECT p.oid::regprocedure AS obj
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND (p.proname LIKE '%\_moai\_%' OR p.proname LIKE 'moai\_%' OR p.proname LIKE '\_moai\_%')
  LOOP
    EXECUTE format('COMMENT ON FUNCTION %s IS %L', r.obj, c_nota);
    v_funcs := v_funcs + 1;
  END LOOP;

  RAISE NOTICE 'Marcados DEPRECATED: % tabelas, % views, % funcoes', v_tabelas, v_views, v_funcs;
END $$;

-- -----------------------------------------------------------
-- Integracoes que existiam so para alimentar o portal
-- -----------------------------------------------------------
-- clint e monday entraram em client_integrations (030/031) exclusivamente
-- como fontes do snapshot MOAI. Sem o portal, nao ha quem leia esses
-- tokens. Nao revogo automaticamente — apenas reporto, porque revogar
-- credencial de cliente e decisao de operacao, nao de migration.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT provider, status, count(*)::int AS total
      FROM public.client_integrations
     WHERE provider IN ('clint', 'monday')
     GROUP BY provider, status
     ORDER BY provider, status
  LOOP
    RAISE NOTICE 'client_integrations orfa do portal: provider=% status=% total=%',
      r.provider, r.status, r.total;
  END LOOP;
END $$;
