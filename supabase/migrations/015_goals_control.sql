-- =====================================================
-- 015: Goals Control (Controle de Metas) + Timeline
-- =====================================================
-- Efeito Digital - Ads Flow
-- Data: 2026-03-26

CREATE TABLE IF NOT EXISTS public.client_metric_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  metric TEXT NOT NULL, -- 'leads', 'conversions', 'spend', 'roas', 'cpl', 'revenue', 'sessions', 'ctr'
  platform TEXT, -- 'meta_ads', 'google_ads', 'ga4', 'all'

  target_value NUMERIC(12,2) NOT NULL,
  period TEXT DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly'

  -- Alert config
  alert_threshold_pct NUMERIC(5,2) DEFAULT 20, -- alert when X% below target
  alert_enabled BOOLEAN DEFAULT true,
  alert_email BOOLEAN DEFAULT true,
  alert_whatsapp BOOLEAN DEFAULT false,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, metric, platform, period)
);

-- Goal snapshots (daily progress tracking)
CREATE TABLE IF NOT EXISTS public.goal_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES client_metric_goals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  actual_value NUMERIC(12,2) DEFAULT 0,
  target_value NUMERIC(12,2) NOT NULL,
  progress_pct NUMERIC(5,1) DEFAULT 0, -- actual/target * 100

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, date)
);

-- Marketing timeline / milestones
CREATE TABLE IF NOT EXISTS public.marketing_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'milestone', -- 'milestone', 'campaign_launch', 'budget_change', 'creative_change', 'note'
  date TIMESTAMPTZ NOT NULL,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_metric_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_access" ON client_metric_goals FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));
CREATE POLICY "client_access" ON goal_snapshots FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));
CREATE POLICY "client_access" ON marketing_timeline FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));

CREATE INDEX idx_cmg_client ON client_metric_goals (client_id);
CREATE INDEX idx_gs_goal ON goal_snapshots (goal_id, date DESC);
CREATE INDEX idx_mt_client ON marketing_timeline (client_id, date DESC);
