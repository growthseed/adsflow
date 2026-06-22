-- ============================================================
-- Migration 035 - MOAI reporting mart
-- ============================================================
-- Camada tratada para transformar moai_raw_records em tabelas seguras,
-- consumiveis pelo report MOAI e por endpoints server-side.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.moai_member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug text NOT NULL DEFAULT 'moai',
  source text NOT NULL DEFAULT 'maia',
  source_external_id text NOT NULL,
  contact_key text,
  name text,
  journey text,
  company text,
  sector text,
  category text,
  email text,
  phone text,
  checkins integer NOT NULL DEFAULT 0,
  registrations integer NOT NULL DEFAULT 0,
  tags text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_slug, source, source_external_id)
);

CREATE INDEX IF NOT EXISTS idx_moai_member_profiles_client_journey
  ON public.moai_member_profiles (client_slug, journey);

CREATE INDEX IF NOT EXISTS idx_moai_member_profiles_contact_key
  ON public.moai_member_profiles (client_slug, contact_key);

CREATE INDEX IF NOT EXISTS idx_moai_member_profiles_email
  ON public.moai_member_profiles (client_slug, lower(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.moai_paid_media_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug text NOT NULL DEFAULT 'moai',
  source text NOT NULL CHECK (source IN ('meta_ads', 'google_ads')),
  metric_date date NOT NULL,
  account_id text,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text,
  ad_name text,
  dedupe_key text NOT NULL DEFAULT '',
  spend numeric NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  leads numeric NOT NULL DEFAULT 0,
  purchases numeric NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moai_paid_media_daily_client_date
  ON public.moai_paid_media_daily (client_slug, metric_date DESC, source);

CREATE INDEX IF NOT EXISTS idx_moai_paid_media_daily_campaign
  ON public.moai_paid_media_daily (client_slug, source, campaign_id, metric_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_moai_paid_media_daily_dedupe
  ON public.moai_paid_media_daily (client_slug, source, metric_date, dedupe_key);

CREATE TABLE IF NOT EXISTS public.moai_report_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug text NOT NULL DEFAULT 'moai',
  snapshot_key text NOT NULL,
  snapshot_date date NOT NULL DEFAULT current_date,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_slug, snapshot_key, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_moai_report_snapshots_client_date
  ON public.moai_report_snapshots (client_slug, snapshot_date DESC, snapshot_key);

ALTER TABLE public.moai_member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moai_paid_media_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moai_report_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY moai_member_profiles_service_all
  ON public.moai_member_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY moai_paid_media_daily_service_all
  ON public.moai_paid_media_daily
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY moai_report_snapshots_service_all
  ON public.moai_report_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY moai_member_profiles_authenticated_read
  ON public.moai_member_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.moai_user_access ua
      WHERE ua.user_id = (SELECT auth.uid())
        AND ua.is_active = true
        AND (ua.expires_at IS NULL OR ua.expires_at > now())
        AND ua.role IN ('super_admin', 'agency_admin', 'moai_owner', 'moai_leadership', 'moai_mentor')
    )
  );

CREATE POLICY moai_paid_media_daily_authenticated_read
  ON public.moai_paid_media_daily
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.moai_user_access ua
      WHERE ua.user_id = (SELECT auth.uid())
        AND ua.is_active = true
        AND (ua.expires_at IS NULL OR ua.expires_at > now())
        AND ua.role IN ('super_admin', 'agency_admin', 'moai_owner', 'moai_leadership', 'moai_marketing')
    )
  );

CREATE POLICY moai_report_snapshots_authenticated_read
  ON public.moai_report_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.moai_user_access ua
      WHERE ua.user_id = (SELECT auth.uid())
        AND ua.is_active = true
        AND (ua.expires_at IS NULL OR ua.expires_at > now())
        AND ua.role IN ('super_admin', 'agency_admin', 'moai_owner', 'moai_leadership', 'moai_marketing', 'moai_finance')
    )
  );

CREATE OR REPLACE VIEW public.vw_moai_member_summary
WITH (security_invoker = true)
AS
WITH base AS (
  SELECT
    client_slug,
    COUNT(*)::integer AS members_total,
    COUNT(*) FILTER (WHERE email IS NOT NULL AND email <> '')::integer AS members_with_email,
    COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone <> '')::integer AS members_with_phone,
    COUNT(*) FILTER (WHERE company IS NOT NULL AND company <> '')::integer AS members_with_company,
    COUNT(*) FILTER (WHERE sector IS NOT NULL AND sector <> '')::integer AS members_with_sector,
    COUNT(*) FILTER (WHERE category IS NOT NULL AND category <> '')::integer AS members_with_category
  FROM public.moai_member_profiles
  GROUP BY client_slug
),
journeys AS (
  SELECT
    client_slug,
    jsonb_object_agg(journey, total ORDER BY total DESC) AS journey_counts
  FROM (
    SELECT client_slug, journey, COUNT(*)::integer AS total
    FROM public.moai_member_profiles
    WHERE journey IS NOT NULL AND journey <> ''
    GROUP BY client_slug, journey
  ) j
  GROUP BY client_slug
)
SELECT
  base.client_slug,
  base.members_total,
  base.members_with_email,
  base.members_with_phone,
  base.members_with_company,
  base.members_with_sector,
  base.members_with_category,
  COALESCE(journeys.journey_counts, '{}'::jsonb) AS journey_counts
FROM base
LEFT JOIN journeys ON journeys.client_slug = base.client_slug;

CREATE OR REPLACE VIEW public.vw_moai_paid_media_summary
WITH (security_invoker = true)
AS
SELECT
  client_slug,
  source,
  metric_date,
  SUM(spend) AS spend,
  SUM(impressions)::bigint AS impressions,
  SUM(clicks)::bigint AS clicks,
  SUM(leads) AS leads,
  SUM(purchases) AS purchases,
  SUM(revenue) AS revenue,
  CASE WHEN SUM(clicks) > 0 THEN ROUND(SUM(spend) / NULLIF(SUM(clicks), 0), 2) ELSE 0 END AS cpc,
  CASE WHEN SUM(leads) > 0 THEN ROUND(SUM(spend) / NULLIF(SUM(leads), 0), 2) ELSE 0 END AS cpl,
  CASE WHEN SUM(impressions) > 0 THEN ROUND(100.0 * SUM(clicks) / NULLIF(SUM(impressions), 0), 2) ELSE 0 END AS ctr_pct
FROM public.moai_paid_media_daily
GROUP BY client_slug, source, metric_date;

GRANT SELECT ON public.vw_moai_member_summary TO authenticated;
GRANT SELECT ON public.vw_moai_paid_media_summary TO authenticated;

COMMENT ON TABLE public.moai_member_profiles IS
  'Mart protegido de membros/clientes MOAI, alimentado principalmente pela Maia.';

COMMENT ON TABLE public.moai_paid_media_daily IS
  'Mart diario de midia paga por campanha/adset/ad para Meta Ads e Google Ads.';

COMMENT ON TABLE public.moai_report_snapshots IS
  'Snapshots agregados de prontidao e KPIs do report MOAI.';
