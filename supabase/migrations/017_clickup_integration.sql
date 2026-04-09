-- =====================================================
-- Ads Flow — Migration 017: ClickUp Integration
-- Efeito Digital — 2026-04-01
-- =====================================================
-- ClickUp project management integration for Project Reports
-- =====================================================

-- =========================
-- CLICKUP CONFIGS (API tokens per client)
-- =========================
CREATE TABLE IF NOT EXISTS public.clickup_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_token TEXT NOT NULL,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, client_id)
);

CREATE INDEX idx_clickup_configs_user ON public.clickup_configs(user_id);
CREATE INDEX idx_clickup_configs_client ON public.clickup_configs(client_id);
CREATE INDEX idx_clickup_configs_status ON public.clickup_configs(status);

-- =========================
-- ROW LEVEL SECURITY
-- =========================
ALTER TABLE public.clickup_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clickup configs"
  ON public.clickup_configs FOR ALL
  USING (
    auth.uid() = user_id
    OR client_id IN (
      SELECT client_id FROM public.client_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR client_id IN (
      SELECT client_id FROM public.client_members WHERE user_id = auth.uid()
    )
  );

-- =========================
-- UPDATED_AT TRIGGER
-- =========================
CREATE TRIGGER update_clickup_configs_updated_at
  BEFORE UPDATE ON public.clickup_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
