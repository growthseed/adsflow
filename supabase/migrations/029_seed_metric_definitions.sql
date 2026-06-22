-- =============================================================
-- 029 - Seed metric_definitions (Sprint Portal V3)
-- =============================================================
-- Popula a tabela metric_definitions (criada em 022) com 35
-- metricas-padrao que cobrem: midia paga, financeiras (ROAS/CAC
-- /LTV/Payback), funil, forecast e atribuicao.
--
-- Todas marcadas como is_system=true (visiveis em todas as
-- agencias). agency_id=NULL nao gera conflito com UNIQUE pois o
-- key e unico por escopo.
-- =============================================================

-- Limpa seeds anteriores (idempotente)
DELETE FROM metric_definitions WHERE is_system = true AND agency_id IS NULL;

INSERT INTO metric_definitions (
  key, label, description, unit, format, direction,
  objectives, auto_sources, formula, category, is_system, agency_id
) VALUES

-- =========================================================
-- MIDIA PAGA (cost-side)
-- =========================================================
('spend', 'Investimento', 'Total investido em midia paga no periodo (Meta + Google + outros)',
 'currency', 'R$ #,##0.00', 'lower_better',
 ARRAY['cost_efficiency','lead_gen','sales'], ARRAY['meta_ads','google_ads'],
 'SUM(spend) FROM fact_ads_daily', 'media', true, NULL),

('impressions', 'Impressoes', 'Total de impressoes pagas no periodo',
 'number', '#,##0', 'higher_better',
 ARRAY['awareness','reach'], ARRAY['meta_ads','google_ads'],
 'SUM(impressions)', 'media', true, NULL),

('reach', 'Alcance', 'Pessoas unicas alcancadas',
 'number', '#,##0', 'higher_better',
 ARRAY['awareness','reach'], ARRAY['meta_ads'],
 'SUM(reach)', 'media', true, NULL),

('clicks', 'Cliques', 'Total de cliques nos anuncios',
 'number', '#,##0', 'higher_better',
 ARRAY['engagement','traffic'], ARRAY['meta_ads','google_ads'],
 'SUM(clicks)', 'media', true, NULL),

('ctr', 'CTR (Taxa de Clique)', 'Cliques / Impressoes — qualidade do criativo',
 'percent', '0.00%', 'higher_better',
 ARRAY['engagement','creative_quality'], ARRAY['meta_ads','google_ads'],
 'SUM(clicks)::numeric / NULLIF(SUM(impressions),0)', 'media', true, NULL),

('cpm', 'CPM (Custo por mil)', 'Custo por mil impressoes',
 'currency', 'R$ #,##0.00', 'lower_better',
 ARRAY['cost_efficiency'], ARRAY['meta_ads','google_ads'],
 'SUM(spend) / NULLIF(SUM(impressions)/1000,0)', 'media', true, NULL),

('cpc', 'CPC (Custo por clique)', 'Custo medio por clique',
 'currency', 'R$ #,##0.00', 'lower_better',
 ARRAY['cost_efficiency'], ARRAY['meta_ads','google_ads'],
 'SUM(spend) / NULLIF(SUM(clicks),0)', 'media', true, NULL),

('frequency', 'Frequencia', 'Vezes que a mesma pessoa viu o anuncio (1-3 ideal)',
 'number', '0.0', 'lower_better',
 ARRAY['creative_quality','fatigue'], ARRAY['meta_ads'],
 'SUM(impressions) / NULLIF(SUM(reach),0)', 'media', true, NULL),

-- =========================================================
-- CONVERSAO E LEADS
-- =========================================================
('conversions', 'Conversoes (Leads)', 'Total de conversoes/leads gerados',
 'number', '#,##0', 'higher_better',
 ARRAY['lead_gen','sales'], ARRAY['meta_ads','google_ads'],
 'SUM(conversions)', 'conversion', true, NULL),

('cpl', 'CPL (Custo por Lead)', 'Investimento / Leads — eficiencia de geracao',
 'currency', 'R$ #,##0.00', 'lower_better',
 ARRAY['lead_gen','cost_efficiency'], ARRAY['meta_ads','google_ads'],
 'SUM(spend) / NULLIF(SUM(conversions),0)', 'conversion', true, NULL),

('sales', 'Vendas Fechadas', 'Vendas efetivas (vindas do CRM)',
 'number', '#,##0', 'higher_better',
 ARRAY['sales','revenue'], ARRAY['kommo','hubspot'],
 'COUNT(*) FROM crm_deals WHERE status=''won''', 'conversion', true, NULL),

