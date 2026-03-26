-- 009_security_fixes.sql
-- Security hardening + performance indexes + RPC aggregation functions

-- 1. Protect users table: only super_admin can change role/is_active
-- First drop the existing overly-permissive update policy if it exists
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- Users can only update their own name, phone, avatar_url
CREATE POLICY "users_update_own_profile" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM public.users WHERE id = auth.uid())
  );

-- Super admin can update any user's role and is_active
CREATE POLICY "super_admin_update_users" ON public.users
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
  );

-- 2. Rate limit flow_events: add payload size constraint
ALTER TABLE public.flow_events ADD CONSTRAINT flow_events_data_size
  CHECK (pg_column_size(data) < 4096);

-- 3. Update BI tables RLS to include client_id isolation
-- Drop old policies and create new ones with client_id check
DROP POLICY IF EXISTS "Users can manage leads" ON public.leads;
CREATE POLICY "Users can manage own client leads" ON public.leads
  FOR ALL USING (
    user_id = auth.uid()
    OR client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage oportunidades" ON public.oportunidades;
CREATE POLICY "Users can manage own client oportunidades" ON public.oportunidades
  FOR ALL USING (
    user_id = auth.uid()
    OR client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view vendedores" ON public.vendedores;
CREATE POLICY "Users can view own client vendedores" ON public.vendedores
  FOR SELECT USING (
    user_id = auth.uid()
    OR client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid())
  );

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS idx_ci_account_date ON campaign_insights (ad_account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ci_account_campaign_date ON campaign_insights (ad_account_id, campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_account_date ON adset_insights (ad_account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_adi_account_date ON ad_insights (ad_account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_dashboards_user_client ON dashboards (user_id, client_id);
CREATE INDEX IF NOT EXISTS idx_leads_client ON leads (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oportunidades_client ON oportunidades (client_id, created_at DESC);

-- 5. RPC function for aggregated metrics (replaces JS-side aggregation)
CREATE OR REPLACE FUNCTION aggregate_campaign_metrics(
  p_ad_account_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_campaign_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'impressions', COALESCE(SUM(impressions), 0),
    'reach', COALESCE(SUM(reach), 0),
    'clicks', COALESCE(SUM(clicks), 0),
    'spend', COALESCE(SUM(spend), 0),
    'conversions', COALESCE(SUM(conversions), 0),
    'conversion_value', COALESCE(SUM(conversion_value), 0),
    'leads', COALESCE(SUM(leads), 0),
    'engagement', COALESCE(SUM(engagement), 0),
    'video_views', COALESCE(SUM(video_views), 0),
    'frequency', CASE WHEN SUM(reach) > 0 THEN SUM(impressions)::float / SUM(reach) ELSE 0 END,
    'ctr', CASE WHEN SUM(impressions) > 0 THEN (SUM(clicks)::float / SUM(impressions)) * 100 ELSE 0 END,
    'cpc', CASE WHEN SUM(clicks) > 0 THEN SUM(spend) / SUM(clicks) ELSE 0 END,
    'cpm', CASE WHEN SUM(impressions) > 0 THEN (SUM(spend) / SUM(impressions)) * 1000 ELSE 0 END,
    'roas', CASE WHEN SUM(spend) > 0 THEN SUM(conversion_value) / SUM(spend) ELSE 0 END,
    'cost_per_lead', CASE WHEN SUM(leads) > 0 THEN SUM(spend) / SUM(leads) ELSE 0 END,
    'cost_per_conversion', CASE WHEN SUM(conversions) > 0 THEN SUM(spend) / SUM(conversions) ELSE 0 END
  ) INTO result
  FROM campaign_insights
  WHERE ad_account_id = p_ad_account_id
    AND date BETWEEN p_date_from AND p_date_to
    AND (p_campaign_ids IS NULL OR campaign_id = ANY(p_campaign_ids));

  RETURN result;
END;
$$;

-- 6. RPC function for daily metrics
CREATE OR REPLACE FUNCTION get_daily_metrics(
  p_ad_account_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT
      date,
      SUM(impressions) as impressions,
      SUM(clicks) as clicks,
      SUM(spend) as spend,
      SUM(conversions) as conversions,
      SUM(leads) as leads,
      SUM(conversion_value) as conversion_value,
      CASE WHEN SUM(impressions) > 0 THEN (SUM(clicks)::float / SUM(impressions)) * 100 ELSE 0 END as ctr,
      CASE WHEN SUM(clicks) > 0 THEN SUM(spend) / SUM(clicks) ELSE 0 END as cpc
    FROM campaign_insights
    WHERE ad_account_id = p_ad_account_id
      AND date BETWEEN p_date_from AND p_date_to
    GROUP BY date
    ORDER BY date
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;
