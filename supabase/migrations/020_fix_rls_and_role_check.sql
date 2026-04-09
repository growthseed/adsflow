-- =============================================================
-- 020_fix_rls_and_role_check.sql
-- =============================================================
-- Pre-Sprint 0: Close the RLS vazamento + ClientRole mismatch
-- Applied on sdtyynzyfvxigwfmzayk on 2026-04-09 via MCP.
--
-- Three fixes in one migration:
--   1. client_members role check aligned with AuthContext.ClientRole
--      (owner|admin|manager|analyst|viewer) instead of the old
--      owner|manager|editor|viewer
--   2. client_flows / client_flow_versions RLS scoped by client_members
--      + staff bypass — previously USING(true) WITH CHECK(true)
--   3. agency_snapshots restricted to staff only (agency-wide rollup
--      must never leak to portal users)
-- =============================================================

-- -----------------------------------------------------------
-- 1. client_members role check
-- -----------------------------------------------------------

ALTER TABLE public.client_members
  DROP CONSTRAINT IF EXISTS client_members_role_check;

ALTER TABLE public.client_members
  ADD CONSTRAINT client_members_role_check
  CHECK (role IN ('owner', 'admin', 'manager', 'analyst', 'viewer'));

-- Promote admin@efeitodigital.com.br from the Sprint 0 fallback role
-- ("manager") to the intended "admin" role now that the check allows it.
UPDATE public.client_members cm
SET role = 'admin'
FROM public.users u
WHERE cm.user_id = u.id
  AND u.email = 'admin@efeitodigital.com.br'
  AND cm.role = 'manager';

-- -----------------------------------------------------------
-- 2. client_flows RLS
-- -----------------------------------------------------------

DROP POLICY IF EXISTS "authenticated_crud_flows" ON public.client_flows;

DROP POLICY IF EXISTS "client_flows_select" ON public.client_flows;
CREATE POLICY "client_flows_select"
  ON public.client_flows
  FOR SELECT
  TO authenticated
  USING (
    client_slug IN (
      SELECT c.slug
      FROM public.clients c
      INNER JOIN public.client_members cm ON cm.client_id = c.id
      WHERE cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "client_flows_insert" ON public.client_flows;
CREATE POLICY "client_flows_insert"
  ON public.client_flows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_slug IN (
      SELECT c.slug
      FROM public.clients c
      INNER JOIN public.client_members cm ON cm.client_id = c.id
      WHERE cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin', 'manager', 'analyst')
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "client_flows_update" ON public.client_flows;
CREATE POLICY "client_flows_update"
  ON public.client_flows
  FOR UPDATE
  TO authenticated
  USING (
    client_slug IN (
      SELECT c.slug
      FROM public.clients c
      INNER JOIN public.client_members cm ON cm.client_id = c.id
      WHERE cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin', 'manager')
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    client_slug IN (
      SELECT c.slug
      FROM public.clients c
      INNER JOIN public.client_members cm ON cm.client_id = c.id
      WHERE cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin', 'manager')
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "client_flows_delete" ON public.client_flows;
CREATE POLICY "client_flows_delete"
  ON public.client_flows
  FOR DELETE
  TO authenticated
  USING (
    client_slug IN (
      SELECT c.slug
      FROM public.clients c
      INNER JOIN public.client_members cm ON cm.client_id = c.id
      WHERE cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- -----------------------------------------------------------
-- 3. client_flow_versions RLS
-- -----------------------------------------------------------
-- Scoped through the parent client_flow (join flow_id → client_slug).
-- Versions are populated by a BEFORE UPDATE trigger on client_flows
-- (snapshot_flow_version), so no INSERT policy is needed from user
-- code. UPDATE + DELETE stay locked down (no policy = deny).

DROP POLICY IF EXISTS "authenticated_read_versions" ON public.client_flow_versions;

DROP POLICY IF EXISTS "client_flow_versions_select" ON public.client_flow_versions;
CREATE POLICY "client_flow_versions_select"
  ON public.client_flow_versions
  FOR SELECT
  TO authenticated
  USING (
    flow_id IN (
      SELECT f.id
      FROM public.client_flows f
      WHERE f.client_slug IN (
        SELECT c.slug
        FROM public.clients c
        INNER JOIN public.client_members cm ON cm.client_id = c.id
        WHERE cm.user_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- -----------------------------------------------------------
-- 4. agency_snapshots — staff only
-- -----------------------------------------------------------
-- Agency-wide rollup; portal users must never see it. Writes
-- happen from the cron via service_role (bypasses RLS).

DROP POLICY IF EXISTS "authenticated_read_snapshots" ON public.agency_snapshots;

DROP POLICY IF EXISTS "agency_snapshots_select_staff" ON public.agency_snapshots;
CREATE POLICY "agency_snapshots_select_staff"
  ON public.agency_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
