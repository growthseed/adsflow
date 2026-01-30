-- =====================================================
-- ADS FLOW - EVENTOS DE TRACKING
-- Migration: 002_flow_events.sql
-- Description: Tabela para armazenar eventos do pixel
-- =====================================================

-- =====================================================
-- TABELA: flow_events (Eventos do Pixel)
-- =====================================================
CREATE TABLE IF NOT EXISTS flow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID REFERENCES strategy_flows(id) ON DELETE CASCADE,

  -- Tipo de evento
  event_type TEXT NOT NULL CHECK (
    event_type IN ('pageview', 'click', 'conversion', 'custom')
  ),

  -- Identificadores de sessão
  session_id TEXT NOT NULL,
  user_id TEXT, -- ID do usuário se disponível

  -- Dados do evento (JSON flexível)
  data JSONB NOT NULL DEFAULT '{}',
  -- Exemplo de data:
  -- {
  --   "pagePath": "/landing-page",
  --   "pageTitle": "Minha Landing Page",
  --   "eventName": "click_cta",
  --   "eventValue": 100.00,
  --   "utm_source": "facebook",
  --   "utm_medium": "cpc",
  --   "utm_campaign": "black_friday"
  -- }

  -- Metadados
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_flow_events_flow_id ON flow_events(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_events_event_type ON flow_events(event_type);
CREATE INDEX IF NOT EXISTS idx_flow_events_session_id ON flow_events(session_id);
CREATE INDEX IF NOT EXISTS idx_flow_events_created_at ON flow_events(created_at);

-- Index GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_flow_events_data ON flow_events USING GIN (data);

-- =====================================================
-- TABELA: flow_integrations (Configurações de Integração)
-- =====================================================
CREATE TABLE IF NOT EXISTS flow_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID REFERENCES strategy_flows(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de integração
  source TEXT NOT NULL CHECK (
    source IN ('meta_ads', 'google_analytics', 'google_ads', 'webhook', 'csv_import', 'manual')
  ),

  -- Credenciais (criptografadas em produção)
  credentials JSONB DEFAULT '{}',
  -- Exemplo:
  -- {
  --   "accountId": "act_123456",
  --   "accessToken": "encrypted_token",
  --   "propertyId": "123456789"
  -- }

  -- Configurações
  settings JSONB DEFAULT '{}',
  -- Exemplo:
  -- {
  --   "refreshInterval": 60,
  --   "autoSync": true,
  --   "dateRange": "last_30d"
  -- }

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (
    last_sync_status IN ('success', 'error', 'pending', NULL)
  ),
  last_sync_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: um tipo de integração por flow
  UNIQUE(flow_id, source)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_flow_integrations_flow_id ON flow_integrations(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_integrations_source ON flow_integrations(source);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_flow_integrations_updated_at ON flow_integrations;
CREATE TRIGGER update_flow_integrations_updated_at
  BEFORE UPDATE ON flow_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: flow_node_stats (Estatísticas por Nó)
-- =====================================================
CREATE TABLE IF NOT EXISTS flow_node_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID REFERENCES strategy_flows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL, -- ID do nó no ReactFlow

  -- Período
  period_date DATE NOT NULL,

  -- Métricas agregadas
  visits INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue DECIMAL(15,2) DEFAULT 0,
  cost DECIMAL(15,2) DEFAULT 0,

  -- Métricas de engajamento
  avg_time_seconds INT,
  bounce_count INT DEFAULT 0,
  exit_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: um registro por nó por dia
  UNIQUE(flow_id, node_id, period_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flow_node_stats_flow_id ON flow_node_stats(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_node_stats_node_id ON flow_node_stats(node_id);
CREATE INDEX IF NOT EXISTS idx_flow_node_stats_period ON flow_node_stats(period_date);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_flow_node_stats_updated_at ON flow_node_stats;
CREATE TRIGGER update_flow_node_stats_updated_at
  BEFORE UPDATE ON flow_node_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE flow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_node_stats ENABLE ROW LEVEL SECURITY;

-- flow_events: acesso via flow ownership
CREATE POLICY "Users can view events of their flows" ON flow_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM strategy_flows
      WHERE strategy_flows.id = flow_events.flow_id
      AND strategy_flows.user_id = auth.uid()
    )
  );

-- Permitir INSERT sem autenticação (para o pixel)
CREATE POLICY "Allow public insert for pixel tracking" ON flow_events
  FOR INSERT WITH CHECK (true);

-- flow_integrations
CREATE POLICY "Users can view their integrations" ON flow_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their integrations" ON flow_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their integrations" ON flow_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their integrations" ON flow_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- flow_node_stats
CREATE POLICY "Users can view stats of their flows" ON flow_node_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM strategy_flows
      WHERE strategy_flows.id = flow_node_stats.flow_id
      AND strategy_flows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stats for their flows" ON flow_node_stats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM strategy_flows
      WHERE strategy_flows.id = flow_node_stats.flow_id
      AND strategy_flows.user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTION: Agregar eventos em estatísticas
-- =====================================================
CREATE OR REPLACE FUNCTION aggregate_flow_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar contadores no flow_node_stats
  INSERT INTO flow_node_stats (flow_id, node_id, period_date, visits)
  VALUES (
    NEW.flow_id,
    COALESCE(NEW.data->>'pagePath', 'unknown'),
    DATE(NEW.created_at),
    1
  )
  ON CONFLICT (flow_id, node_id, period_date)
  DO UPDATE SET
    visits = flow_node_stats.visits + 1,
    conversions = flow_node_stats.conversions + CASE WHEN NEW.event_type = 'conversion' THEN 1 ELSE 0 END,
    revenue = flow_node_stats.revenue + COALESCE((NEW.data->>'eventValue')::DECIMAL, 0),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para agregar eventos automaticamente
DROP TRIGGER IF EXISTS trigger_aggregate_events ON flow_events;
CREATE TRIGGER trigger_aggregate_events
  AFTER INSERT ON flow_events
  FOR EACH ROW EXECUTE FUNCTION aggregate_flow_events();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE flow_events IS 'Eventos de tracking recebidos do pixel instalado nos sites';
COMMENT ON TABLE flow_integrations IS 'Configurações de integração por flow (Meta Ads, GA4, etc.)';
COMMENT ON TABLE flow_node_stats IS 'Estatísticas agregadas por nó por dia';
