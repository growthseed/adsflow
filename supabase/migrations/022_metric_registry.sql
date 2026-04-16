-- ============================================
-- 022: Metric Registry + Goal Enhancements
-- Sprint B.1 — extensible metrics, objectives, quarters
-- ============================================

-- Custom metric definitions (admin-only creation)
CREATE TABLE IF NOT EXISTS metric_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'number',
  format TEXT DEFAULT '0',
  direction TEXT NOT NULL DEFAULT 'higher_better',
  objectives TEXT[] NOT NULL DEFAULT '{}',
  auto_sources TEXT[] DEFAULT '{}',
  formula TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  is_system BOOLEAN DEFAULT false,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, key)
);

-- Enhance existing client_metric_goals with objective + quarter support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_metric_goals' AND column_name = 'objective'
  ) THEN
    ALTER TABLE client_metric_goals
      ADD COLUMN objective TEXT DEFAULT 'lead_gen',
      ADD COLUMN quarter TEXT,
      ADD COLUMN metric_definition_id UUID REFERENCES metric_definitions(id),
      ADD COLUMN data_source TEXT DEFAULT 'manual',
      ADD COLUMN account_ref TEXT,
      ADD COLUMN forecast_value NUMERIC(12,2);
  END IF;
END $$;

-- Quarter targets (multiple targets per goal for different periods)
CREATE TABLE IF NOT EXISTS goal_quarter_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES client_metric_goals(id) ON DELETE CASCADE,
  range TEXT NOT NULL,
  target_value NUMERIC(12,2) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(goal_id, range)
);

-- RLS
ALTER TABLE metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_quarter_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metric_definitions_agency_access" ON metric_definitions
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())
    OR is_system = true
  );

CREATE POLICY "goal_quarter_targets_client_access" ON goal_quarter_targets
  FOR ALL USING (
    goal_id IN (
      SELECT id FROM client_metric_goals
      WHERE client_id IN (SELECT client_id FROM client_access WHERE user_id = auth.uid())
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_metric_definitions_agency ON metric_definitions(agency_id);
CREATE INDEX IF NOT EXISTS idx_metric_definitions_category ON metric_definitions(category);
CREATE INDEX IF NOT EXISTS idx_goal_quarter_targets_goal ON goal_quarter_targets(goal_id);
