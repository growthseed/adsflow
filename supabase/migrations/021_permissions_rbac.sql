-- =============================================================
-- 021_permissions_rbac.sql
-- =============================================================
-- Sprint 1 foundation: granular permissions, role templates,
-- per-client Enterprise overrides. Applied on sdtyynzyfvxigwfmzayk
-- on 2026-04-09 via MCP.
--
-- Counts after seed:
--   owner   20
--   admin   20
--   manager 14
--   analyst  9
--   viewer   6
-- =============================================================

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module, action)
);

COMMENT ON TABLE public.permissions IS
  'Granular permission catalog. Each row is one (module, action) tuple.';

INSERT INTO public.permissions (module, action, description) VALUES
  ('overview',    'read',       'Visualizar a visão geral do cliente'),
  ('overview',    'export',     'Exportar dados da visão geral'),
  ('planner',     'read',       'Visualizar fluxos do Planner'),
  ('planner',     'write',      'Criar e editar fluxos'),
  ('planner',     'comment',    'Adicionar comentários em fluxos'),
  ('planner',     'approve',    'Aprovar fluxos para execução'),
  ('planner',     'delete',     'Excluir fluxos'),
  ('performance', 'read',       'Visualizar dashboard de performance'),
  ('performance', 'drill_down', 'Acessar drill-down por campanha/anúncio'),
  ('performance', 'export',     'Exportar dados de performance'),
  ('project',     'read',       'Visualizar tarefas do projeto'),
  ('project',     'write',      'Criar e editar tarefas'),
  ('project',     'comment',    'Comentar em tarefas'),
  ('project',     'approve',    'Aprovar entregáveis'),
  ('settings',    'read',       'Visualizar configurações do cliente'),
  ('settings',    'write',      'Editar configurações do cliente'),
  ('insights',    'read',       'Visualizar insights de IA'),
  ('reports',     'read',       'Visualizar relatórios'),
  ('reports',     'generate',   'Gerar relatórios sob demanda'),
  ('reports',     'schedule',   'Agendar envio automático de relatórios')
ON CONFLICT (module, action) DO NOTHING;

-- -----------------------------------------------------------
-- role_permissions: template mapping role → permissions
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_name TEXT NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_name, permission_id),
  CHECK (role_name IN ('owner', 'admin', 'manager', 'analyst', 'viewer'))
);

COMMENT ON TABLE public.role_permissions IS
  'Template mapping of ClientRole → permissions. Seeded from the TDD v2.0 matrix.';

-- -----------------------------------------------------------
-- client_role_overrides: per-client Enterprise overrides
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_role_overrides (
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  is_granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, role_name, permission_id),
  CHECK (role_name IN ('owner', 'admin', 'manager', 'analyst', 'viewer'))
);

COMMENT ON TABLE public.client_role_overrides IS
  'Per-client grant/revoke overlay on top of role_permissions. Enterprise tier only.';

-- -----------------------------------------------------------
-- RLS
-- -----------------------------------------------------------

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_role_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permissions_read" ON public.permissions;
CREATE POLICY "permissions_read"
  ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "role_permissions_read" ON public.role_permissions;
CREATE POLICY "role_permissions_read"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "client_overrides_read" ON public.client_role_overrides;
CREATE POLICY "client_overrides_read"
  ON public.client_role_overrides
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM public.client_members WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "client_overrides_write_staff" ON public.client_role_overrides;
CREATE POLICY "client_overrides_write_staff"
  ON public.client_role_overrides
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- -----------------------------------------------------------
-- Seed role_permissions from the TDD v2.0 matrix
-- -----------------------------------------------------------
-- Matrix condensed (settings is owner/admin only):
--
--   module.action         owner admin manager analyst viewer
--   overview.read          x     x     x       x       x
--   overview.export        x     x     x       x       -
--   planner.read           x     x     x       x       x
--   planner.write          x     x     x       -       -
--   planner.comment        x     x     x       x       -
--   planner.approve        x     x     -       -       -
--   planner.delete         x     x     -       -       -
--   performance.read       x     x     x       x       x
--   performance.drill_down x     x     x       x       -
--   performance.export     x     x     x       -       -
--   project.read           x     x     x       x       x
--   project.write          x     x     x       -       -
--   project.comment        x     x     x       x       -
--   project.approve        x     x     -       -       -
--   settings.read          x     x     -       -       -
--   settings.write         x     x     -       -       -
--   insights.read          x     x     x       x       x
--   reports.read           x     x     x       x       x
--   reports.generate       x     x     x       -       -
--   reports.schedule       x     x     -       -       -

DO $$
DECLARE
  perm RECORD;
BEGIN
  FOR perm IN SELECT id, module, action FROM public.permissions LOOP
    -- owner: everything
    INSERT INTO public.role_permissions (role_name, permission_id)
    VALUES ('owner', perm.id)
    ON CONFLICT DO NOTHING;

    -- admin: everything (same as owner)
    INSERT INTO public.role_permissions (role_name, permission_id)
    VALUES ('admin', perm.id)
    ON CONFLICT DO NOTHING;

    -- manager: everything except *.delete, *.approve, settings.*,
    -- reports.schedule
    IF NOT (
      (perm.module = 'planner'  AND perm.action IN ('approve', 'delete'))
      OR (perm.module = 'project'  AND perm.action = 'approve')
      OR (perm.module = 'settings')
      OR (perm.module = 'reports' AND perm.action = 'schedule')
    ) THEN
      INSERT INTO public.role_permissions (role_name, permission_id)
      VALUES ('manager', perm.id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- analyst: reads + comments + performance.drill_down,
    -- but NO settings access
    IF perm.module <> 'settings' AND (
      perm.action IN ('read', 'comment')
      OR (perm.module = 'performance' AND perm.action = 'drill_down')
    ) THEN
      INSERT INTO public.role_permissions (role_name, permission_id)
      VALUES ('analyst', perm.id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- viewer: reads only, NO settings
    IF perm.action = 'read' AND perm.module <> 'settings' THEN
      INSERT INTO public.role_permissions (role_name, permission_id)
      VALUES ('viewer', perm.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
