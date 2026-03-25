-- =====================================================
-- Ads Flow — Migration 003: Team Invites
-- Efeito Digital — 2026-02-16
-- =====================================================
-- Cria tabela de convites para membros da equipe.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_invites_client ON public.team_invites(client_id);
CREATE INDEX idx_team_invites_email ON public.team_invites(email);
CREATE INDEX idx_team_invites_status ON public.team_invites(status);

-- RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Admins do cliente podem gerenciar convites
CREATE POLICY "Client admins can manage invites"
  ON public.team_invites FOR ALL
  USING (
    client_id IN (
      SELECT cm.client_id FROM public.client_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Convidado pode ver seus próprios convites (por email)
CREATE POLICY "Invited users can view their invites"
  ON public.team_invites FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  );

-- Trigger updated_at
CREATE TRIGGER update_team_invites_updated_at
  BEFORE UPDATE ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
