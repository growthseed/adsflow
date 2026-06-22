-- ============================================================
-- Migration 033 — MOAI RBAC (8 papéis customizados)
-- ============================================================
-- Estende o RBAC genérico da migration 021 (owner/admin/manager/analyst/viewer)
-- com papéis específicos do tenant MOAI:
--
--   super_admin       — Jonathan (Efeito Digital) — vê tudo de todos clientes
--   agency_admin      — Time Efeito Digital — vê MOAI + outros clientes
--   moai_owner        — Vinicius Postai — vê tudo MOAI (6 dashboards)
--   moai_leadership   — Duda CMO, Hilary, Maria Eduarda — todos exceto Financeiro detalhado
--   moai_mentor       — Vilker/Vini/Ale/Luma/Yas/Marcos — só Membros & Carteiras
--                       FILTRADO pela carteira deles + CX/NPS de seus membros
--   moai_finance      — Resp. financeiro — só dashboard Financeiro
--   moai_marketing    — Camila, time conteúdo — só Conteúdo & MKT
--   public_snapshot   — link compartilhável sem login — Executive Pulse read-only
--
-- O scope_filter (jsonb) permite restringir o que cada papel vê:
--   moai_mentor.scope_filter = { "mentor": "Vilker" }
--      → mentor Vilker só vê membros/cards com mentor=Vilker
--   public_snapshot.scope_filter = { "period_ref": "2026-05" }
--      → o link público só mostra dados de maio (snapshot congelado)
-- ============================================================

-- ============================================================
-- Tabela principal: moai_user_access
-- ============================================================

