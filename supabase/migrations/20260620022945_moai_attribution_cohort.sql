-- MOAI attribution spine and true cohort maturity.
ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS adflow_id text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS wbraid text,
  ADD COLUMN IF NOT EXISTS gbraid text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS campaign_id text,
  ADD COLUMN IF NOT EXISTS adset_id text,
  ADD COLUMN IF NOT EXISTS ad_id text;

CREATE INDEX IF NOT EXISTS idx_crm_deals_click_ids ON public.crm_deals (client_id, gclid, fbclid);
CREATE INDEX IF NOT EXISTS idx_crm_deals_campaign_ids ON public.crm_deals (client_id, campaign_id, adset_id, ad_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_created_status ON public.crm_deals (client_id, created_at, is_won, is_lost);

CREATE TABLE IF NOT EXISTS public.moai_lead_touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  crm_deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('meta_ads','google_ads','maia','clint','monday','organic','direct','other')),
  external_event_id text,
  dedupe_key text NOT NULL,
  contact_key text,
  adflow_id text,
  fbclid text,
  gclid text,
  wbraid text,
  gbraid text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  account_id text,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text,
  ad_name text,
  landing_page text,
  match_method text CHECK (match_method IS NULL OR match_method IN ('click_id','adflow_id','contact_key','utm_window','manual')),
  match_confidence numeric(5,4) CHECK (match_confidence IS NULL OR match_confidence BETWEEN 0 AND 1),
  occurred_at timestamptz NOT NULL,
  matched_at timestamptz,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, source, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_moai_touchpoints_client_time ON public.moai_lead_touchpoints (client_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_moai_touchpoints_deal ON public.moai_lead_touchpoints (crm_deal_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_moai_touchpoints_contact ON public.moai_lead_touchpoints (client_id, contact_key, occurred_at DESC) WHERE contact_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moai_touchpoints_click_ids ON public.moai_lead_touchpoints (client_id, gclid, fbclid) WHERE gclid IS NOT NULL OR fbclid IS NOT NULL;

ALTER TABLE public.moai_lead_touchpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moai_lead_touchpoints_service_all ON public.moai_lead_touchpoints;
CREATE POLICY moai_lead_touchpoints_service_all ON public.moai_lead_touchpoints
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS moai_lead_touchpoints_authorized_read ON public.moai_lead_touchpoints;
CREATE POLICY moai_lead_touchpoints_authorized_read ON public.moai_lead_touchpoints
  FOR SELECT TO authenticated USING (
    client_id IN (SELECT cm.client_id FROM public.client_members cm WHERE cm.user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.moai_user_access ua
      WHERE ua.user_id = (SELECT auth.uid()) AND ua.is_active = true
        AND (ua.expires_at IS NULL OR ua.expires_at > now())
        AND ua.role IN ('super_admin','agency_admin','moai_owner','moai_leadership','moai_marketing')
    )
  );

DROP POLICY IF EXISTS crm_deals_moai_authorized_read ON public.crm_deals;
CREATE POLICY crm_deals_moai_authorized_read ON public.crm_deals
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.moai_user_access ua ON ua.user_id = (SELECT auth.uid())
      WHERE c.id = crm_deals.client_id AND c.slug = 'moai' AND ua.is_active = true
        AND (ua.expires_at IS NULL OR ua.expires_at > now())
        AND ua.role IN ('super_admin','agency_admin','moai_owner','moai_leadership')
    )
  );

