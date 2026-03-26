-- =============================================
-- CONVERSION TRUTH ENGINE
-- Bridges the gap between platform-reported conversions
-- and actual business results (CRM leads, real sales)
-- =============================================

-- 1. Lead Attribution — connects ad clicks to real CRM leads
CREATE TABLE IF NOT EXISTS public.lead_attribution (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- The real lead (from CRM or manual entry)
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  lead_source TEXT, -- 'crm_kommo', 'crm_rd', 'manual', 'whatsapp', 'form'
  lead_name TEXT,
  lead_email TEXT,
  lead_phone TEXT,
  lead_created_at TIMESTAMPTZ,

  -- Attribution to ad platform
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE SET NULL,
  platform TEXT, -- 'meta_ads', 'google_ads', 'organic', 'direct', 'referral'
  campaign_id UUID,
  campaign_name TEXT,
  adset_id TEXT,
  adset_name TEXT,
  ad_id TEXT,
  ad_name TEXT,

  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Landing page info
  landing_page_url TEXT,
  referrer_url TEXT,

  -- Attribution model
  attribution_model TEXT DEFAULT 'last_click', -- 'first_click', 'last_click', 'linear', 'time_decay'
  attribution_weight NUMERIC(5,4) DEFAULT 1.0, -- For multi-touch: 0.0-1.0

  -- Conversion tracking
  conversion_type TEXT, -- 'form_submit', 'whatsapp_click', 'phone_call', 'chat', 'purchase'
  conversion_value NUMERIC(12,2) DEFAULT 0,
  is_qualified BOOLEAN DEFAULT false, -- Manual flag: was this a REAL lead?
  qualification_notes TEXT,
  qualified_at TIMESTAMPTZ,
  qualified_by UUID REFERENCES users(id),

  -- Lifecycle
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Platform Reported Metrics — what Google/Meta SAYS happened
CREATE TABLE IF NOT EXISTS public.platform_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'meta_ads', 'google_ads'

  date DATE NOT NULL,
  campaign_id TEXT,
  campaign_name TEXT,
  adset_name TEXT,

  -- What the platform reports
  reported_conversions INTEGER DEFAULT 0,
  reported_conversion_value NUMERIC(12,2) DEFAULT 0,
  reported_leads INTEGER DEFAULT 0,
  reported_roas NUMERIC(8,4) DEFAULT 0,

  -- Conversion action details
  conversion_action TEXT, -- 'WhatsApp Click', 'Form Submit', 'Purchase', 'Page View'
  conversion_category TEXT, -- 'lead', 'purchase', 'engagement', 'other'

  spend NUMERIC(12,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ad_account_id, date, campaign_id, conversion_action)
);

-- 3. Conversion Truth Summary View — THE MONEY VIEW
CREATE OR REPLACE VIEW public.vw_conversion_truth AS
SELECT
  la.client_id,
  la.platform,
  la.campaign_name,
  la.utm_campaign,
  DATE_TRUNC('month', la.created_at) AS month,

  -- Real metrics (from CRM/attribution)
  COUNT(la.id) AS real_leads,
  COUNT(la.id) FILTER (WHERE la.is_qualified) AS qualified_leads,
  SUM(la.conversion_value) AS real_revenue,

  -- Platform metrics (from platform_conversions)
  COALESCE(pc.reported_conversions, 0) AS platform_conversions,
  COALESCE(pc.reported_leads, 0) AS platform_leads,
  COALESCE(pc.spend, 0) AS total_spend,

  -- Truth Gap
  COUNT(la.id) - COALESCE(pc.reported_leads, 0) AS lead_gap,
  CASE WHEN COALESCE(pc.reported_leads, 0) > 0
    THEN ROUND((COUNT(la.id)::numeric / pc.reported_leads) * 100, 1)
    ELSE 0
  END AS reality_rate, -- "Only X% of reported leads are real"

  -- Real CPL vs Reported CPL
  CASE WHEN COUNT(la.id) > 0
    THEN ROUND(COALESCE(pc.spend, 0) / COUNT(la.id), 2)
    ELSE 0
  END AS real_cpl,
  CASE WHEN COALESCE(pc.reported_leads, 0) > 0
    THEN ROUND(COALESCE(pc.spend, 0) / pc.reported_leads, 2)
    ELSE 0
  END AS reported_cpl,

  -- Real ROAS vs Reported ROAS
  CASE WHEN COALESCE(pc.spend, 0) > 0
    THEN ROUND(SUM(la.conversion_value) / pc.spend, 2)
    ELSE 0
  END AS real_roas,
  COALESCE(pc.reported_roas, 0) AS reported_roas

FROM lead_attribution la
LEFT JOIN LATERAL (
  SELECT
    SUM(reported_conversions) AS reported_conversions,
    SUM(reported_leads) AS reported_leads,
    SUM(spend) AS spend,
    AVG(reported_roas) AS reported_roas
  FROM platform_conversions pc2
  WHERE pc2.client_id = la.client_id
    AND pc2.campaign_name = la.campaign_name
    AND DATE_TRUNC('month', pc2.date) = DATE_TRUNC('month', la.created_at)
) pc ON true
GROUP BY la.client_id, la.platform, la.campaign_name, la.utm_campaign,
         DATE_TRUNC('month', la.created_at), pc.reported_conversions,
         pc.reported_leads, pc.spend, pc.reported_roas;

-- 4. Conversion Quality Score per campaign
CREATE OR REPLACE VIEW public.vw_conversion_quality AS
SELECT
  client_id,
  ad_account_id,
  campaign_name,
  platform,
  COUNT(*) AS total_attributed,
  COUNT(*) FILTER (WHERE is_qualified) AS qualified_count,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE is_qualified)::numeric / COUNT(*)) * 100, 0)
    ELSE 0
  END AS quality_score, -- 0-100: what % of attributed leads are actually qualified
  ROUND(AVG(conversion_value) FILTER (WHERE conversion_value > 0), 2) AS avg_deal_value,
  MODE() WITHIN GROUP (ORDER BY conversion_type) AS primary_conversion_type,
  MODE() WITHIN GROUP (ORDER BY lead_source) AS primary_lead_source
FROM lead_attribution
GROUP BY client_id, ad_account_id, campaign_name, platform;

-- Indexes
CREATE INDEX idx_la_client ON lead_attribution (client_id, created_at DESC);
CREATE INDEX idx_la_campaign ON lead_attribution (campaign_name, created_at DESC);
CREATE INDEX idx_la_utm ON lead_attribution (utm_source, utm_campaign);
CREATE INDEX idx_pc_client_date ON platform_conversions (client_id, date DESC);
CREATE INDEX idx_pc_campaign ON platform_conversions (campaign_name, date DESC);

-- RLS
ALTER TABLE lead_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own client attributions" ON lead_attribution
  FOR ALL USING (
    client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own client platform conversions" ON platform_conversions
  FOR ALL USING (
    client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid())
  );