CREATE TABLE IF NOT EXISTS public.moai_user_access (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- pra links públicos sem auth, user_id é null e token identifica
  public_token text UNIQUE,
  role         text NOT NULL CHECK (role IN (
    'super_admin',
    'agency_admin',
    'moai_owner',
    'moai_leadership',
    'moai_mentor',
    'moai_finance',
    'moai_marketing',
    'public_snapshot'
  )),
  scope_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- metadados
  invited_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at   timestamptz NOT NULL DEFAULT now(),
  accepted_at  timestamptz,
  expires_at   timestamptz,
  display_name text,
  display_email text,
  notes        text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  -- Constraint: ou user_id existe (login) OU public_token existe (link público)
  CHECK ((user_id IS NOT NULL AND public_token IS NULL) OR (user_id IS NULL AND public_token IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_moai_user_access_user
  ON public.moai_user_access (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_moai_user_access_token
  ON public.moai_user_access (public_token) WHERE public_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_moai_user_access_role
  ON public.moai_user_access (role) WHERE is_active = true;

COMMENT ON TABLE public.moai_user_access IS
  'Acesso ao MOAI portal. user_id = login normal | public_token = link compartilhável.';
COMMENT ON COLUMN public.moai_user_access.scope_filter IS
  'JSON com filtros aplicados ao dashboard. Ex: {"mentor": "Vilker"} restringe ao membro Vilker.';

-- ============================================================
-- Tabela: moai_dashboard_visibility
-- ============================================================
-- Mapeia quais dashboards cada papel pode VER (não é filtro de DADO,
-- é filtro de PÁGINA). Permite ajustar acesso sem mudar código.

CREATE TABLE IF NOT EXISTS public.moai_dashboard_visibility (
  role             text NOT NULL,
  dashboard_id     text NOT NULL,
  -- 'full' (vê tudo) | 'scoped' (vê com scope filter aplicado) | 'forbidden'
  visibility_mode  text NOT NULL DEFAULT 'full' CHECK (visibility_mode IN ('full', 'scoped', 'forbidden')),
  PRIMARY KEY (role, dashboard_id)
);

INSERT INTO public.moai_dashboard_visibility (role, dashboard_id, visibility_mode) VALUES
  -- super_admin: tudo
  ('super_admin', 'moai_executive_pulse',     'full'),
  ('super_admin', 'moai_sales_crm',           'full'),
  ('super_admin', 'moai_cx_nps',              'full'),
  ('super_admin', 'moai_membros_carteiras',   'full'),
  ('super_admin', 'moai_conteudo_mkt',        'full'),
  ('super_admin', 'moai_financeiro',          'full'),
  -- agency_admin: tudo
  ('agency_admin', 'moai_executive_pulse',     'full'),
  ('agency_admin', 'moai_sales_crm',           'full'),
  ('agency_admin', 'moai_cx_nps',              'full'),
  ('agency_admin', 'moai_membros_carteiras',   'full'),
  ('agency_admin', 'moai_conteudo_mkt',        'full'),
  ('agency_admin', 'moai_financeiro',          'full'),
  -- moai_owner (Vinicius): tudo
  ('moai_owner', 'moai_executive_pulse',     'full'),
  ('moai_owner', 'moai_sales_crm',           'full'),
  ('moai_owner', 'moai_cx_nps',              'full'),
  ('moai_owner', 'moai_membros_carteiras',   'full'),
  ('moai_owner', 'moai_conteudo_mkt',        'full'),
  ('moai_owner', 'moai_financeiro',          'full'),
  -- moai_leadership (Duda CMO): exec/sales/cx/conteúdo - financeiro só nível alto
  ('moai_leadership', 'moai_executive_pulse',     'full'),
  ('moai_leadership', 'moai_sales_crm',           'full'),
  ('moai_leadership', 'moai_cx_nps',              'full'),
  ('moai_leadership', 'moai_membros_carteiras',   'full'),
  ('moai_leadership', 'moai_conteudo_mkt',        'full'),
  ('moai_leadership', 'moai_financeiro',          'scoped'), -- vê totais mas não detalhe
  -- moai_mentor (Vilker/Vini/Ale/Luma/Yas/Marcos): só Membros (scoped) + CX/NPS (scoped)
  ('moai_mentor', 'moai_executive_pulse',     'forbidden'),
  ('moai_mentor', 'moai_sales_crm',           'forbidden'),
  ('moai_mentor', 'moai_cx_nps',              'scoped'),  -- só NPS da sua carteira
  ('moai_mentor', 'moai_membros_carteiras',   'scoped'),  -- só sua carteira
  ('moai_mentor', 'moai_conteudo_mkt',        'forbidden'),
  ('moai_mentor', 'moai_financeiro',          'forbidden'),
  -- moai_finance: só Financeiro
  ('moai_finance', 'moai_executive_pulse',     'scoped'),  -- KPIs financeiros do topo
  ('moai_finance', 'moai_sales_crm',           'forbidden'),
  ('moai_finance', 'moai_cx_nps',              'forbidden'),
  ('moai_finance', 'moai_membros_carteiras',   'forbidden'),
  ('moai_finance', 'moai_conteudo_mkt',        'forbidden'),
  ('moai_finance', 'moai_financeiro',          'full'),
  -- moai_marketing: só Conteúdo
  ('moai_marketing', 'moai_executive_pulse',     'scoped'),
  ('moai_marketing', 'moai_sales_crm',           'forbidden'),
  ('moai_marketing', 'moai_cx_nps',              'forbidden'),
  ('moai_marketing', 'moai_membros_carteiras',   'forbidden'),
  ('moai_marketing', 'moai_conteudo_mkt',        'full'),
  ('moai_marketing', 'moai_financeiro',          'forbidden'),
  -- public_snapshot: só Executive Pulse, scoped (snapshot congelado de período)
  ('public_snapshot', 'moai_executive_pulse',     'scoped'),
  ('public_snapshot', 'moai_sales_crm',           'forbidden'),
  ('public_snapshot', 'moai_cx_nps',              'forbidden'),
  ('public_snapshot', 'moai_membros_carteiras',   'forbidden'),
  ('public_snapshot', 'moai_conteudo_mkt',        'forbidden'),
  ('public_snapshot', 'moai_financeiro',          'forbidden')
ON CONFLICT (role, dashboard_id) DO NOTHING;

COMMENT ON TABLE public.moai_dashboard_visibility IS
  'Mapa role -> dashboard -> modo de visibilidade. Editavel sem deploy.';

-- ============================================================
-- RLS — moai_user_access só vê os próprios registros (e admin vê todos)
-- ============================================================

ALTER TABLE public.moai_user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY moai_user_access_self_read
  ON public.moai_user_access
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY moai_user_access_admin_all
  ON public.moai_user_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.moai_user_access ua
      WHERE ua.user_id = auth.uid()
      AND ua.role IN ('super_admin', 'agency_admin', 'moai_owner')
      AND ua.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.moai_user_access ua
      WHERE ua.user_id = auth.uid()
      AND ua.role IN ('super_admin', 'agency_admin', 'moai_owner')
      AND ua.is_active = true
    )
  );

-- moai_dashboard_visibility: read pra todos os authenticated (é meta-data)
ALTER TABLE public.moai_dashboard_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY moai_dashboard_visibility_read_all
  ON public.moai_dashboard_visibility
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY moai_dashboard_visibility_admin_write
  ON public.moai_dashboard_visibility
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.moai_user_access ua
      WHERE ua.user_id = auth.uid()
      AND ua.role IN ('super_admin', 'agency_admin', 'moai_owner')
      AND ua.is_active = true
    )
  );

-- ============================================================
-- Helper: resolve_moai_access(user_id) → role + scope
-- ============================================================

CREATE OR REPLACE FUNCTION public.resolve_moai_access(p_user_id uuid)
RETURNS TABLE (
  role text,
  scope_filter jsonb,
  is_active boolean,
  display_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role, scope_filter, is_active, display_name
  FROM public.moai_user_access
  WHERE user_id = p_user_id
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  ORDER BY
    CASE role
      WHEN 'super_admin' THEN 0
      WHEN 'agency_admin' THEN 1
      WHEN 'moai_owner' THEN 2
      WHEN 'moai_leadership' THEN 3
      WHEN 'moai_mentor' THEN 4
      WHEN 'moai_finance' THEN 5
      WHEN 'moai_marketing' THEN 6
      WHEN 'public_snapshot' THEN 7
      ELSE 99
    END
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.resolve_moai_access IS
  'Resolve papel + escopo de um user. Retorna o role com maior privilegio se houver mais de um.';

-- ============================================================
-- Helper: resolve_moai_access_by_token (pra public_snapshot)
-- ============================================================

CREATE OR REPLACE FUNCTION public.resolve_moai_access_by_token(p_token text)
RETURNS TABLE (
  role text,
  scope_filter jsonb,
  is_active boolean,
  display_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role, scope_filter, is_active, display_name
  FROM public.moai_user_access
  WHERE public_token = p_token
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;
