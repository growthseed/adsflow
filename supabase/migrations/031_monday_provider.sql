-- ============================================================
-- Migration 031 — adiciona 'monday' ao enum de provider
-- ============================================================
-- Motivação: MOAI usa Monday.com (https://monday.com) como ERP completo
-- de operação (25 workspaces, 677 boards, ~50k items). Diferente de Clint
-- que é CRM de vendas, Monday é ops 360° (NPS, Carteiras por mentor,
-- Cronograma de Conteúdo, Inadimplência, RH, Conselhos).
--
-- Padrão de auth: Personal Token JWT (header `Authorization: <token>`)
-- API: GraphQL v2 em https://api.monday.com/v2
--
-- Tabela `client_integrations` armazenará:
--   - provider = 'monday'
--   - config jsonb com { account_id, team_id, region, token, workspaces[] }
-- ============================================================

ALTER TABLE public.client_integrations
  DROP CONSTRAINT IF EXISTS client_integrations_provider_check;

ALTER TABLE public.client_integrations
  ADD CONSTRAINT client_integrations_provider_check
  CHECK (provider IN (
    'google_ads',
    'meta_ads',
    'google_analytics',
    'search_console',
    'google_my_business',
    'youtube',
    'linkedin',
    'clickup',
    'tiktok_ads',
    'kommo',
    'clint',
    'monday',
    'rdstation',
    'pipedrive',
    'hubspot'
  ));

COMMENT ON CONSTRAINT client_integrations_provider_check ON public.client_integrations IS
  'Lista canônica de providers suportados. Adicionar aqui ao integrar novo CRM/Ads/Ops platform.';

-- ============================================================
-- Tabela de snapshot Monday (cache local dos boards/items extraídos)
-- ============================================================
-- Monday tem 677 boards na MOAI; refazer GraphQL toda vez é caro.
-- Mantemos um snapshot tipado por workspace/board/items que o snapshot
-- builder consulta. Refresh via Edge Function (default: 6h).

CREATE TABLE IF NOT EXISTS public.monday_boards_snapshot (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  workspace_id    text NOT NULL,
  workspace_name  text NOT NULL,
  board_id        text NOT NULL,
  board_name      text NOT NULL,
  board_kind      text,
  items_count     int NOT NULL DEFAULT 0,
  columns         jsonb,
  items           jsonb,             -- items normalizados [{ id, name, group, column_values }]
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, board_id)
);

CREATE INDEX IF NOT EXISTS idx_monday_boards_snapshot_client
  ON public.monday_boards_snapshot (client_id);

CREATE INDEX IF NOT EXISTS idx_monday_boards_snapshot_workspace
  ON public.monday_boards_snapshot (client_id, workspace_id);

ALTER TABLE public.monday_boards_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY monday_boards_snapshot_client_read
  ON public.monday_boards_snapshot
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_client_access uca
      WHERE uca.client_id = monday_boards_snapshot.client_id
      AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY monday_boards_snapshot_service_write
  ON public.monday_boards_snapshot
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.monday_boards_snapshot IS
  'Cache local de boards/items extraídos do Monday via GraphQL. Refresh via Edge Function.';
