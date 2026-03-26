-- =====================================================
-- Ads Flow — Migration 013: Google Integration Tables
-- Efeito Digital — 2026-03-26
-- =====================================================
-- Google Ads, GA4, Search Console — tables, views, indexes, RLS
-- =====================================================

-- =========================
-- GOOGLE ACCOUNTS (OAuth tokens per platform)
-- =========================
CREATE TABLE IF NOT EXISTS public.google_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google_ads', 'ga4', 'search_console')),
  account_id TEXT NOT NULL,                -- Google Ads CID, GA4 property ID, or SC site URL
  account_name TEXT NOT NULL,
  access_token TEXT,                        -- encrypted at rest by Supabase vault
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disconnected', 'error')),
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, platform, account_id)
);

CREATE INDEX idx_google_accounts_user ON public.google_accounts(user_id);
CREATE INDEX idx_google_accounts_client ON public.google_accounts(client_id);
CREATE INDEX idx_google_accounts_status ON public.google_accounts(status);
CREATE INDEX idx_google_accounts_platform ON public.google_accounts(platform);

-- =========================
-- GOOGLE ADS CAMPAIGNS
-- =========================
CREATE TABLE IF NOT EXISTS public.google_ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id UUID NOT NULL REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'SEARCH' CHECK (campaign_type IN (
    'SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING', 'PERFORMANCE_MAX', 'DISCOVERY'
  )),
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  budget_amount NUMERIC(12,2),
  budget_type TEXT,                        -- DAILY, TOTAL
  bidding_strategy TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(google_account_id, campaign_id)
);

CREATE INDEX idx_gads_campaigns_account ON public.google_ads_campaigns(google_account_id);
CREATE INDEX idx_gads_campaigns_client ON public.google_ads_campaigns(client_id);
CREATE INDEX idx_gads_campaigns_status ON public.google_ads_campaigns(status);

-- =========================
-- GOOGLE ADS INSIGHTS (daily granularity)
-- =========================
CREATE TABLE IF NOT EXISTS public.google_ads_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id UUID NOT NULL REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  campaign_id TEXT NOT NULL,
  date DATE NOT NULL,

  -- Core metrics
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  conversions NUMERIC(10,2) NOT NULL DEFAULT 0,
  conversion_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  ctr NUMERIC(8,4) NOT NULL DEFAULT 0,
  avg_cpc NUMERIC(10,2) NOT NULL DEFAULT 0,
  avg_cpm NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Impression share
  impression_share NUMERIC(6,4),
  search_impression_share NUMERIC(6,4),
  search_budget_lost_is NUMERIC(6,4),
  search_rank_lost_is NUMERIC(6,4),

  -- Additional conversions
  all_conversions NUMERIC(10,2) NOT NULL DEFAULT 0,
  view_through_conversions BIGINT NOT NULL DEFAULT 0,
  interaction_rate NUMERIC(8,4) NOT NULL DEFAULT 0,

  -- Video
  video_views BIGINT NOT NULL DEFAULT 0,
  video_view_rate NUMERIC(8,4) NOT NULL DEFAULT 0,

  -- Calculated
  cost_per_conversion NUMERIC(10,2) NOT NULL DEFAULT 0,
  roas NUMERIC(8,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(google_account_id, campaign_id, date)
);

CREATE INDEX idx_gads_insights_account ON public.google_ads_insights(google_account_id);
CREATE INDEX idx_gads_insights_date ON public.google_ads_insights(date);
CREATE INDEX idx_gads_insights_campaign ON public.google_ads_insights(campaign_id);
CREATE INDEX idx_gads_insights_account_date ON public.google_ads_insights(google_account_id, date);

-- =========================
-- GOOGLE ADS KEYWORDS
-- =========================
CREATE TABLE IF NOT EXISTS public.google_ads_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id UUID NOT NULL REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  campaign_id TEXT NOT NULL,
  ad_group_id TEXT,
  ad_group_name TEXT,
  keyword_text TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'BROAD',

  -- Quality Score
  quality_score INT,
  expected_ctr_score TEXT,                 -- ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE
  ad_relevance_score TEXT,
  landing_page_score TEXT,

  -- Metrics
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  conversions NUMERIC(10,2) NOT NULL DEFAULT 0,
  ctr NUMERIC(8,4) NOT NULL DEFAULT 0,
  avg_cpc NUMERIC(10,2) NOT NULL DEFAULT 0,
  avg_position NUMERIC(6,2),

  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(google_account_id, keyword_text, match_type, date)
);

CREATE INDEX idx_gads_keywords_account ON public.google_ads_keywords(google_account_id);
CREATE INDEX idx_gads_keywords_campaign ON public.google_ads_keywords(campaign_id);
CREATE INDEX idx_gads_keywords_date ON public.google_ads_keywords(date);
CREATE INDEX idx_gads_keywords_qs ON public.google_ads_keywords(quality_score);

