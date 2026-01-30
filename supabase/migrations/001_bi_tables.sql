-- =====================================================
-- ADS FLOW - B.I. V4 COMPANY INTEGRATION
-- Migration: 001_bi_tables.sql
-- Description: Creates tables for Inside Sales B.I. Dashboard
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: vendedores (Sales Team)
-- =====================================================
CREATE TABLE IF NOT EXISTS vendedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  telefone TEXT,
  departamento TEXT DEFAULT 'Comercial',
  cargo TEXT DEFAULT 'Vendedor',
  avatar_url TEXT,
  meta_mensal DECIMAL(15,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca por user_id
CREATE INDEX IF NOT EXISTS idx_vendedores_user_id ON vendedores(user_id);

-- =====================================================
-- TABELA: leads
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL,

  -- Informações básicas
  titulo TEXT NOT NULL,
  descricao TEXT,
  empresa TEXT,
  contato_nome TEXT,
  contato_email TEXT,
  contato_telefone TEXT,

  -- Funil de vendas
  status_funil TEXT NOT NULL DEFAULT 'Sem contato' CHECK (
    status_funil IN (
      'Sem contato',
      'Contato feito',
      'Identificação do interesse',
      'Aguardando documento',
      'Contrato fechado',
      'Perdido'
    )
  ),

  -- Fonte de aquisição
  fonte TEXT CHECK (
    fonte IN (
      'Busca Paga/Google',
      'Busca Paga/Facebook',
      'SMM Organic',
      'Indicação',
      'Evento',
      'Inbound',
      'Outbound',
      'Parceiro',
      'Outro'
    )
  ),

  -- Valores e datas
  valor_estimado DECIMAL(15,2) DEFAULT 0,
  valor_fechado DECIMAL(15,2),
  data_primeiro_contato TIMESTAMPTZ,
  data_fechamento TIMESTAMPTZ,

  -- Status do resultado
  resultado TEXT DEFAULT 'aberto' CHECK (
    resultado IN ('aberto', 'vendido', 'perdido')
  ),
  motivo_perda TEXT,

  -- Métricas calculadas
  dias_ciclo INT GENERATED ALWAYS AS (
    CASE
      WHEN data_fechamento IS NOT NULL AND created_at IS NOT NULL
      THEN EXTRACT(DAY FROM (data_fechamento - created_at))::INT
      ELSE NULL
    END
  ) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_vendedor_id ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_funil ON leads(status_funil);
CREATE INDEX IF NOT EXISTS idx_leads_resultado ON leads(resultado);
CREATE INDEX IF NOT EXISTS idx_leads_fonte ON leads(fonte);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- =====================================================
-- TABELA: oportunidades
-- =====================================================
CREATE TABLE IF NOT EXISTS oportunidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL,

  -- Informações básicas
  titulo TEXT NOT NULL,
  descricao TEXT,

  -- Status da oportunidade
  status TEXT NOT NULL DEFAULT 'Qualificação' CHECK (
    status IN (
      'Qualificação',
      'Proposta Enviada',
      'Negociação',
      'Fechada Ganha',
      'Fechada Perdida'
    )
  ),

  -- Valores
  valor DECIMAL(15,2) NOT NULL DEFAULT 0,
  probabilidade INT DEFAULT 50 CHECK (probabilidade >= 0 AND probabilidade <= 100),

  -- Datas
  data_previsao_fechamento DATE,
  data_fechamento TIMESTAMPTZ,

  -- Resultado
  resultado TEXT DEFAULT 'aberta' CHECK (
    resultado IN ('aberta', 'ganha', 'perdida')
  ),
  motivo_perda TEXT,

  -- Métricas
  dias_ciclo INT GENERATED ALWAYS AS (
    CASE
      WHEN data_fechamento IS NOT NULL AND created_at IS NOT NULL
      THEN EXTRACT(DAY FROM (data_fechamento - created_at))::INT
      ELSE NULL
    END
  ) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oportunidades_lead_id ON oportunidades(lead_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_user_id ON oportunidades(user_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_vendedor_id ON oportunidades(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_status ON oportunidades(status);
CREATE INDEX IF NOT EXISTS idx_oportunidades_resultado ON oportunidades(resultado);

-- =====================================================
-- TABELA: historico_funil (Funnel Transitions)
-- =====================================================
CREATE TABLE IF NOT EXISTS historico_funil (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE CASCADE,

  etapa_anterior TEXT,
  etapa_nova TEXT NOT NULL,

  -- Quem fez a mudança
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  observacoes TEXT,

  data_transicao TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca por lead
CREATE INDEX IF NOT EXISTS idx_historico_lead_id ON historico_funil(lead_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_funil(data_transicao);

-- =====================================================
-- TABELA: flow_conversion_stats (Funnelytics Integration)
-- =====================================================
CREATE TABLE IF NOT EXISTS flow_conversion_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID REFERENCES strategy_flows(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Node references
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,

  -- Metrics
  visitors INT DEFAULT 0,
  conversions INT DEFAULT 0,
  conversion_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN visitors > 0 THEN (conversions::DECIMAL / visitors * 100)
      ELSE 0
    END
  ) STORED,

  -- Time metrics
  avg_time_seconds INT,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_flow_stats_flow_id ON flow_conversion_stats(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_stats_period ON flow_conversion_stats(period_start, period_end);

-- =====================================================
-- TABELA: flow_utm_params (UTM Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS flow_utm_params (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID REFERENCES strategy_flows(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- UTM Parameters
  utm_source TEXT NOT NULL,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Metrics
  visits INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue DECIMAL(15,2) DEFAULT 0,
  cost DECIMAL(15,2) DEFAULT 0,

  -- Calculated
  roi DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE
      WHEN cost > 0 THEN ((revenue - cost) / cost * 100)
      ELSE 0
    END
  ) STORED,

  -- Period
  period_date DATE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_utm_flow_id ON flow_utm_params(flow_id);
CREATE INDEX IF NOT EXISTS idx_utm_source ON flow_utm_params(utm_source);
CREATE INDEX IF NOT EXISTS idx_utm_period ON flow_utm_params(period_date);

-- =====================================================
-- TABELA: kpi_snapshots (Daily KPI Snapshots)
-- =====================================================
CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Date
  snapshot_date DATE NOT NULL,

  -- Lead metrics
  total_leads INT DEFAULT 0,
  leads_novos INT DEFAULT 0,
  leads_convertidos INT DEFAULT 0,
  leads_perdidos INT DEFAULT 0,
  leads_abertos INT DEFAULT 0,

  -- Opportunity metrics
  total_oportunidades INT DEFAULT 0,
  oportunidades_ganhas INT DEFAULT 0,
  oportunidades_perdidas INT DEFAULT 0,
  oportunidades_abertas INT DEFAULT 0,

  -- Value metrics
  valor_pipeline DECIMAL(15,2) DEFAULT 0,
  valor_fechado DECIMAL(15,2) DEFAULT 0,
  ticket_medio DECIMAL(15,2) DEFAULT 0,

  -- Time metrics
  tempo_medio_fechamento_dias INT,

  -- Conversion rates
  taxa_conversao_lead_opp DECIMAL(5,2),
  taxa_conversao_opp_venda DECIMAL(5,2),
  taxa_perda_geral DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per user per day
  UNIQUE(user_id, snapshot_date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_kpi_user_date ON kpi_snapshots(user_id, snapshot_date);

-- =====================================================
-- FUNCTIONS: Triggers para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_vendedores_updated_at ON vendedores;
CREATE TRIGGER update_vendedores_updated_at
  BEFORE UPDATE ON vendedores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_oportunidades_updated_at ON oportunidades;
CREATE TRIGGER update_oportunidades_updated_at
  BEFORE UPDATE ON oportunidades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flow_stats_updated_at ON flow_conversion_stats;
CREATE TRIGGER update_flow_stats_updated_at
  BEFORE UPDATE ON flow_conversion_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS: Histórico de Funil Automático
-- =====================================================
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status_funil IS DISTINCT FROM NEW.status_funil THEN
    INSERT INTO historico_funil (lead_id, etapa_anterior, etapa_nova)
    VALUES (NEW.id, OLD.status_funil, NEW.status_funil);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lead_status_change ON leads;
CREATE TRIGGER trigger_lead_status_change
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_lead_status_change();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_funil ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_conversion_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_utm_params ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;

-- Vendedores: Users can see their own team
CREATE POLICY "Users can view vendedores" ON vendedores
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert vendedores" ON vendedores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendedores" ON vendedores
  FOR UPDATE USING (auth.uid() = user_id);

-- Leads: Users can manage their own leads
CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view own oportunidades" ON oportunidades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert oportunidades" ON oportunidades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oportunidades" ON oportunidades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oportunidades" ON oportunidades
  FOR DELETE USING (auth.uid() = user_id);

-- Historico: View through leads
CREATE POLICY "Users can view historico through leads" ON historico_funil
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM leads WHERE leads.id = historico_funil.lead_id AND leads.user_id = auth.uid())
  );

-- Flow stats
CREATE POLICY "Users can view own flow stats" ON flow_conversion_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert flow stats" ON flow_conversion_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UTM params
CREATE POLICY "Users can view own utm params" ON flow_utm_params
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert utm params" ON flow_utm_params
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- KPI Snapshots
CREATE POLICY "Users can view own kpi snapshots" ON kpi_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert kpi snapshots" ON kpi_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- DONE!
-- =====================================================
COMMENT ON TABLE vendedores IS 'Equipe de vendas para acompanhamento de performance';
COMMENT ON TABLE leads IS 'Leads do funil de vendas com tracking de status';
COMMENT ON TABLE oportunidades IS 'Oportunidades de negócio derivadas de leads';
COMMENT ON TABLE historico_funil IS 'Histórico de transições no funil de vendas';
COMMENT ON TABLE flow_conversion_stats IS 'Estatísticas de conversão entre nós do fluxo Funnelytics';
COMMENT ON TABLE flow_utm_params IS 'Rastreamento de parâmetros UTM por período';
COMMENT ON TABLE kpi_snapshots IS 'Snapshots diários de KPIs para comparação histórica';
