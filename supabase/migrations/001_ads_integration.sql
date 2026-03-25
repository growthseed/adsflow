-- =====================================================
-- Ads Flow — Migration 001: Ads Integration Tables
-- Efeito Digital — 2026-02-16
-- =====================================================
-- Cria tabelas para integração com Meta Ads / Google Ads:
-- ad_accounts, campaigns_cache, campaign_insights,
-- adset_insights, ad_insights, sync_logs
-- =====================================================

-- =========================
-- AD ACCOUNTS
-- =========================
CREATE TABLE IF NOT EXISTS public.ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta_ads', 'google_ads')),
  account_id TEXT NOT NULL,            -- ex: act_433655990500782
  account_name TEXT NOT NULL,
  access_token TEXT,                    -- token criptografado (nullable — N8N pode gerenciar)
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  currency TEXT NOT NULL DEFAULT 'BRL',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disconnected', 'error')),
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Cada user só pode conectar a mesma conta de plataforma uma vez
  UNIQUE(user_id, platform, account_id)
);

CREATE INDEX idx_ad_accounts_user ON public.ad_accounts(user_id);
CREATE INDEX idx_ad_accounts_client ON public.ad_accounts(client_id);
CREATE INDEX idx_ad_accounts_status ON public.ad_accounts(status);

-- =========================
-- CAMPAIGNS CACHE
-- =========================
CREATE TABLE IF NOT EXISTS public.campaigns_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  platform_campaign_id TEXT NOT NULL,   -- ID na plataforma (Meta/Google)
  name TEXT NOT NULL,
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  daily_budget NUMERIC,
  lifetime_budget NUMERIC,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique por conta + campaign
  UNIQUE(ad_account_id, platform_campaign_id)
);

CREATE INDEX idx_campaigns_cache_account ON public.campaigns_cache(ad_account_id);

-- =========================
-- CAMPAIGN INSIGHTS (métricas diárias por campanha)
-- =========================
CREATE TABLE IF NOT EXISTS public.campaign_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns_cache(id) ON DELETE CASCADE,
  platform_campaign_id TEXT NOT NULL,
  date DATE NOT NULL,

  -- Core metrics
  impressions BIGINT NOT NULL DEFAULT 0,
  reach BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  ctr NUMERIC(8,4) NOT NULL DEFAULT 0,
  cpc NUMERIC(10,2) NOT NULL DEFAULT 0,
  cpm NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Conversions
  conversions BIGINT NOT NULL DEFAULT 0,
  conversion_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_per_conversion NUMERIC(10,2) NOT NULL DEFAULT 0,
  roas NUMERIC(8,2) NOT NULL DEFAULT 0,
  frequency NUMERIC(6,2) NOT NULL DEFAULT 0,

  -- Engagement
  engagement BIGINT NOT NULL DEFAULT 0,
  post_reactions BIGINT NOT NULL DEFAULT 0,
  post_comments BIGINT NOT NULL DEFAULT 0,
  post_shares BIGINT NOT NULL DEFAULT 0,

  -- Video
  video_views BIGINT NOT NULL DEFAULT 0,
  video_thruplay BIGINT NOT NULL DEFAULT 0,

  -- Leads
  leads BIGINT NOT NULL DEFAULT 0,
  cost_per_lead NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Metadata
  breakdown JSONB,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique por conta + campanha + data
  UNIQUE(ad_account_id, platform_campaign_id, date)
);

CREATE INDEX idx_campaign_insights_account ON public.campaign_insights(ad_account_id);
CREATE INDEX idx_campaign_insights_campaign ON public.campaign_insights(campaign_id);
CREATE INDEX idx_campaign_insights_date ON public.campaign_insights(date);
CREATE INDEX idx_campaign_insights_lookup ON public.campaign_insights(ad_account_id, date);

-- =========================
-- ADSET INSIGHTS (métricas diárias por conjunto de anúncios)
-- =========================
CREATE TABLE IF NOT EXISTS public.adset_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns_cache(id) ON DELETE CASCADE,
  platform_adset_id TEXT NOT NULL,
  adset_name TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,

  -- Metrics
  impressions BIGINT NOT NULL DEFAULT 0,
  reach BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  ctr NUMERIC(8,4) NOT NULL DEFAULT 0,
  cpc NUMERIC(10,2) NOT NULL DEFAULT 0,
  cpm NUMERIC(10,2) NOT NULL DEFAULT 0,
  conversions BIGINT NOT NULL DEFAULT 0,
  cost_per_conversion NUMERIC(10,2) NOT NULL DEFAULT 0,
  roas NUMERIC(8,2) NOT NULL DEFAULT 0,
  leads BIGINT NOT NULL DEFAULT 0,
  cost_per_lead NUMERIC(10,2) NOT NULL DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(ad_account_id, platform_adset_id, date)
);

CREATE INDEX idx_adset_insights_account ON public.adset_insights(ad_account_id);
CREATE INDEX idx_adset_insights_campaign ON public.adset_insights(campaign_id);
CREATE INDEX idx_adset_insights_date ON public.adset_insights(date);