('lead_to_sale_rate', 'Taxa Lead->Venda', 'Percentual de leads que viraram venda',
 'percent', '0.0%', 'higher_better',
 ARRAY['sales','funnel'], ARRAY['kommo'],
 'SUM(sales) / NULLIF(SUM(conversions),0)', 'funnel', true, NULL),

-- =========================================================
-- FINANCEIRAS (ROAS/CAC/LTV/Payback)
-- =========================================================
('revenue', 'Receita Atribuida', 'Receita das vendas atribuidas ao periodo',
 'currency', 'R$ #,##0.00', 'higher_better',
 ARRAY['sales','revenue'], ARRAY['kommo'],
 'SUM(amount) FROM crm_deals WHERE status=''won''', 'finance', true, NULL),

('roas', 'ROAS', 'Retorno sobre Investimento Publicitario. >1 = lucro',
 'ratio', '0.00x', 'higher_better',
 ARRAY['profitability','sales'], ARRAY['meta_ads','google_ads','kommo'],
 'SUM(revenue) / NULLIF(SUM(spend),0)', 'finance', true, NULL),

('roi', 'ROI', '(Receita - Investimento) / Investimento — lucro percentual',
 'percent', '0.0%', 'higher_better',
 ARRAY['profitability'], ARRAY['meta_ads','google_ads','kommo'],
 '(SUM(revenue) - SUM(spend)) / NULLIF(SUM(spend),0)', 'finance', true, NULL),

('cac', 'CAC (Custo de Aquisicao)', 'Investimento / Vendas — quanto custa um cliente',
 'currency', 'R$ #,##0.00', 'lower_better',
 ARRAY['profitability','sales'], ARRAY['meta_ads','google_ads','kommo'],
 'SUM(spend) / NULLIF(SUM(sales),0)', 'finance', true, NULL),

('avg_ticket', 'Ticket Medio', 'Receita / Vendas — valor medio por venda',
 'currency', 'R$ #,##0.00', 'higher_better',
 ARRAY['sales'], ARRAY['kommo'],
 'SUM(revenue) / NULLIF(SUM(sales),0)', 'finance', true, NULL),

('ltv', 'LTV (Lifetime Value)', 'Valor estimado de um cliente ao longo da vida (ticket * freq * vida)',
 'currency', 'R$ #,##0.00', 'higher_better',
 ARRAY['retention','profitability'], ARRAY['kommo'],
 'avg_ticket * purchase_frequency * customer_lifetime_months', 'finance', true, NULL),

('ltv_cac_ratio', 'LTV : CAC', 'Saude do negocio. >3x = excelente, 2-3x = bom, <1x = perda',
 'ratio', '0.00x', 'higher_better',
 ARRAY['profitability','unit_economics'], ARRAY['kommo'],
 'ltv / NULLIF(cac, 0)', 'finance', true, NULL),

('payback_months', 'Payback CAC (meses)', 'Meses para recuperar o CAC com margem bruta',
 'number', '0.0', 'lower_better',
 ARRAY['profitability','cashflow'], ARRAY['kommo'],
 'cac / NULLIF(avg_ticket * gross_margin_pct, 0)', 'finance', true, NULL),

('gross_margin', 'Margem Bruta', 'Margem bruta % (padrao 30%, ajustar por cliente)',
 'percent', '0.0%', 'higher_better',
 ARRAY['profitability'], ARRAY['manual'],
 'manual_input_per_client', 'finance', true, NULL),

-- =========================================================
-- FUNIL E VAZAMENTOS
-- =========================================================
('opportunities', 'Oportunidades', 'Leads qualificados que viraram oportunidade no CRM',
 'number', '#,##0', 'higher_better',
 ARRAY['sales','funnel'], ARRAY['kommo'],
 'COUNT(*) FROM crm_deals WHERE qualified=true', 'funnel', true, NULL),

('funnel_lead_to_opp', 'Vazamento Lead->Oportunidade', '% de leads que NAO viram oportunidade',
 'percent', '0.0%', 'lower_better',
 ARRAY['funnel'], ARRAY['kommo'],
 '1 - (SUM(opportunities) / NULLIF(SUM(conversions),0))', 'funnel', true, NULL),

('funnel_opp_to_sale', 'Vazamento Op->Venda', '% de oportunidades que NAO viraram venda',
 'percent', '0.0%', 'lower_better',
 ARRAY['funnel'], ARRAY['kommo'],
 '1 - (SUM(sales) / NULLIF(SUM(opportunities),0))', 'funnel', true, NULL),

