-- =====================================================
-- Ads Flow — Migration 018: Multi-Platform Integration
-- Efeito Digital — 2026-04-01
-- =====================================================
-- YouTube, GMB, Kommo CRM, LinkedIn — tables, indexes, RLS
-- =====================================================
-- NOTE: googleAuthService.ts GOOGLE_SCOPES should be updated to include:
--   YouTube: 'https://www.googleapis.com/auth/youtube.readonly',
--            'https://www.googleapis.com/auth/yt-analytics.readonly'
--   GMB:     'https://www.googleapis.com/auth/business.manage'
-- =====================================================

-- =========================
-- UPDATE GOOGLE_ACCOUNTS PLATFORM CONSTRAINT
-- =========================
ALTER TABLE public.google_accounts DROP CONSTRAINT IF EXISTS google_accounts_platform_check;
ALTER TABLE public.google_accounts ADD CONSTRAINT google_accounts_platform_check
  CHECK (platform IN ('google_ads', 'ga4', 'search_console', 'youtube', 'gmb'));

-- =========================
-- YOUTUBE METRICS
-- =========================
CREATE TABLE IF NOT EXISTS public.youtube_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id UUID NOT NULL REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  channel_id TEXT NOT NULL,
  date DATE NOT NULL,
  views BIGINT DEFAULT 0,
  subscribers_gained INT DEFAULT 0,
  subscribers_lost INT DEFAULT 0,
  watch_time_minutes BIGINT DEFAULT 0,
  avg_view_duration NUMERIC(10,2) DEFAULT 0,
  likes BIGINT DEFAULT 0,
  dislikes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  estimated_revenue NUMERIC(12,2) DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  impressions_ctr NUMERIC(8,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(google_account_id, channel_id, date)
);

CREATE INDEX idx_yt_metrics_account ON public.youtube_metrics(google_account_id);
CREATE INDEX idx_yt_metrics_date ON public.youtube_metrics(date);
CREATE INDEX idx_yt_metrics_channel ON public.youtube_metrics(channel_id);
CREATE INDEX idx_yt_metrics_account_date ON public.youtube_metrics(google_account_id, date);

-- =========================
-- YOUTUBE VIDEOS CACHE
-- =========================
CREATE TABLE IF NOT EXISTS public.youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id UUID NOT NULL REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  duration TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(google_account_id, video_id)
);

CREATE INDEX idx_yt_videos_account ON public.youtube_videos(google_account_id);
CREATE INDEX idx_yt_videos_published ON public.youtube_videos(published_at);

-- =========================
-- GMB METRICS
-- =========================
CREATE TABLE IF NOT EXISTS public.gmb_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id UUID NOT NULL REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  location_id TEXT NOT NULL,
  date DATE NOT NULL,
  search_views BIGINT DEFAULT 0,
  map_views BIGINT DEFAULT 0,
  website_clicks BIGINT DEFAULT 0,
  phone_calls BIGINT DEFAULT 0,
  direction_requests BIGINT DEFAULT 0,
  photo_views BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(google_account_id, location_id, date)
);

CREATE INDEX idx_gmb_metrics_account ON public.gmb_metrics(google_account_id);
CREATE INDEX idx_gmb_metrics_date ON public.gmb_metrics(date);
CREATE INDEX idx_gmb_metrics_location ON public.gmb_metrics(location_id);
CREATE INDEX idx_gmb_metrics_account_date ON public.gmb_metrics(google_account_id, date);

-- =========================
-- GMB REVIEWS
-- =========================
CREATE TABLE IF NOT EXISTS public.gmb_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id UUID NOT NULL REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  review_id TEXT NOT NULL,
  reviewer_name TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reply TEXT,
  create_time TIMESTAMPTZ,
  update_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(google_account_id, review_id)
);

CREATE INDEX idx_gmb_reviews_account ON public.gmb_reviews(google_account_id);
CREATE INDEX idx_gmb_reviews_rating ON public.gmb_reviews(rating);

-- =========================
-- KOMMO CRM CONFIGS
-- =========================
CREATE TABLE IF NOT EXISTS public.kommo_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_token TEXT NOT NULL,
  subdomain TEXT NOT NULL,
  pipeline_ids TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id)
);

CREATE INDEX idx_kommo_configs_user ON public.kommo_configs(user_id);
CREATE INDEX idx_kommo_configs_client ON public.kommo_configs(client_id);
CREATE INDEX idx_kommo_configs_status ON public.kommo_configs(status);

-- =========================
-- KOMMO LEADS CACHE
-- =========================
CREATE TABLE IF NOT EXISTS public.kommo_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kommo_config_id UUID NOT NULL REFERENCES public.kommo_configs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  lead_id BIGINT NOT NULL,
  name TEXT,
  pipeline_id BIGINT,
  pipeline_name TEXT,
  status_id BIGINT,
  status_name TEXT,
  responsible_user_id BIGINT,
  responsible_user_name TEXT,
  price NUMERIC(12,2) DEFAULT 0,
  source TEXT,
  created_at_kommo TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  loss_reason TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kommo_config_id, lead_id)
);

