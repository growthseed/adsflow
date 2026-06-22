-- ============================================================
-- Migration 030 — adiciona 'clint' ao enum de provider em client_integrations
-- ============================================================
-- Motivação: o MOAI usa Clint CRM (https://api.clint.digital) em vez de Kommo.
-- O CHECK constraint atual rejeita o INSERT. Estende a lista de providers
-- válidos pra incluir 'clint' (e deixa espaço pra outros CRMs futuros).
-- ============================================================

ALTER TABLE public.client_integrations
  DROP CONSTRAINT IF EXISTS client_integrations_provider_check;

ALTER TABLE public.client_integrations
  ADD CONSTRAINT client_integrations_provider_check
  CHECK (provider IN (
    'google_ads',
    'meta_ads',
    'google_analytics',
    'search_console',
    'google_my_business',
    'youtube',
    'linkedin',
    'clickup',
    'tiktok_ads',
    'kommo',
    'clint',
    'rdstation',
    'pipedrive',
    'hubspot'
  ));

COMMENT ON CONSTRAINT client_integrations_provider_check ON public.client_integrations IS
  'Lista canônica de providers suportados. Adicionar aqui ao integrar novo CRM/Ads platform.';