-- =========================
-- GA4 METRICS
-- =========================
CREATE TABLE IF NOT EXISTS public.ga4_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id UUID NOT NULL REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  property_id TEXT NOT NULL,
  date DATE NOT NULL,

  -- Traffic
  sessions BIGINT NOT NULL DEFAULT 0,
  users BIGINT NOT NULL DEFAULT 0,
  new_users BIGINT NOT NULL DEFAULT 0,
  active_users BIGINT NOT NULL DEFAULT 0,
  pageviews BIGINT NOT NULL DEFAULT 0,
  screen_page_views BIGINT NOT NULL DEFAULT 0,
  events_count BIGINT NOT NULL DEFAULT 0,

  -- Engagement
  engaged_sessions BIGINT NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
  avg_session_duration NUMERIC(10,2) NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(8,4) NOT NULL DEFAULT 0,

  -- Conversions
  conversions BIGINT NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Dimensions
  session_source TEXT,
  session_medium TEXT,
  session_campaign TEXT,
  device_category TEXT,
  country TEXT,
  city TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(google_account_id, property_id, date, session_source, session_medium, device_category)
);

CREATE INDEX idx_ga4_metrics_account ON public.ga4_metrics(google_account_id);
CREATE INDEX idx_ga4_metrics_date ON public.ga4_metrics(date);
CREATE INDEX idx_ga4_metrics_property ON public.ga4_metrics(property_id);
CREATE INDEX idx_ga4_metrics_account_date ON public.ga4_metrics(google_account_id, date);
CREATE INDEX idx_ga4_metrics_source ON public.ga4_metrics(session_source, session_medium);

-- =========================
-- SEARCH CONSOLE DATA
-- =========================
CREATE TABLE IF NOT EXISTS public.search_console_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id UUID NOT NULL REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  site_url TEXT NOT NULL,
  date DATE NOT NULL,
  query TEXT,
  page TEXT,

  -- Metrics
  clicks BIGINT NOT NULL DEFAULT 0,
  impressions BIGINT NOT NULL DEFAULT 0,
  ctr NUMERIC(8,4) NOT NULL DEFAULT 0,
  position NUMERIC(6,2) NOT NULL DEFAULT 0,

  -- Dimensions
  device TEXT,
  country TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(google_account_id, site_url, date, query, page, device)
);

CREATE INDEX idx_sc_data_account ON public.search_console_data(google_account_id);
CREATE INDEX idx_sc_data_date ON public.search_console_data(date);
CREATE INDEX idx_sc_data_site ON public.search_console_data(site_url);
CREATE INDEX idx_sc_data_account_date ON public.search_console_data(google_account_id, date);
CREATE INDEX idx_sc_data_query ON public.search_console_data(query);

-- =========================
-- VIEWS
-- =========================

-- Google Ads Summary (aggregated by campaign)
CREATE OR REPLACE VIEW public.vw_google_ads_summary AS
SELECT
  ga.client_id,
  ga.google_account_id,
  gc.campaign_id,
  gc.campaign_name,
  gc.campaign_type,
  gc.status,
  gc.budget_amount,
  SUM(gi.impressions) AS total_impressions,
  SUM(gi.clicks) AS total_clicks,
  SUM(gi.cost) AS total_cost,
  SUM(gi.conversions) AS total_conversions,
  SUM(gi.conversion_value) AS total_conversion_value,
  CASE WHEN SUM(gi.impressions) > 0
    THEN (SUM(gi.clicks)::NUMERIC / SUM(gi.impressions)) * 100
    ELSE 0
  END AS avg_ctr,
  CASE WHEN SUM(gi.clicks) > 0
    THEN SUM(gi.cost) / SUM(gi.clicks)
    ELSE 0
  END AS avg_cpc,
  CASE WHEN SUM(gi.cost) > 0
    THEN SUM(gi.conversion_value) / SUM(gi.cost)
    ELSE 0
  END AS roas,
  AVG(gi.impression_share) AS avg_impression_share,
  AVG(gi.search_impression_share) AS avg_search_impression_share,
  MIN(gi.date) AS date_from,
  MAX(gi.date) AS date_to
FROM public.google_ads_insights gi
JOIN public.google_ads_campaigns gc
  ON gc.google_account_id = gi.google_account_id AND gc.campaign_id = gi.campaign_id
JOIN public.google_accounts ga
  ON ga.id = gi.google_account_id
GROUP BY ga.client_id, ga.google_account_id, gc.campaign_id, gc.campaign_name,
         gc.campaign_type, gc.status, gc.budget_amount;

