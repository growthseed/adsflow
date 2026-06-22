-- ============================================================
-- Migration 036 — MOAI Conteúdo RPCs
-- ============================================================
-- 6 funções consumidas pelo módulo /moai/conteudo.
-- Fonte de dados: monday_boards_snapshot (cache de boards de
-- cronograma do Monday.com — Comunidade, Instagram, Redes Sociais).
--
-- Todas as funções são SECURITY DEFINER pra contornar RLS em dev.
-- ============================================================

-- ============================================================
-- HELPER: extrai coluna de column_values por título parcial
-- ============================================================
CREATE OR REPLACE FUNCTION public._moai_cv(
  item jsonb,
  title_pattern text
) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT cv->>'text'
  FROM jsonb_array_elements(item->'column_values') cv
  WHERE LOWER(COALESCE(cv->>'title', '')) LIKE '%' || LOWER(title_pattern) || '%'
  LIMIT 1;
$$;

-- ============================================================
-- HELPER: normaliza status Monday → status_norm interno
-- ============================================================
CREATE OR REPLACE FUNCTION public._moai_status_norm(raw text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN LOWER(raw) IN ('publicado', 'publicada', 'posted', 'published', 'ao vivo', 'live') THEN 'publicado'
    WHEN LOWER(raw) IN ('aprovado', 'aprovada', 'approved', 'revisado') THEN 'aprovado'
    WHEN LOWER(raw) IN ('em produção', 'em producao', 'in production', 'gravando', 'editando', 'gravação') THEN 'em_producao'
    WHEN LOWER(raw) IN ('pausado', 'pausada', 'paused', 'suspenso', 'on hold') THEN 'pausado'
    ELSE 'planejado'
  END;
$$;

-- ============================================================
-- BASE CTE: extrai itens de boards de conteúdo
-- (usar em cada função pra evitar repetição)
-- ============================================================
-- Boards identificados por nome:
--   • Cronograma Comunidade
--   • Cronograma Instagram
--   • Redes Sociais MOAI
-- ============================================================

-- ============================================================
-- FUNÇÃO 1: get_moai_conteudo_lista
-- ============================================================
-- Retorna itens individuais, com filtros opcionais de canal/status/busca.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_moai_conteudo_lista(
  p_canal   text    DEFAULT NULL,
  p_status  text    DEFAULT NULL,
  p_search  text    DEFAULT NULL,
  p_limit   integer DEFAULT 200
)
RETURNS TABLE (
  item_id      text,
  titulo       text,
  canal        text,
  editoria     text,
  formato      text,
  status       text,
  status_norm  text,
  responsavel  text,
  data_post    text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH boards AS (
    SELECT
      s.board_name AS canal,
      item
    FROM public.monday_boards_snapshot s,
         LATERAL jsonb_array_elements(s.items) AS item
    WHERE s.board_name ILIKE '%cronograma%'
       OR s.board_name ILIKE '%redes sociais moai%'
  ),
  itens AS (
    SELECT
      item->>'id'                                       AS item_id,
      COALESCE(item->>'name', '(sem título)')           AS titulo,
      canal,
      public._moai_cv(item, 'editoria')                 AS editoria,
      public._moai_cv(item, 'formato')                  AS formato,
      public._moai_cv(item, 'status')                   AS raw_status,
      public._moai_status_norm(public._moai_cv(item, 'status')) AS status_norm,
      COALESCE(
        public._moai_cv(item, 'responsável'),
        public._moai_cv(item, 'responsavel'),
        public._moai_cv(item, 'person')
      )                                                  AS responsavel,
      COALESCE(
        public._moai_cv(item, 'data de postagem'),
        public._moai_cv(item, 'data post'),
        public._moai_cv(item, 'data'),
        public._moai_cv(item, 'date')
      )                                                  AS data_post
    FROM boards
  )
  SELECT
    item_id,
    titulo,
    canal,
    editoria,
    formato,
    raw_status AS status,
    status_norm,
    responsavel,
    data_post
  FROM itens
  WHERE (p_canal   IS NULL OR canal       = p_canal)
    AND (p_status  IS NULL OR status_norm = p_status)
    AND (p_search  IS NULL OR p_search = ''
         OR titulo      ILIKE '%' || p_search || '%'
         OR editoria    ILIKE '%' || p_search || '%'
         OR responsavel ILIKE '%' || p_search || '%')
  ORDER BY data_post DESC NULLS LAST, titulo
  LIMIT p_limit;
$$;

-- ============================================================
-- FUNÇÃO 2: get_moai_conteudo_resumo
-- ============================================================
-- KPIs do período (atual + comparativo opcional).
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_moai_conteudo_resumo(
  p_start_date   date    DEFAULT NULL,
  p_end_date     date    DEFAULT NULL,
  p_compare_start date   DEFAULT NULL,
  p_compare_end   date   DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH base AS (
    SELECT
      public._moai_status_norm(public._moai_cv(item, 'status')) AS status_norm,
      public._moai_cv(item, 'editoria')                         AS editoria,
      public._moai_cv(item, 'responsável')                      AS responsavel,
      canal,
      COALESCE(
        public._moai_cv(item, 'data de postagem'),
        public._moai_cv(item, 'data post'),
        public._moai_cv(item, 'data')
      )                                                          AS data_post
    FROM (
      SELECT s.board_name AS canal, item
      FROM public.monday_boards_snapshot s,
           LATERAL jsonb_array_elements(s.items) AS item
      WHERE s.board_name ILIKE '%cronograma%'
         OR s.board_name ILIKE '%redes sociais moai%'
    ) boards
  ),
  -- filtro por período (se fornecido)
  atual AS (
    SELECT *
    FROM base
    WHERE (
      p_start_date IS NULL OR p_end_date IS NULL
      OR (
        data_post IS NOT NULL
        AND data_post::date BETWEEN p_start_date AND p_end_date
      )
    )
  ),
  comp AS (
    SELECT *
    FROM base
    WHERE p_compare_start IS NOT NULL AND p_compare_end IS NOT NULL
      AND data_post IS NOT NULL
      AND data_post::date BETWEEN p_compare_start AND p_compare_end
  ),
  atual_agg AS (
    SELECT
      COUNT(*)                                              AS total,
      COUNT(*) FILTER (WHERE status_norm = 'publicado')   AS publicados,
      COUNT(*) FILTER (WHERE status_norm = 'planejado')   AS planejados,
      COUNT(*) FILTER (WHERE status_norm = 'aprovado')    AS aprovados,
      COUNT(*) FILTER (WHERE status_norm = 'em_producao') AS em_producao,
      COUNT(*) FILTER (WHERE status_norm = 'pausado')     AS pausados,
      COUNT(DISTINCT canal)                                AS canais_distintos,
      COUNT(DISTINCT editoria)                             AS editorias_distintas,
      COUNT(DISTINCT responsavel)                          AS responsaveis_distintos
    FROM atual
  ),
  comp_agg AS (
    SELECT
      COUNT(*)                                              AS total,
      COUNT(*) FILTER (WHERE status_norm = 'publicado')   AS publicados
    FROM comp
  )
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object(
      'start', COALESCE(p_start_date::text, ''),
      'end',   COALESCE(p_end_date::text, '')
    ),
    'atual', jsonb_build_object(
      'total',                  a.total,
      'publicados',             a.publicados,
      'planejados',             a.planejados,
      'aprovados',              a.aprovados,
      'em_producao',            a.em_producao,
      'pausados',               a.pausados,
      'canais_distintos',       a.canais_distintos,
      'editorias_distintas',    a.editorias_distintas,
      'responsaveis_distintos', a.responsaveis_distintos
    ),
    'comparativo', CASE
      WHEN p_compare_start IS NULL THEN NULL
      ELSE jsonb_build_object(
        'periodo', jsonb_build_object(
          'start', p_compare_start::text,
          'end',   p_compare_end::text
        ),
        'total',      c.total,
        'publicados', c.publicados,
        'delta_total_pct', CASE
          WHEN c.total = 0 THEN NULL
          ELSE ROUND(((a.total::numeric - c.total) / c.total::numeric) * 100, 1)
        END,
        'delta_publicados_pct', CASE
          WHEN c.publicados = 0 THEN NULL
          ELSE ROUND(((a.publicados::numeric - c.publicados) / c.publicados::numeric) * 100, 1)
        END
      )
    END
  ) INTO v_result
  FROM atual_agg a, comp_agg c;

  RETURN v_result;
END;
$$;

-- ============================================================
-- FUNÇÃO 3: get_moai_conteudo_por_canal
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_moai_conteudo_por_canal()
RETURNS TABLE (
  canal        text,
  total        bigint,
  publicados   bigint,
  planejados   bigint,
  em_producao  bigint,
  aprovados    bigint
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH base AS (
    SELECT
      s.board_name AS canal,
      public._moai_status_norm(public._moai_cv(item, 'status')) AS status_norm
    FROM public.monday_boards_snapshot s,
         LATERAL jsonb_array_elements(s.items) AS item
    WHERE s.board_name ILIKE '%cronograma%'
       OR s.board_name ILIKE '%redes sociais moai%'
  )
  SELECT
    canal,
    COUNT(*)                                              AS total,
    COUNT(*) FILTER (WHERE status_norm = 'publicado')   AS publicados,
    COUNT(*) FILTER (WHERE status_norm = 'planejado')   AS planejados,
    COUNT(*) FILTER (WHERE status_norm = 'em_producao') AS em_producao,
    COUNT(*) FILTER (WHERE status_norm = 'aprovado')    AS aprovados
  FROM base
  GROUP BY canal
  ORDER BY total DESC;
$$;

-- ============================================================
-- FUNÇÃO 4: get_moai_conteudo_por_editoria
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_moai_conteudo_por_editoria()
RETURNS TABLE (
  editoria   text,
  total      bigint,
  publicados bigint,
  planejados bigint
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH base AS (
    SELECT
      COALESCE(public._moai_cv(item, 'editoria'), '(sem editoria)') AS editoria,
      public._moai_status_norm(public._moai_cv(item, 'status'))     AS status_norm
    FROM public.monday_boards_snapshot s,
         LATERAL jsonb_array_elements(s.items) AS item
    WHERE s.board_name ILIKE '%cronograma%'
       OR s.board_name ILIKE '%redes sociais moai%'
  )
  SELECT
    editoria,
    COUNT(*)                                            AS total,
    COUNT(*) FILTER (WHERE status_norm = 'publicado') AS publicados,
    COUNT(*) FILTER (WHERE status_norm = 'planejado') AS planejados
  FROM base
  GROUP BY editoria
  ORDER BY total DESC;
$$;

-- ============================================================
-- FUNÇÃO 5: get_moai_conteudo_por_responsavel
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_moai_conteudo_por_responsavel()
RETURNS TABLE (
  responsavel  text,
  total        bigint,
  publicados   bigint,
  em_andamento bigint
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH base AS (
    SELECT
      COALESCE(
        public._moai_cv(item, 'responsável'),
        public._moai_cv(item, 'responsavel'),
        public._moai_cv(item, 'person'),
        '(sem responsável)'
      )                                                            AS responsavel,
      public._moai_status_norm(public._moai_cv(item, 'status'))  AS status_norm
    FROM public.monday_boards_snapshot s,
         LATERAL jsonb_array_elements(s.items) AS item
    WHERE s.board_name ILIKE '%cronograma%'
       OR s.board_name ILIKE '%redes sociais moai%'
  )
  SELECT
    responsavel,
    COUNT(*)                                                                         AS total,
    COUNT(*) FILTER (WHERE status_norm = 'publicado')                              AS publicados,
    COUNT(*) FILTER (WHERE status_norm IN ('em_producao', 'aprovado', 'planejado')) AS em_andamento
  FROM base
  GROUP BY responsavel
  ORDER BY total DESC;
$$;

-- ============================================================
-- FUNÇÃO 6: get_moai_conteudo_calendar
-- ============================================================
-- Retorna contagem de itens publicados por dia nos últimos N meses.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_moai_conteudo_calendar(
  p_meses integer DEFAULT 3
)
RETURNS TABLE (
  data   text,
  count  bigint,
  canais text[]
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH base AS (
    SELECT
      s.board_name AS canal,
      COALESCE(
        public._moai_cv(item, 'data de postagem'),
        public._moai_cv(item, 'data post'),
        public._moai_cv(item, 'data')
      )                                                            AS data_post,
      public._moai_status_norm(public._moai_cv(item, 'status'))  AS status_norm
    FROM public.monday_boards_snapshot s,
         LATERAL jsonb_array_elements(s.items) AS item
    WHERE s.board_name ILIKE '%cronograma%'
       OR s.board_name ILIKE '%redes sociais moai%'
  )
  SELECT
    data_post::date::text                            AS data,
    COUNT(*)                                         AS count,
    ARRAY_AGG(DISTINCT canal)                        AS canais
  FROM base
  WHERE status_norm = 'publicado'
    AND data_post IS NOT NULL
    AND data_post::date >= (CURRENT_DATE - (p_meses || ' months')::interval)::date
    AND data_post::date <= CURRENT_DATE
  GROUP BY data_post::date
  ORDER BY data_post::date;
$$;

-- ============================================================
-- Permissões
-- ============================================================
GRANT EXECUTE ON FUNCTION public._moai_cv(jsonb, text)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public._moai_status_norm(text)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_moai_conteudo_lista         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_moai_conteudo_resumo        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_moai_conteudo_por_canal     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_moai_conteudo_por_editoria  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_moai_conteudo_por_responsavel TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_moai_conteudo_calendar      TO anon, authenticated;
