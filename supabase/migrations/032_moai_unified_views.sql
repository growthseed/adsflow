-- ============================================================
-- Migration 032 — MOAI Unified Views (cross-source blend)
-- ============================================================
-- Cinco views que cruzam Clint (CRM sales) × Monday (ops 360°) × Meta Ads.
-- Específicas pro projeto MOAI por enquanto, mas o padrão (jsonb_array_elements
-- + LATERAL) serve de template pra outros clientes que adotarem Monday.
--
-- IMPORTANTE: views consultam monday_boards_snapshot (cache) NÃO a API live.
-- Refresh do snapshot é responsabilidade da Edge Function `monday-sync`.
-- ============================================================

-- ============================================================
-- VIEW 1: vw_moai_membros_por_mentor
-- ============================================================
-- Cruza Clint contacts × Monday Carteiras por mentor.
-- Resolve o gap "Clint sem owner_id confiável" — atribui mentor real
-- baseado em match de email/nome com as 6 Carteiras (Vilker/Vini/Ale/Luma/Yas/Marcos).
--
-- Saída por linha: 1 membro × 1 mentor (se um mesmo email aparecer em duas
-- carteiras, vira 2 linhas — esperado, sinaliza mudança de mentor histórica).
-- ============================================================

CREATE OR REPLACE VIEW public.vw_moai_membros_por_mentor AS
WITH carteiras_monday AS (
  SELECT
    s.client_id,
    s.board_name,
    -- detecta mentor pelo nome do board
    CASE
      WHEN s.board_name ILIKE '%vilker%'   THEN 'Vilker'
      WHEN s.board_name ILIKE '%vini%'     THEN 'Vini'
      WHEN s.board_name ILIKE '%marcos%'   THEN 'Marcos'
      WHEN s.board_name ILIKE '%luma%'     THEN 'Luma'
      WHEN s.board_name ILIKE '%yas%'      THEN 'Yas'
      WHEN s.board_name ILIKE 'carteira ale%' OR s.board_name ILIKE '%(ale)%' THEN 'Ale'
      WHEN s.board_name ILIKE '%high end%' THEN 'High End'
      WHEN s.board_name ILIKE '%alavanca%' THEN 'Alavanca'
      ELSE NULL
    END AS mentor,
    s.fetched_at,
    item
  FROM public.monday_boards_snapshot s,
       LATERAL jsonb_array_elements(s.items) AS item
  WHERE s.board_name ILIKE '%carteira%'
),
carteiras_norm AS (
  SELECT
    client_id,
    mentor,
    item->>'id'    AS membro_monday_id,
    item->>'name'  AS membro_nome,
    -- extrai email de column_values (procura pela coluna com type='email' ou title='email')
    (
      SELECT cv->>'text'
      FROM jsonb_array_elements(item->'column_values') cv
      WHERE LOWER(COALESCE(cv->>'title','')) LIKE '%email%'
         OR LOWER(COALESCE(cv->>'type','')) = 'email'
      LIMIT 1
    ) AS email,
    -- extrai telefone
    (
      SELECT cv->>'text'
      FROM jsonb_array_elements(item->'column_values') cv
      WHERE LOWER(COALESCE(cv->>'title','')) ~ 'telefone|celular|whatsapp|phone'
      LIMIT 1
    ) AS telefone,
    -- extrai CNPJ
    (
      SELECT cv->>'text'
      FROM jsonb_array_elements(item->'column_values') cv
      WHERE LOWER(COALESCE(cv->>'title','')) LIKE '%cnpj%'
      LIMIT 1
    ) AS cnpj,
    -- extrai estágio/status
    (
      SELECT cv->>'text'
      FROM jsonb_array_elements(item->'column_values') cv
      WHERE LOWER(COALESCE(cv->>'title','')) ~ 'status|est[aá]gio|fase'
      LIMIT 1
    ) AS estagio,
    fetched_at
  FROM carteiras_monday
  WHERE mentor IS NOT NULL
)
SELECT
  cn.client_id,
  cn.mentor,
  cn.membro_monday_id,
  cn.membro_nome,
  LOWER(TRIM(cn.email)) AS email_normalizado,
  cn.telefone,
  cn.cnpj,
  cn.estagio,
  -- cross com crm_deals (Clint) — match por email
  d.id              AS deal_clint_id,
  d.value           AS valor_deal,
  d.is_won          AS deal_won,
  d.is_lost         AS deal_lost,
  d.stage_name      AS stage_clint,
  cn.fetched_at
FROM carteiras_norm cn
LEFT JOIN public.crm_deals d
  ON d.client_id = cn.client_id
  AND LOWER(TRIM(d.email_contact)) = LOWER(TRIM(cn.email))
  AND cn.email IS NOT NULL
;

COMMENT ON VIEW public.vw_moai_membros_por_mentor IS
  'Cruza Carteiras Monday × Clint deals via email. Resolve owner_id gap do Clint.';