('time_to_close_days', 'Tempo Medio Fechamento', 'Dias entre lead criado e venda fechada',
 'number', '0.0', 'lower_better',
 ARRAY['sales','velocity'], ARRAY['kommo'],
 'AVG(closed_at - created_at)', 'funnel', true, NULL),

-- =========================================================
-- FORECAST E PACING
-- =========================================================
('sales_velocity', 'Sales Velocity', 'Velocidade do funil em R$/dia: (Oportunidades * Ticket * TxConv) / Ciclo',
 'currency', 'R$ #,##0.00', 'higher_better',
 ARRAY['sales','forecast'], ARRAY['kommo'],
 '(opportunities * avg_ticket * win_rate) / NULLIF(time_to_close_days,0)', 'forecast', true, NULL),

('pipeline_coverage', 'Pipeline Coverage', 'Cobertura: Pipeline aberto / Meta. Ideal 3-4x',
 'ratio', '0.00x', 'higher_better',
 ARRAY['sales','forecast'], ARRAY['kommo'],
 'open_pipeline_value / NULLIF(sales_target, 0)', 'forecast', true, NULL),

('forecast_month_revenue', 'Forecast Receita Mes', 'Projecao linear de receita do mes atual',
 'currency', 'R$ #,##0.00', 'higher_better',
 ARRAY['forecast','sales'], ARRAY['kommo'],
 'current_revenue * (days_in_month / NULLIF(days_elapsed,0))', 'forecast', true, NULL),

('goal_attainment_pct', 'Atingimento de Meta', '% da meta de vendas atingido no periodo',
 'percent', '0.0%', 'higher_better',
 ARRAY['sales','goals'], ARRAY['kommo','manual'],
 'actual_revenue / NULLIF(target_revenue, 0)', 'forecast', true, NULL),

('forecast_attainment_pct', 'Forecast vs Meta', '% atingimento projetado se ritmo continuar',
 'percent', '0.0%', 'higher_better',
 ARRAY['forecast','goals'], ARRAY['kommo','manual'],
 'forecast_revenue / NULLIF(target_revenue, 0)', 'forecast', true, NULL),

-- =========================================================
-- ATRIBUICAO CROSS-PLATFORM
-- =========================================================
('attributed_revenue_meta', 'Receita Atribuida Meta', 'Receita das vendas com primeiro toque em Meta Ads',
 'currency', 'R$ #,##0.00', 'higher_better',
 ARRAY['attribution','sales'], ARRAY['meta_ads','kommo'],
 'SUM(revenue) WHERE source=''meta_ads''', 'attribution', true, NULL),

('attributed_revenue_google', 'Receita Atribuida Google', 'Receita das vendas com primeiro toque em Google Ads',
 'currency', 'R$ #,##0.00', 'higher_better',
 ARRAY['attribution','sales'], ARRAY['google_ads','kommo'],
 'SUM(revenue) WHERE source=''google_ads''', 'attribution', true, NULL),

('roas_meta_real', 'ROAS Meta (real)', 'ROAS calculado com receita REAL atribuida ao Meta',
 'ratio', '0.00x', 'higher_better',
 ARRAY['attribution','profitability'], ARRAY['meta_ads','kommo'],
 'attributed_revenue_meta / NULLIF(spend_meta, 0)', 'attribution', true, NULL),

('roas_google_real', 'ROAS Google (real)', 'ROAS calculado com receita REAL atribuida ao Google',
 'ratio', '0.00x', 'higher_better',
 ARRAY['attribution','profitability'], ARRAY['google_ads','kommo'],
 'attributed_revenue_google / NULLIF(spend_google, 0)', 'attribution', true, NULL),

-- =========================================================
-- SAUDE DA OPERACAO
-- =========================================================
('response_time_avg_min', 'Tempo Medio 1a Resposta', 'Minutos entre lead criado e primeira resposta do vendedor',
 'number', '0.0 min', 'lower_better',
 ARRAY['sla','sales'], ARRAY['kommo'],
 'AVG(first_response_at - lead_created_at) IN MINUTES', 'operational', true, NULL),

('unresponded_leads', 'Leads sem Resposta', 'Leads sem nenhuma interacao apos 24h',
 'number', '#,##0', 'lower_better',
 ARRAY['sla','sales'], ARRAY['kommo'],
 'COUNT(*) WHERE leads_24h_no_response', 'operational', true, NULL);

-- =============================================================
-- Verificacao final
-- =============================================================
-- SELECT COUNT(*) AS total_seeded FROM metric_definitions WHERE is_system=true;
-- Resultado esperado: 35 metricas
