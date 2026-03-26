-- =====================================================
-- 016_demographics.sql
-- Demographics breakdown data (from Meta/Google API breakdowns)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.campaign_demographics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  campaign_id TEXT,

  date DATE NOT NULL,
  dimension TEXT NOT NULL, -- 'age', 'gender', 'device', 'placement', 'hour', 'region'
  dimension_value TEXT NOT NULL, -- '18-24', 'female', 'mobile', 'feed', '14', 'SP'

  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(12,2) DEFAULT 0,
  reach BIGINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id, campaign_id, date, dimension, dimension_value)
);

ALTER TABLE campaign_demographics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_access" ON campaign_demographics FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));
CREATE INDEX idx_cd_account_date ON campaign_demographics (ad_account_id, date DESC, dimension);
