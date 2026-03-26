-- =====================================================
-- ADS FLOW - FUNNELYTICS ANALYTICS
-- Migration: 011_flow_analytics.sql
-- Description: Node goals, node metrics, edge metrics
--              + performance view for meta vs realizado
-- =====================================================

-- Flow node goals/targets (meta)
CREATE TABLE IF NOT EXISTS public.flow_node_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL,
  node_id TEXT NOT NULL, -- ReactFlow node ID
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Goal configuration
  metric TEXT NOT NULL, -- 'visits', 'leads', 'conversions', 'revenue', 'ctr', 'cpc'
  target_value NUMERIC(12,2) NOT NULL,
  period TEXT DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flow_id, node_id, metric)
);

-- Flow node actual metrics (realizado)
CREATE TABLE IF NOT EXISTS public.flow_node_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL,
  node_id TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  visits INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  avg_time_seconds INTEGER DEFAULT 0,

  -- Source breakdown
  source_meta INTEGER DEFAULT 0,
  source_google INTEGER DEFAULT 0,
  source_organic INTEGER DEFAULT 0,
  source_direct INTEGER DEFAULT 0,
  source_other INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flow_id, node_id, date)
);

-- Flow edge metrics (connections between nodes)
CREATE TABLE IF NOT EXISTS public.flow_edge_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  transitions INTEGER DEFAULT 0, -- users who moved from source to target
  drop_offs INTEGER DEFAULT 0, -- users who left at source without reaching target
  conversion_rate NUMERIC(5,2) DEFAULT 0, -- transitions / (transitions + drop_offs) * 100

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flow_id, source_node_id, target_node_id, date)
);

-- View: Node performance with goal comparison
CREATE OR REPLACE VIEW public.vw_flow_node_performance AS
SELECT
  m.flow_id,
  m.node_id,
  m.client_id,
  SUM(m.visits) AS total_visits,
  SUM(m.unique_visitors) AS total_unique,
  SUM(m.leads) AS total_leads,
  SUM(m.conversions) AS total_conversions,
  SUM(m.revenue) AS total_revenue,
  AVG(m.bounce_rate) AS avg_bounce_rate,

  -- Goal comparison
  g.target_value AS goal_value,
  g.metric AS goal_metric,
  CASE g.metric
    WHEN 'visits' THEN SUM(m.visits)
    WHEN 'leads' THEN SUM(m.leads)
    WHEN 'conversions' THEN SUM(m.conversions)
    WHEN 'revenue' THEN SUM(m.revenue)
    ELSE 0
  END AS actual_value,
  CASE WHEN g.target_value > 0 THEN
    ROUND(((CASE g.metric
      WHEN 'visits' THEN SUM(m.visits)
      WHEN 'leads' THEN SUM(m.leads)
      WHEN 'conversions' THEN SUM(m.conversions)
      WHEN 'revenue' THEN SUM(m.revenue)
      ELSE 0
    END) / g.target_value) * 100, 1)
  ELSE 0 END AS goal_percentage

FROM flow_node_metrics m
LEFT JOIN flow_node_goals g ON g.flow_id = m.flow_id AND g.node_id = m.node_id
GROUP BY m.flow_id, m.node_id, m.client_id, g.target_value, g.metric;

-- Indexes
CREATE INDEX idx_fnm_flow_node ON flow_node_metrics (flow_id, node_id, date DESC);
CREATE INDEX idx_fem_flow ON flow_edge_metrics (flow_id, date DESC);
CREATE INDEX idx_fng_flow ON flow_node_goals (flow_id, node_id);

-- RLS
ALTER TABLE flow_node_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_node_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_edge_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_member_access" ON flow_node_goals FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));
CREATE POLICY "client_member_access" ON flow_node_metrics FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));
CREATE POLICY "client_member_access" ON flow_edge_metrics FOR ALL
  USING (client_id IN (SELECT client_id FROM client_members WHERE user_id = auth.uid()));