-- ============================================================
-- VIEW 2: vw_moai_nps_consolidado
-- ============================================================
-- Agrega respostas NPS de Conselhos + Alavanca + Turn Lab num único dataset.
-- Classifica em promotor (9-10) / neutro (7-8) / detrator (0-6).
-- ============================================================

CREATE OR REPLACE VIEW public.vw_moai_nps_consolidado AS
WITH nps_raw AS (
  SELECT
    s.client_id,
    s.board_name,
    CASE
      WHEN s.board_name ILIKE '%conselho%' THEN 'conselho'
      WHEN s.board_name ILIKE '%alavanca%' THEN 'alavanca'
      WHEN s.board_name ILIKE '%feedback%' THEN 'evento'
      ELSE 'turn_lab'
    END AS tipo,
    item
  FROM public.monday_boards_snapshot s,
       LATERAL jsonb_array_elements(s.items) AS item
  WHERE s.board_name ILIKE '%nps%' OR s.board_name ILIKE '%feedback%'
)
SELECT
  client_id,
  tipo,
  board_name,
  item->>'id' AS resposta_id,
  item->>'name' AS membro_nome,
  -- score numérico
  (
    SELECT (cv->>'text')::numeric
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'nps|nota|score|avalia'
      AND (cv->>'text') ~ '^[0-9]+([,.][0-9]+)?$'
    LIMIT 1
  ) AS nps_score,
  -- mentor responsável
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'mentor|respons[aá]vel|closer'
    LIMIT 1
  ) AS mentor,
  -- comentário livre
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'coment|feedback|observa'
    LIMIT 1
  ) AS comentario,
  -- conselho/turma
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'conselho|turma|grupo'
    LIMIT 1
  ) AS conselho_nome,
  -- data
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'data|criado|recebido'
    LIMIT 1
  ) AS data_resposta,
  -- classificação NPS
  CASE
    WHEN (
      SELECT (cv->>'text')::numeric
      FROM jsonb_array_elements(item->'column_values') cv
      WHERE LOWER(COALESCE(cv->>'title','')) ~ 'nps|nota|score'
        AND (cv->>'text') ~ '^[0-9]+([,.][0-9]+)?$'
      LIMIT 1
    ) >= 9 THEN 'promotor'
    WHEN (
      SELECT (cv->>'text')::numeric
      FROM jsonb_array_elements(item->'column_values') cv
      WHERE LOWER(COALESCE(cv->>'title','')) ~ 'nps|nota|score'
        AND (cv->>'text') ~ '^[0-9]+([,.][0-9]+)?$'
      LIMIT 1
    ) >= 7 THEN 'neutro'
    ELSE 'detrator'
  END AS classificacao
FROM nps_raw
;

COMMENT ON VIEW public.vw_moai_nps_consolidado IS
  'Respostas NPS unificadas: Conselhos Estratégicos + Alavanca + Turn Lab + Eventos.';


-- ============================================================
-- VIEW 3: vw_moai_cohort_temporal
-- ============================================================
-- Matrix Mês entrada × Mês fechamento → Win Rate %.
-- Padrão MidiaHub "Tempo" — revela tempo médio de cohort.
-- Usa crm_deals (Clint).
-- ============================================================

CREATE OR REPLACE VIEW public.vw_moai_cohort_temporal AS
SELECT
  d.client_id,
  TO_CHAR(d.created_at, 'YYYY-MM') AS mes_entrada,
  TO_CHAR(d.closed_at,  'YYYY-MM') AS mes_fechamento,
  COUNT(*)                          AS total_deals,
  COUNT(*) FILTER (WHERE d.is_won)  AS qtd_vendas,
  COUNT(*) FILTER (WHERE d.is_lost) AS qtd_perdas,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE d.is_won) / NULLIF(COUNT(*), 0),
    2
  ) AS win_rate_pct,
  SUM(d.value) FILTER (WHERE d.is_won) AS receita_total,
  AVG(EXTRACT(DAY FROM (d.closed_at - d.created_at))) FILTER (WHERE d.is_won) AS tempo_medio_dias
FROM public.crm_deals d
WHERE d.created_at IS NOT NULL
  AND d.closed_at IS NOT NULL
  AND d.closed_at >= d.created_at
GROUP BY d.client_id, mes_entrada, mes_fechamento
;

COMMENT ON VIEW public.vw_moai_cohort_temporal IS
  'Cohort matrix: deals entrados em mês X × fechados em mês Y. Win Rate + tempo médio.';


-- ============================================================
-- VIEW 4: vw_moai_inadimplencia_consolidada
-- ============================================================
-- Consolida Inadimplências + Churn + Solicitações Pagamento do Monday.
-- ============================================================

