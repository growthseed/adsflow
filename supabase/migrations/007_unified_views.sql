-- =====================================================
-- 007_unified_views.sql
-- Views unificadas para cross-platform analytics
-- Combina Meta Ads, Google Ads, CRM e E-commerce
-- =====================================================

-- 1. ADS UNIFIED — Métricas de todas as plataformas em uma view
CREATE OR REPLACE VIEW vw_ads_unified AS
SELECT
  ci.date,
  ci.ad_account_id,
  aa.platform AS source,
  aa.client_id,
  aa.account_name,
  cc.name AS campaign_name,
  cc.objective AS campaign_objective,
  cc.status AS campaign_status,
  ci.impressions,
  ci.reach,
  ci.clicks,
  ci.spend,
  ci.ctr,
  ci.cpc,
  ci.cpm,
  ci.conversions,
  ci.conversion_value,
  ci.cost_per_conversion,
  ci.roas,
  ci.frequency,
  ci.engagement,
  ci.post_reactions,
  ci.post_comments,
  ci.post_shares,
  ci.video_views,
  ci.video_thruplay,
  ci.leads,
  ci.cost_per_lead
FROM campaign_insights ci
JOIN ad_accounts aa ON aa.id = ci.ad_account_id
LEFT JOIN campaigns_cache cc ON cc.id = ci.campaign_id;

-- 2. CREATIVES UNIFIED — Ads com métricas de criativos
CREATE OR REPLACE VIEW vw_creatives_unified AS
SELECT
  ai.date,
  ai.ad_account_id,
  aa.platform AS source,
  aa.client_id,
  ai.ad_name,
  ai.creative_id,
  ai.creative_thumbnail_url,
  ai.impressions,
  ai.clicks,
  ai.spend,
  ai.ctr,
  ai.hook_rate,
  ai.hold_rate,
  ai.video_views,
  ai.video_thruplay,
  ai.video_p25,
  ai.video_p50,
  ai.video_p75,
  ai.video_p100,
  ai.conversions,
  ai.roas,
  ai.leads
FROM ad_insights ai
JOIN ad_accounts aa ON aa.id = ai.ad_account_id;

-- 3. LEADS UNIFIED — Leads com vendedor e status
CREATE OR REPLACE VIEW vw_leads_unified AS
SELECT
  l.id,
  l.client_id,
  l.user_id,
  l.titulo,
  l.empresa,
  l.contato_nome,
  l.contato_email,
  l.contato_telefone,
  l.status_funil,
  l.fonte,
  l.resultado,
  l.valor_estimado,
  l.valor_fechado,
  l.motivo_perda,
  l.dias_ciclo,
  l.data_primeiro_contato,
  l.data_fechamento,
  l.created_at,
  v.nome AS vendedor_nome,
  v.departamento AS vendedor_departamento,
  DATE_TRUNC('month', l.created_at) AS cohort_month
FROM leads l
LEFT JOIN vendedores v ON v.id = l.vendedor_id;

-- 4. PIPELINE SUMMARY — Resumo do funil por cliente/período
CREATE OR REPLACE VIEW vw_pipeline_summary AS
SELECT
  l.client_id,
  DATE_TRUNC('month', l.created_at)::date AS period,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE l.resultado = 'vendido') AS vendas,
  COUNT(*) FILTER (WHERE l.resultado = 'perdido') AS perdas,
  COUNT(*) FILTER (WHERE l.resultado = 'aberto') AS abertos,
  COALESCE(SUM(l.valor_fechado) FILTER (WHERE l.resultado = 'vendido'), 0) AS valor_fechado,
  COALESCE(SUM(l.valor_estimado) FILTER (WHERE l.resultado = 'aberto'), 0) AS valor_pipeline,
  CASE
    WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE l.resultado = 'vendido')::numeric / COUNT(*)) * 100, 2)
    ELSE 0
  END AS taxa_conversao,
  COALESCE(
    AVG(l.dias_ciclo) FILTER (WHERE l.resultado = 'vendido'),
    0
  )::integer AS tempo_medio_fechamento
FROM leads l
GROUP BY l.client_id, DATE_TRUNC('month', l.created_at)::date;

-- 5. ADS DAILY SUMMARY — Métricas diárias por plataforma e cliente
CREATE OR REPLACE VIEW vw_ads_daily AS
SELECT
  ci.date,
  aa.client_id,
  aa.platform AS source,
  SUM(ci.impressions) AS impressions,
  SUM(ci.reach) AS reach,
  SUM(ci.clicks) AS clicks,
  SUM(ci.spend) AS spend,
  SUM(ci.conversions) AS conversions,
  SUM(ci.conversion_value) AS conversion_value,
  SUM(ci.leads) AS leads,
  CASE WHEN SUM(ci.impressions) > 0
    THEN ROUND((SUM(ci.clicks)::numeric / SUM(ci.impressions)) * 100, 2) ELSE 0 END AS ctr,
  CASE WHEN SUM(ci.clicks) > 0
    THEN ROUND(SUM(ci.spend)::numeric / SUM(ci.clicks), 2) ELSE 0 END AS cpc,
  CASE WHEN SUM(ci.spend) > 0
    THEN ROUND(SUM(ci.conversion_value)::numeric / SUM(ci.spend), 2) ELSE 0 END AS roas,
  CASE WHEN SUM(ci.leads) > 0
    THEN ROUND(SUM(ci.spend)::numeric / SUM(ci.leads), 2) ELSE 0 END AS cost_per_lead
FROM campaign_insights ci
JOIN ad_accounts aa ON aa.id = ci.ad_account_id
GROUP BY ci.date, aa.client_id, aa.platform;

-- 6. CROSS PLATFORM TOTALS — Totais por cliente (todas as plataformas)
CREATE OR REPLACE VIEW vw_cross_platform_totals AS
SELECT
  aa.client_id,
  aa.platform,
  MIN(ci.date) AS first_date,
  MAX(ci.date) AS last_date,
  SUM(ci.impressions) AS total_impressions,
  SUM(ci.clicks) AS total_clicks,
  SUM(ci.spend) AS total_spend,
  SUM(ci.conversions) AS total_conversions,
  SUM(ci.conversion_value) AS total_revenue,
  SUM(ci.leads) AS total_leads,
  CASE WHEN SUM(ci.spend) > 0
    THEN ROUND(SUM(ci.conversion_value)::numeric / SUM(ci.spend), 2) ELSE 0 END AS overall_roas,
  CASE WHEN SUM(ci.leads) > 0
    THEN ROUND(SUM(ci.spend)::numeric / SUM(ci.leads), 2) ELSE 0 END AS overall_cpl
FROM campaign_insights ci
JOIN ad_accounts aa ON aa.id = ci.ad_account_id
GROUP BY aa.client_id, aa.platform;

-- 7. SYNC STATUS — Estado de sync de todas as contas
CREATE OR REPLACE VIEW vw_sync_status AS
SELECT
  aa.id AS account_id,
  aa.account_name,
  aa.platform,
  aa.client_id,
  aa.status AS account_status,
  aa.last_sync_at,
  aa.sync_error,
  sl.sync_type AS last_sync_type,
  sl.status AS last_sync_status,
  sl.campaigns_synced,
  sl.insights_synced,
  sl.duration_ms,
  sl.completed_at AS last_sync_completed
FROM ad_accounts aa
LEFT JOIN LATERAL (
  SELECT * FROM sync_logs
  WHERE ad_account_id = aa.id
  ORDER BY created_at DESC
  LIMIT 1
) sl ON true;