CREATE OR REPLACE VIEW public.vw_moai_cohort_maturity
WITH (security_invoker = true) AS
WITH deal_base AS (
  SELECT d.id, d.client_id, date_trunc('month', d.created_at)::date AS entry_month,
         d.created_at, d.closed_at, d.is_won, d.is_lost, COALESCE(d.value,0)::numeric AS value
  FROM public.crm_deals d JOIN public.clients c ON c.id = d.client_id
  WHERE c.slug = 'moai' AND d.created_at IS NOT NULL
), cohorts AS (
  SELECT client_id, entry_month, count(*)::integer AS cohort_size
  FROM deal_base GROUP BY client_id, entry_month
), ages AS (
  SELECT c.*, gs.age_month,
         c.entry_month + ((gs.age_month + 1)::text || ' month')::interval AS age_boundary
  FROM cohorts c
  CROSS JOIN LATERAL generate_series(
    0,
    LEAST(12, GREATEST(0,
      extract(year FROM age(current_date,c.entry_month))::integer * 12
      + extract(month FROM age(current_date,c.entry_month))::integer
    ))
  ) AS gs(age_month)
)
SELECT a.client_id, to_char(a.entry_month,'YYYY-MM') AS entry_ym, a.entry_month,
       a.age_month, a.cohort_size,
       count(*) FILTER (WHERE d.is_won AND d.closed_at < a.age_boundary)::integer AS won_cumulative,
       count(*) FILTER (WHERE d.is_lost AND d.closed_at < a.age_boundary)::integer AS lost_cumulative,
       (a.cohort_size - count(*) FILTER (WHERE (d.is_won OR d.is_lost) AND d.closed_at < a.age_boundary))::integer AS open_remaining,
       COALESCE(sum(d.value) FILTER (WHERE d.is_won AND d.closed_at < a.age_boundary),0)::numeric(14,2) AS revenue_cumulative,
       round(100.0 * count(*) FILTER (WHERE d.is_won AND d.closed_at < a.age_boundary) / NULLIF(a.cohort_size,0),2) AS won_rate_pct,
       round(100.0 * count(*) FILTER (WHERE (d.is_won OR d.is_lost) AND d.closed_at < a.age_boundary) / NULLIF(a.cohort_size,0),2) AS closed_rate_pct,
       round(avg(extract(epoch FROM (d.closed_at-d.created_at))/86400.0)
         FILTER (WHERE d.is_won AND d.closed_at < a.age_boundary),1) AS avg_days_to_win
FROM ages a JOIN deal_base d ON d.client_id = a.client_id AND d.entry_month = a.entry_month
GROUP BY a.client_id,a.entry_month,a.age_month,a.cohort_size
ORDER BY a.entry_month,a.age_month;

CREATE OR REPLACE VIEW public.vw_moai_attribution_performance
WITH (security_invoker = true) AS
WITH touches AS (
  SELECT client_id, date_trunc('month',occurred_at)::date AS touch_month, source,
         campaign_id, max(campaign_name) AS campaign_name,
         adset_id, max(adset_name) AS adset_name, ad_id, max(ad_name) AS ad_name,
         count(*)::integer AS touchpoints, count(DISTINCT crm_deal_id)::integer AS matched_deals
  FROM public.moai_lead_touchpoints
  GROUP BY client_id,date_trunc('month',occurred_at)::date,source,campaign_id,adset_id,ad_id
), matched AS (
  SELECT DISTINCT ON (t.client_id,t.source,t.campaign_id,t.adset_id,t.ad_id,t.crm_deal_id)
         t.client_id,date_trunc('month',t.occurred_at)::date AS touch_month,t.source,
         t.campaign_id,t.adset_id,t.ad_id,t.crm_deal_id,d.is_won,d.is_lost,d.value
  FROM public.moai_lead_touchpoints t JOIN public.crm_deals d ON d.id = t.crm_deal_id
  ORDER BY t.client_id,t.source,t.campaign_id,t.adset_id,t.ad_id,t.crm_deal_id,t.occurred_at
), outcomes AS (
  SELECT client_id,touch_month,source,campaign_id,adset_id,ad_id,
         count(*) FILTER (WHERE is_won)::integer AS won_deals,
         count(*) FILTER (WHERE is_lost)::integer AS lost_deals,
         COALESCE(sum(value) FILTER (WHERE is_won),0)::numeric(14,2) AS attributed_revenue
  FROM matched GROUP BY client_id,touch_month,source,campaign_id,adset_id,ad_id
)
SELECT t.*,COALESCE(o.won_deals,0) AS won_deals,COALESCE(o.lost_deals,0) AS lost_deals,
       COALESCE(o.attributed_revenue,0)::numeric(14,2) AS attributed_revenue
FROM touches t LEFT JOIN outcomes o USING (client_id,touch_month,source,campaign_id,adset_id,ad_id);

GRANT SELECT ON public.moai_lead_touchpoints TO authenticated;
GRANT SELECT ON public.vw_moai_cohort_maturity TO authenticated;
GRANT SELECT ON public.vw_moai_attribution_performance TO authenticated;
GRANT ALL ON public.moai_lead_touchpoints TO service_role;

COMMENT ON TABLE public.moai_lead_touchpoints IS 'Protected first-party touches linking Meta/Google/Maia events to Clint deals.';
COMMENT ON VIEW public.vw_moai_cohort_maturity IS 'Monthly deal cohorts from M+0 to M+12 using the full entry cohort as denominator.';
COMMENT ON VIEW public.vw_moai_attribution_performance IS 'Campaign/ad CRM outcomes and attributed revenue from matched first-party touches.';
