/**
 * ============================================
 * MIGRATION 028: B2B Growth & CRM Deals
 * ============================================
 * Adiciona as tabelas necessárias para suportar a jornada B2B do lead (Kommo)
 * e o rastreamento de conversões offline (Meta CAPI / Google Offline).
 */

-- Tabela para armazenar Leads/Negócios do CRM
CREATE TABLE IF NOT EXISTS public.crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    integration_source TEXT NOT NULL, -- ex: 'kommo'
    external_deal_id TEXT NOT NULL,   -- ID do lead/deal no Kommo
    external_contact_id TEXT,         -- ID do contato associado no Kommo
    
    -- Status do Pipeline (Mapeamento Padrão)
    stage_name TEXT NOT NULL,
    is_mql BOOLEAN DEFAULT false,
    is_sql BOOLEAN DEFAULT false,
    is_won BOOLEAN DEFAULT false,
    is_lost BOOLEAN DEFAULT false,
    
    -- Valores
    value DECIMAL(10, 2) DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    
    -- Atribuição (First-Party Tracking & UTMs)
    adflow_id TEXT,          -- ID do nosso tracking script
    fbclid TEXT,
    gclid TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    
    -- Metadados e Tags (Campos Customizados do CRM)
    tags TEXT[],             -- Array de tags do CRM
    custom_fields JSONB,     -- Ex: tipo de serviço, tamanho da empresa
    
    -- Datas de Evolução (para Lead Time e Cohort)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    mql_at TIMESTAMPTZ,
    sql_at TIMESTAMPTZ,
    won_at TIMESTAMPTZ,
    lost_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(integration_source, external_deal_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_client_id ON public.crm_deals(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_adflow_id ON public.crm_deals(adflow_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_utm ON public.crm_deals(utm_source, utm_medium, utm_campaign);

-- Tabela para Log de Envio de Conversões Offline (Retroalimentação)
CREATE TABLE IF NOT EXISTS public.offline_conversions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    
    platform TEXT NOT NULL,     -- 'meta_ads' ou 'google_ads'
    event_name TEXT NOT NULL,   -- 'Lead', 'Qualificado_MQL', 'Purchase'
    
    -- Payload enviado
    payload JSONB NOT NULL,
    
    -- Resposta da API
    status TEXT NOT NULL,       -- 'pending', 'success', 'failed'
    api_response JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_offline_conversions_client ON public.offline_conversions_log(client_id, status);

-- Trigger para updated_at no crm_deals
CREATE OR REPLACE FUNCTION update_crm_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_deals_updated_at ON public.crm_deals;
CREATE TRIGGER trg_crm_deals_updated_at
BEFORE UPDATE ON public.crm_deals
FOR EACH ROW
EXECUTE FUNCTION update_crm_deals_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_conversions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view crm deals of their clients"
ON public.crm_deals FOR SELECT
USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage crm deals of their clients"
ON public.crm_deals FOR ALL
USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view offline conversion logs of their clients"
ON public.offline_conversions_log FOR SELECT
USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage offline conversion logs of their clients"
ON public.offline_conversions_log FOR ALL
USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));
