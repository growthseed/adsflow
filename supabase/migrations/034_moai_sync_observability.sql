-- ============================================================
-- Migration 034 - MOAI sync observability + raw records
-- ============================================================

CREATE TABLE IF NOT EXISTS public.moai_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text UNIQUE NOT NULL,
  client_slug text NOT NULL DEFAULT 'moai',
  mode text NOT NULL DEFAULT 'manual',
  reason text,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  total_rows_raw integer NOT NULL DEFAULT 0,
  total_rows_staged integer NOT NULL DEFAULT 0,
  total_rows_mart integer NOT NULL DEFAULT 0,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_moai_sync_runs_client_started
  ON public.moai_sync_runs (client_slug, started_at DESC);

CREATE TABLE IF NOT EXISTS public.moai_sync_run_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL,
  client_slug text NOT NULL DEFAULT 'moai',
  source text NOT NULL,
  mode text,
  status text NOT NULL DEFAULT 'running',
  rows_raw integer NOT NULL DEFAULT 0,
  rows_staged integer NOT NULL DEFAULT 0,
  rows_mart integer NOT NULL DEFAULT 0,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_moai_sync_run_steps_run
  ON public.moai_sync_run_steps (run_id, source);

CREATE TABLE IF NOT EXISTS public.moai_raw_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug text NOT NULL DEFAULT 'moai',
  run_id text NOT NULL,
  source text NOT NULL,
  entity text NOT NULL,
  external_id text,
  occurred_at timestamptz,
  payload jsonb NOT NULL,
  payload_hash text GENERATED ALWAYS AS (md5(payload::text)) STORED,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moai_raw_records_source_entity
  ON public.moai_raw_records (client_slug, source, entity, imported_at DESC);

CREATE INDEX IF NOT EXISTS idx_moai_raw_records_run
  ON public.moai_raw_records (run_id, source, entity);

CREATE UNIQUE INDEX IF NOT EXISTS idx_moai_raw_records_dedupe
  ON public.moai_raw_records (client_slug, source, entity, coalesce(external_id, ''), payload_hash);

CREATE TABLE IF NOT EXISTS public.moai_data_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL,
  client_slug text NOT NULL DEFAULT 'moai',
  check_key text NOT NULL,
  source text,
  severity text NOT NULL DEFAULT 'info',
  status text NOT NULL,
  metric_value numeric,
  threshold_value numeric,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moai_data_quality_checks_run
  ON public.moai_data_quality_checks (run_id, severity, status);

ALTER TABLE public.moai_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moai_sync_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moai_raw_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moai_data_quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY moai_sync_runs_service_all
  ON public.moai_sync_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY moai_sync_run_steps_service_all
  ON public.moai_sync_run_steps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY moai_raw_records_service_all
  ON public.moai_raw_records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY moai_data_quality_checks_service_all
  ON public.moai_data_quality_checks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
