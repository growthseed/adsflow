-- =====================================================
-- 005_dashboard_builder.sql
-- Dashboard Builder: dashboards + widgets
-- =====================================================

CREATE TABLE IF NOT EXISTS public.dashboards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id     uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  name          text NOT NULL,
  description   text,
  template_id   text,
  layout        jsonb NOT NULL DEFAULT '{}',
  theme         jsonb NOT NULL DEFAULT '{"colorScheme":"light","accentColor":"#1e40af"}',
  global_filters jsonb NOT NULL DEFAULT '{"datePreset":"last_30d"}',
  is_template   boolean NOT NULL DEFAULT false,
  is_public     boolean NOT NULL DEFAULT false,
  share_token   text UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dashboards"
  ON public.dashboards FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public dashboards are readable"
  ON public.dashboards FOR SELECT
  USING (is_public = true);

CREATE INDEX idx_dashboards_user_id ON public.dashboards(user_id);
CREATE INDEX idx_dashboards_client_id ON public.dashboards(client_id);

CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id  uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  widget_type   text NOT NULL,
  title         text NOT NULL DEFAULT '',
  data_source   jsonb NOT NULL DEFAULT '{}',
  config        jsonb NOT NULL DEFAULT '{}',
  position      jsonb NOT NULL DEFAULT '{"x":0,"y":0,"w":4,"h":3}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Widget access follows dashboard ownership"
  ON public.dashboard_widgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
        AND (d.user_id = auth.uid() OR d.is_public = true)
    )
  );

CREATE INDEX idx_widgets_dashboard_id ON public.dashboard_widgets(dashboard_id);

-- updated_at trigger
CREATE TRIGGER set_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