-- GA4 Traffic Summary (by source/medium)
CREATE OR REPLACE VIEW public.vw_ga4_traffic_summary AS
SELECT
  ga.client_id,
  gm.google_account_id,
  gm.property_id,
  COALESCE(gm.session_source, '(direct)') AS source,
  COALESCE(gm.session_medium, '(none)') AS medium,
  SUM(gm.sessions) AS total_sessions,
  SUM(gm.users) AS total_users,
  SUM(gm.new_users) AS total_new_users,
  SUM(gm.pageviews) AS total_pageviews,
  SUM(gm.engaged_sessions) AS total_engaged_sessions,
  CASE WHEN SUM(gm.sessions) > 0
    THEN SUM(gm.engaged_sessions)::NUMERIC / SUM(gm.sessions)
    ELSE 0
  END AS avg_engagement_rate,
  AVG(gm.avg_session_duration) AS avg_session_duration,
  SUM(gm.conversions) AS total_conversions,
  SUM(gm.total_revenue) AS total_revenue,
  MIN(gm.date) AS date_from,
  MAX(gm.date) AS date_to
FROM public.ga4_metrics gm
JOIN public.google_accounts ga ON ga.id = gm.google_account_id
GROUP BY ga.client_id, gm.google_account_id, gm.property_id,
         gm.session_source, gm.session_medium;

-- SEO Performance (top queries/pages)
CREATE OR REPLACE VIEW public.vw_seo_performance AS
SELECT
  ga.client_id,
  sc.google_account_id,
  sc.site_url,
  sc.query,
  sc.page,
  SUM(sc.clicks) AS total_clicks,
  SUM(sc.impressions) AS total_impressions,
  CASE WHEN SUM(sc.impressions) > 0
    THEN (SUM(sc.clicks)::NUMERIC / SUM(sc.impressions)) * 100
    ELSE 0
  END AS avg_ctr,
  AVG(sc.position) AS avg_position,
  MIN(sc.date) AS date_from,
  MAX(sc.date) AS date_to
FROM public.search_console_data sc
JOIN public.google_accounts ga ON ga.id = sc.google_account_id
GROUP BY ga.client_id, sc.google_account_id, sc.site_url, sc.query, sc.page;

-- =========================
-- ROW LEVEL SECURITY (RLS)
-- =========================

ALTER TABLE public.google_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_console_data ENABLE ROW LEVEL SECURITY;

-- Google Accounts: user manages own, or via client_members
CREATE POLICY "Users can manage own google accounts"
  ON public.google_accounts FOR ALL
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

-- Google Ads Campaigns: via google_accounts ownership
CREATE POLICY "Users can manage google ads campaigns"
  ON public.google_ads_campaigns FOR ALL
  USING (
    google_account_id IN (
      SELECT id FROM public.google_accounts WHERE user_id = auth.uid()
      UNION
      SELECT ga.id FROM public.google_accounts ga
      JOIN public.client_members cm ON cm.client_id = ga.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Google Ads Insights: same pattern
CREATE POLICY "Users can manage google ads insights"
  ON public.google_ads_insights FOR ALL
  USING (
    google_account_id IN (
      SELECT id FROM public.google_accounts WHERE user_id = auth.uid()
      UNION
      SELECT ga.id FROM public.google_accounts ga
      JOIN public.client_members cm ON cm.client_id = ga.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Google Ads Keywords
CREATE POLICY "Users can manage google ads keywords"
  ON public.google_ads_keywords FOR ALL
  USING (
    google_account_id IN (
      SELECT id FROM public.google_accounts WHERE user_id = auth.uid()
      UNION
      SELECT ga.id FROM public.google_accounts ga
      JOIN public.client_members cm ON cm.client_id = ga.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- GA4 Metrics
CREATE POLICY "Users can manage ga4 metrics"
  ON public.ga4_metrics FOR ALL
  USING (
    google_account_id IN (
      SELECT id FROM public.google_accounts WHERE user_id = auth.uid()
      UNION
      SELECT ga.id FROM public.google_accounts ga
      JOIN public.client_members cm ON cm.client_id = ga.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Search Console Data
CREATE POLICY "Users can manage search console data"
  ON public.search_console_data FOR ALL
  USING (
    google_account_id IN (
      SELECT id FROM public.google_accounts WHERE user_id = auth.uid()
      UNION
      SELECT ga.id FROM public.google_accounts ga
      JOIN public.client_members cm ON cm.client_id = ga.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- =========================
-- UPDATED_AT TRIGGERS
-- =========================
CREATE TRIGGER update_google_accounts_updated_at
  BEFORE UPDATE ON public.google_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_ads_campaigns_updated_at
  BEFORE UPDATE ON public.google_ads_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