CREATE INDEX idx_kommo_leads_config ON public.kommo_leads(kommo_config_id);
CREATE INDEX idx_kommo_leads_client ON public.kommo_leads(client_id);
CREATE INDEX idx_kommo_leads_pipeline ON public.kommo_leads(pipeline_id);
CREATE INDEX idx_kommo_leads_status ON public.kommo_leads(status_id);

-- =========================
-- LINKEDIN CONFIGS
-- =========================
CREATE TABLE IF NOT EXISTS public.linkedin_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  organization_id TEXT NOT NULL,
  organization_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id)
);

CREATE INDEX idx_linkedin_configs_user ON public.linkedin_configs(user_id);
CREATE INDEX idx_linkedin_configs_client ON public.linkedin_configs(client_id);
CREATE INDEX idx_linkedin_configs_status ON public.linkedin_configs(status);

-- =========================
-- LINKEDIN METRICS
-- =========================
CREATE TABLE IF NOT EXISTS public.linkedin_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_config_id UUID NOT NULL REFERENCES public.linkedin_configs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  followers INT DEFAULT 0,
  follower_growth INT DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  engagement BIGINT DEFAULT 0,
  reactions BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(linkedin_config_id, date)
);

CREATE INDEX idx_linkedin_metrics_config ON public.linkedin_metrics(linkedin_config_id);
CREATE INDEX idx_linkedin_metrics_date ON public.linkedin_metrics(date);
CREATE INDEX idx_linkedin_metrics_client ON public.linkedin_metrics(client_id);

-- =========================
-- ROW LEVEL SECURITY (RLS)
-- =========================

ALTER TABLE public.youtube_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmb_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmb_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_metrics ENABLE ROW LEVEL SECURITY;

-- YouTube Metrics: via google_accounts ownership
CREATE POLICY "Users can manage youtube metrics"
  ON public.youtube_metrics FOR ALL
  USING (
    google_account_id IN (
      SELECT id FROM public.google_accounts WHERE user_id = auth.uid()
      UNION
      SELECT ga.id FROM public.google_accounts ga
      JOIN public.client_members cm ON cm.client_id = ga.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- YouTube Videos: via google_accounts ownership
CREATE POLICY "Users can manage youtube videos"
  ON public.youtube_videos FOR ALL
  USING (
    google_account_id IN (
      SELECT id FROM public.google_accounts WHERE user_id = auth.uid()
      UNION
      SELECT ga.id FROM public.google_accounts ga
      JOIN public.client_members cm ON cm.client_id = ga.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- GMB Metrics: via google_accounts ownership
CREATE POLICY "Users can manage gmb metrics"
  ON public.gmb_metrics FOR ALL
  USING (
    google_account_id IN (
      SELECT id FROM public.google_accounts WHERE user_id = auth.uid()
      UNION
      SELECT ga.id FROM public.google_accounts ga
      JOIN public.client_members cm ON cm.client_id = ga.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- GMB Reviews: via google_accounts ownership
CREATE POLICY "Users can manage gmb reviews"
  ON public.gmb_reviews FOR ALL
  USING (
    google_account_id IN (
      SELECT id FROM public.google_accounts WHERE user_id = auth.uid()
      UNION
      SELECT ga.id FROM public.google_accounts ga
      JOIN public.client_members cm ON cm.client_id = ga.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Kommo Configs: user manages own or via client_members
CREATE POLICY "Users can manage own kommo configs"
  ON public.kommo_configs FOR ALL
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

-- Kommo Leads: via kommo_configs ownership
CREATE POLICY "Users can manage kommo leads"
  ON public.kommo_leads FOR ALL
  USING (
    kommo_config_id IN (
      SELECT id FROM public.kommo_configs WHERE user_id = auth.uid()
      UNION
      SELECT kc.id FROM public.kommo_configs kc
      JOIN public.client_members cm ON cm.client_id = kc.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- LinkedIn Configs: user manages own or via client_members
CREATE POLICY "Users can manage own linkedin configs"
  ON public.linkedin_configs FOR ALL
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

-- LinkedIn Metrics: via linkedin_configs ownership
CREATE POLICY "Users can manage linkedin metrics"
  ON public.linkedin_metrics FOR ALL
  USING (
    linkedin_config_id IN (
      SELECT id FROM public.linkedin_configs WHERE user_id = auth.uid()
      UNION
      SELECT lc.id FROM public.linkedin_configs lc
      JOIN public.client_members cm ON cm.client_id = lc.client_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- =========================
-- UPDATED_AT TRIGGERS
-- =========================
CREATE TRIGGER update_kommo_configs_updated_at
  BEFORE UPDATE ON public.kommo_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_linkedin_configs_updated_at
  BEFORE UPDATE ON public.linkedin_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_youtube_videos_updated_at
  BEFORE UPDATE ON public.youtube_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