CREATE OR REPLACE VIEW public.vw_moai_inadimplencia_consolidada AS
WITH inadimp_raw AS (
  SELECT
    s.client_id,
    s.board_name,
    CASE
      WHEN s.board_name ILIKE '%inadimpl%' THEN 'inadimplencia'
      WHEN s.board_name ILIKE '%churn%'    THEN 'churn'
      WHEN s.board_name ILIKE '%pagamento%' THEN 'pagamento'
      WHEN s.board_name ILIKE '%congelamento%' THEN 'congelamento'
      ELSE 'outro_financeiro'
    END AS tipo,
    item
  FROM public.monday_boards_snapshot s,
       LATERAL jsonb_array_elements(s.items) AS item
  WHERE s.board_name ILIKE '%inadimpl%'
     OR s.board_name ILIKE '%churn%'
     OR s.board_name ILIKE '%pagamento%'
     OR s.board_name ILIKE '%congelamento%'
)
SELECT
  client_id,
  tipo,
  board_name,
  item->>'id' AS item_id,
  item->>'name' AS membro_nome,
  -- valor
  (
    SELECT REGEXP_REPLACE((cv->>'text'), '[^0-9.,]', '', 'g')::numeric
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'valor|amount|r\$|price'
      AND (cv->>'text') IS NOT NULL
    LIMIT 1
  ) AS valor,
  -- dias atraso
  (
    SELECT (REGEXP_REPLACE((cv->>'text'), '[^0-9]', '', 'g'))::int
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'dias|atraso'
      AND (cv->>'text') ~ '[0-9]'
    LIMIT 1
  ) AS dias_atraso,
  -- mentor responsável
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'mentor|respons[aá]vel|closer'
    LIMIT 1
  ) AS mentor_responsavel,
  -- status
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'status|situa'
    LIMIT 1
  ) AS status,
  -- vencimento
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'vencimento|due|venc'
    LIMIT 1
  ) AS vencimento,
  -- motivo
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'motivo|raz[aã]o|observa'
    LIMIT 1
  ) AS motivo
FROM inadimp_raw
;

COMMENT ON VIEW public.vw_moai_inadimplencia_consolidada IS
  'Financeiro consolidado: Inadimplências (2.8k) + Churn (162) + Pagamentos (641) + Congelamento.';


-- ============================================================
-- VIEW 5: vw_moai_cronograma_conteudo
-- ============================================================
-- Cronograma Comunidade + Cronograma Instagram + Redes Sociais MOAI + Founder Led.
-- ============================================================

CREATE OR REPLACE VIEW public.vw_moai_cronograma_conteudo AS
WITH conteudo_raw AS (
  SELECT
    s.client_id,
    s.board_name,
    CASE
      WHEN s.board_name ILIKE '%instagram%' OR s.board_name ILIKE '%ig %' THEN 'instagram'
      WHEN s.board_name ILIKE '%founder%' THEN 'founder_led'
      WHEN s.board_name ILIKE '%newsletter%' THEN 'newsletter'
      WHEN s.board_name ILIKE '%redes sociais%' THEN 'multi'
      ELSE 'comunidade'
    END AS canal_default,
    item
  FROM public.monday_boards_snapshot s,
       LATERAL jsonb_array_elements(s.items) AS item
  WHERE s.board_name ILIKE '%cronograma%'
     OR s.board_name ILIKE '%redes sociais%'
     OR s.board_name ILIKE '%founder%'
     OR s.board_name ILIKE '%calend%conte%'
)
SELECT
  client_id,
  canal_default,
  board_name,
  item->>'id' AS item_id,
  item->>'name' AS titulo,
  -- canal explícito (sobrepõe default)
  COALESCE(
    (
      SELECT cv->>'text'
      FROM jsonb_array_elements(item->'column_values') cv
      WHERE LOWER(COALESCE(cv->>'title','')) ~ 'canal|plataforma|rede'
      LIMIT 1
    ),
    canal_default
  ) AS canal,
  -- tipo (post, reel, story, carousel)
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'tipo|formato'
    LIMIT 1
  ) AS tipo,
  -- status
  LOWER(
    (
      SELECT cv->>'text'
      FROM jsonb_array_elements(item->'column_values') cv
      WHERE LOWER(COALESCE(cv->>'title','')) ~ 'status|fase'
      LIMIT 1
    )
  ) AS status_raw,
  -- responsável
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'respons[aá]vel|owner'
    LIMIT 1
  ) AS responsavel,
  -- data publicação
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'data|publica[cç]'
    LIMIT 1
  ) AS data_publicacao,
  -- tema
  (
    SELECT cv->>'text'
    FROM jsonb_array_elements(item->'column_values') cv
    WHERE LOWER(COALESCE(cv->>'title','')) ~ 'tema|pauta|assunto'
    LIMIT 1
  ) AS tema
FROM conteudo_raw
;

COMMENT ON VIEW public.vw_moai_cronograma_conteudo IS
  'Cronograma de conteúdo consolidado: Comunidade (406) + IG (277) + Redes Sociais (633) + Founder Led.';


-- ============================================================
-- ÍNDICES auxiliares (GIN no jsonb facilita as buscas das views)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_monday_snapshot_items_gin
  ON public.monday_boards_snapshot USING GIN (items);

CREATE INDEX IF NOT EXISTS idx_monday_snapshot_board_name_lower
  ON public.monday_boards_snapshot (LOWER(board_name));