-- =========================
-- AD INSIGHTS (métricas diárias por anúncio individual)
-- =========================
CREATE TABLE IF NOT EXISTS public.ad_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns_cache(id) ON DELETE CASCADE,
  platform_adset_id TEXT NOT NULL DEFAULT '',
  platform_ad_id TEXT NOT NULL,
  ad_name TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,

  -- Core metrics
  impressions BIGINT NOT NULL DEFAULT 0,
  reach BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  ctr NUMERIC(8,4) NOT NULL DEFAULT 0,
  cpc NUMERIC(10,2) NOT NULL DEFAULT 0,
  cpm NUMERIC(10,2) NOT NULL DEFAULT 0,
  conversions BIGINT NOT NULL DEFAULT 0,
  cost_per_conversion NUMERIC(10,2) NOT NULL DEFAULT 0,
  roas NUMERIC(8,2) NOT NULL DEFAULT 0,

  -- Criativos
  hook_rate NUMERIC(6,2),             -- 3s views / impressions
  hold_rate NUMERIC(6,2),             -- 75% views / impressions

  -- Engagement
  engagement BIGINT NOT NULL DEFAULT 0,
  post_reactions BIGINT NOT NULL DEFAULT 0,
  post_comments BIGINT NOT NULL DEFAULT 0,
  post_shares BIGINT NOT NULL DEFAULT 0,
  post_saves BIGINT NOT NULL DEFAULT 0,

  -- Video
  video_views BIGINT NOT NULL DEFAULT 0,
  video_thruplay BIGINT NOT NULL DEFAULT 0,
  video_p25 BIGINT NOT NULL DEFAULT 0,
  video_p50 BIGINT NOT NULL DEFAULT 0,
  video_p75 BIGINT NOT NULL DEFAULT 0,
  video_p100 BIGINT NOT NULL DEFAULT 0,

  -- Creative info
  creative_id TEXT,
  creative_thumbnail_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(ad_account_id, platform_ad_id, date)
);

CREATE INDEX idx_ad_insights_account ON public.ad_insights(ad_account_id);
CREATE INDEX idx_ad_insights_campaign ON public.ad_insights(campaign_id);
CREATE INDEX idx_ad_insights_date ON public.ad_insights(date);

-- =========================
-- SYNC LOGS
-- =========================
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed')),
  campaigns_synced INT NOT NULL DEFAULT 0,
  adsets_synced INT NOT NULL DEFAULT 0,
  ads_synced INT NOT NULL DEFAULT 0,
  insights_synced INT NOT NULL DEFAULT 0,
  date_range_start DATE,
  date_range_end DATE,
  error_message TEXT,
  duration_ms INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_logs_account ON public.sync_logs(ad_account_id);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status);

-- =========================
-- REPORTS (salvar relatórios gerados)
-- =========================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL DEFAULT 'campaign_overview',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'error', 'archived')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics TEXT[] NOT NULL DEFAULT '{}',
  data JSONB,                          -- dados gerados do relatório
  share_token TEXT UNIQUE,             -- token para link compartilhável
  share_expires_at TIMESTAMPTZ,
  schedule JSONB,                      -- config de agendamento
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_user ON public.reports(user_id);
CREATE INDEX idx_reports_client ON public.reports(client_id);
CREATE INDEX idx_reports_share ON public.reports(share_token);

-- =========================
-- ROW LEVEL SECURITY (RLS)
-- =========================

ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adset_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- AD ACCOUNTS: user pode ver/editar suas próprias contas
CREATE POLICY "Users can manage own ad accounts"
  ON public.ad_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CAMPAIGNS_CACHE: user pode ver campanhas das suas contas
CREATE POLICY "Users can view own campaigns"
  ON public.campaigns_cache FOR SELECT
  USING (
    ad_account_id IN (
      SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own campaigns"
  ON public.campaigns_cache FOR ALL
  USING (
    ad_account_id IN (
      SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()
    )
  );

-- CAMPAIGN_INSIGHTS: user pode ver insights das suas contas
CREATE POLICY "Users can view own campaign insights"
  ON public.campaign_insights FOR SELECT
  USING (
    ad_account_id IN (
      SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own campaign insights"
  ON public.campaign_insights FOR ALL
  USING (
    ad_account_id IN (
      SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()
    )
  );

-- ADSET_INSIGHTS: mesma lógica
CREATE POLICY "Users can view own adset insights"
  ON public.adset_insights FOR SELECT
  USING (
    ad_account_id IN (
      SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own adset insights"
  ON public.adset_insights FOR ALL
  USING (
    ad_account_id IN (
      SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()
    )
  );

-- AD_INSIGHTS: mesma lógica
CREATE POLICY "Users can view own ad insights"
  ON public.ad_insights FOR SELECT
  USING (
    ad_account_id IN (
      SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own ad insights"
  ON public.ad_insights FOR ALL
  USING (
    ad_account_id IN (
      SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()
    )
  );

-- SYNC_LOGS: user pode ver logs das suas contas
CREATE POLICY "Users can view own sync logs"
  ON public.sync_logs FOR SELECT
  USING (
    ad_account_id IN (
      SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own sync logs"
  ON public.sync_logs FOR ALL
  USING (
    ad_account_id IN (
      SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()
    )
  );

-- REPORTS: user pode ver/editar seus próprios relatórios
CREATE POLICY "Users can manage own reports"
  ON public.reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- REPORTS: qualquer um com share_token pode ver (para links compartilháveis)
CREATE POLICY "Anyone can view shared reports"
  ON public.reports FOR SELECT
  USING (
    share_token IS NOT NULL
    AND (share_expires_at IS NULL OR share_expires_at > now())
  );

-- =========================
-- UPDATED_AT TRIGGER
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ad_accounts_updated_at
  BEFORE UPDATE ON public.ad_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_cache_updated_at
  BEFORE UPDATE ON public.campaigns_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
