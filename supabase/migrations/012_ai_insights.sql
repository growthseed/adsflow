-- =====================================================
-- 012_ai_insights.sql
-- AI-generated insights and anomaly detection
-- + Report schedule configuration table
-- =====================================================

-- AI Insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE SET NULL,

  type TEXT NOT NULL, -- 'anomaly', 'opportunity', 'alert', 'trend', 'recommendation'
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical', 'success'
  category TEXT, -- 'cost', 'performance', 'creative', 'audience', 'budget'

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Metric context
  metric TEXT, -- 'cpc', 'ctr', 'roas', 'cpl', 'spend', 'conversions'
  current_value NUMERIC(12,4),
  baseline_value NUMERIC(12,4),
  deviation_pct NUMERIC(8,2),

  -- Campaign context
  campaign_name TEXT,
  campaign_id TEXT,

  -- Action recommendations
  recommendations JSONB DEFAULT '[]', -- array of strings

  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  is_actioned BOOLEAN DEFAULT false,
  actioned_at TIMESTAMPTZ,
  actioned_by UUID REFERENCES users(id),

  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- insights can expire
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report schedule configuration
CREATE TABLE IF NOT EXISTS public.report_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'biweekly', 'monthly'
  day_of_week INTEGER, -- 0=Sun, 1=Mon... (for weekly)
  day_of_month INTEGER, -- 1-28 (for monthly)
  time_of_day TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'America/Sao_Paulo',

  -- Recipients
  recipients JSONB DEFAULT '[]', -- [{"email": "...", "name": "..."}]
  send_whatsapp BOOLEAN DEFAULT false,
  whatsapp_numbers JSONB DEFAULT '[]', -- ["+5511..."]

  -- Report config
  include_ai_summary BOOLEAN DEFAULT true,
  include_comparison BOOLEAN DEFAULT true,
  format TEXT DEFAULT 'pdf', -- 'pdf', 'png', 'link'

  -- Tracking
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  send_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_client ON ai_insights (client_id, generated_at DESC);
CREATE INDEX idx_ai_unread ON ai_insights (client_id, is_read, severity);
CREATE INDEX idx_rs_next ON report_schedules (next_send_at, is_active);

-- RLS
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_member_access" ON ai_insights FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));
CREATE POLICY "client_member_access" ON report_schedules FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));
