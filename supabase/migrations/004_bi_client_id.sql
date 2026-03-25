-- =====================================================
-- MIGRATION 004: Add client_id to BI tables
-- Multi-tenant isolation for leads, vendedores, oportunidades
-- =====================================================

-- Add client_id column to BI tables
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_vendedores_client_id ON vendedores(client_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_client_id ON oportunidades(client_id);

-- Note: Existing rows will have client_id = NULL.
-- Run a backfill script to assign existing data to the correct client.
