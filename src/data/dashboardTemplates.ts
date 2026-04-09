/**
 * ============================================
 * DASHBOARD TEMPLATES — VERSÃO COMPLETA
 * ============================================
 * 6 templates com métricas abrangentes inspiradas
 * no Power BI, Reportei e material V4 Company.
 */

import type { DashboardTemplate, DashboardWidget, WidgetConfig, DataSourceConfig, WidgetPosition } from '@/types/dashboard';

type WidgetDef = Omit<DashboardWidget, 'id' | 'dashboard_id' | 'created_at'>;

function w(
  widget_type: WidgetDef['widget_type'],
  title: string,
  position: WidgetPosition,
  data_source: DataSourceConfig,
  config: WidgetConfig,
): WidgetDef {
  return { widget_type, title, position, data_source, config };
}

// Shorthand for KPI
const kpi = (title: string, x: number, y: number, ww: number, metric: string, format: 'number' | 'currency' | 'percentage', color: string, source: DataSourceConfig['type'] = 'meta_ads') =>
  w('kpi_card', title, { x, y, w: ww, h: 2, minW: 2, minH: 2 },
    { type: source, metrics: [metric], groupBy: 'day' },
    { type: 'kpi_card', kpi: { metric, format, showTrend: true, comparisonPeriod: 'previous_period', color } });

// =====================================================
// 1. META ADS — INSIDE SALES
// =====================================================

const META_ADS_INSIDE_SALES: DashboardTemplate = {
  id: 'meta_ads_inside_sales',
  name: 'Meta Ads — Inside Sales',
  description: 'Campanhas, Leads, CPL, Funil, Criativos, Frequência, Engajamento',
  icon: 'Megaphone',
  category: 'meta_ads',
  theme: { colorScheme: 'light', accentColor: '#1877F2', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'last_30d', platforms: ['meta_ads'] },
  widgets: [
    // Row 1: 6 KPIs principais
    kpi('Investimento', 0, 0, 2, 'spend', 'currency', 'blue'),
    kpi('Leads', 2, 0, 2, 'leads', 'number', 'green'),
    kpi('CPL', 4, 0, 2, 'cost_per_lead', 'currency', 'purple'),
    kpi('Conversões', 6, 0, 2, 'conversions', 'number', 'indigo'),
    kpi('CTR', 8, 0, 2, 'ctr', 'percentage', 'yellow'),
    kpi('CPC', 10, 0, 2, 'cpc', 'currency', 'red'),

    // Row 2: 4 KPIs secundários
    kpi('Impressões', 0, 2, 3, 'impressions', 'number', 'blue'),
    kpi('Alcance', 3, 2, 3, 'reach', 'number', 'indigo'),
    kpi('CPM', 6, 2, 3, 'cpm', 'currency', 'purple'),
    kpi('Frequência', 9, 2, 3, 'frequency', 'number', 'yellow'),

    // Row 3: Spend+Leads over time + Engagement
    w('area_chart', 'Investimento & Leads por Dia', { x: 0, y: 4, w: 8, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['spend', 'leads'], groupBy: 'day' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'date', yAxis: ['spend', 'leads'], colors: ['#3b82f6', '#10b981'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    w('donut_chart', 'Engajamento', { x: 8, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'meta_ads', metrics: ['post_reactions', 'post_comments', 'post_shares'], groupBy: 'campaign' },
      { type: 'donut_chart', chart: { chartType: 'donut', showLegend: true, colors: ['#3b82f6', '#10b981', '#f59e0b'] } }),

    // Row 4: Funil de leads + Ofensores
    w('bar_chart', 'Funil de Leads', { x: 0, y: 8, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['impressions', 'clicks', 'leads', 'conversions'], groupBy: 'campaign' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'stage', yAxis: ['value'], colors: ['#3b82f6', '#60a5fa', '#8b5cf6', '#10b981'], showGrid: true } }),

    w('bar_chart', 'Ofensores — Alto Gasto / Baixa Conversão', { x: 6, y: 8, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['spend', 'conversions', 'cost_per_lead'], groupBy: 'campaign' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'campaign_name', yAxis: ['spend', 'cost_per_lead'], colors: ['#ef4444', '#f59e0b'], showGrid: true, showLegend: true } }),

    // Row 5: Top Criativos (Hook/Hold Rate)
    w('table', 'Top Criativos — Hook & Hold Rate', { x: 0, y: 12, w: 12, h: 4, minW: 6, minH: 3 },
      { type: 'meta_ads', metrics: ['ad_name', 'impressions', 'ctr', 'hook_rate', 'hold_rate', 'spend'], groupBy: 'creative' },
      { type: 'table', table: {
        columns: [
          { key: 'ad_name', label: 'Criativo', sortable: true },
          { key: 'impressions', label: 'Impressões', format: 'number', sortable: true },
          { key: 'ctr', label: 'CTR', format: 'percentage', sortable: true },
          { key: 'hook_rate', label: 'Hook Rate', format: 'percentage', sortable: true },
          { key: 'hold_rate', label: 'Hold Rate', format: 'percentage', sortable: true },
          { key: 'spend', label: 'Investimento', format: 'currency', sortable: true },
        ],
        pageSize: 5, sortBy: 'hook_rate', sortDirection: 'desc',
      } }),

    // Row 6: Video funnel
    w('bar_chart', 'Funil de Vídeo', { x: 0, y: 16, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['video_views', 'video_p25', 'video_p50', 'video_p75', 'video_p100'], groupBy: 'campaign' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'stage', yAxis: ['value'], colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#10b981'], showGrid: true } }),

    // Row 6b: Comparativo período
    w('comparison', 'Comparativo Período', { x: 6, y: 16, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['spend', 'leads', 'conversions', 'ctr', 'cpc'], groupBy: 'day' },
      { type: 'comparison', comparison: { metrics: ['spend', 'leads', 'conversions', 'ctr', 'cpc'], period1: { preset: 'this_month', label: 'Este mês' }, period2: { preset: 'last_month', label: 'Mês passado' }, displayMode: 'side_by_side' } }),

    // Row 7: Campaign performance table (completa)
    w('table', 'Performance por Campanha', { x: 0, y: 20, w: 12, h: 5, minW: 6, minH: 3 },
      { type: 'meta_ads', metrics: ['campaign_name', 'impressions', 'reach', 'clicks', 'ctr', 'spend', 'cpc', 'cpm', 'leads', 'cost_per_lead', 'conversions', 'frequency'], groupBy: 'campaign' },
      { type: 'table', table: {
        columns: [
          { key: 'campaign_name', label: 'Campanha', sortable: true },
          { key: 'impressions', label: 'Impressões', format: 'number', sortable: true },
          { key: 'reach', label: 'Alcance', format: 'number', sortable: true },
          { key: 'clicks', label: 'Cliques', format: 'number', sortable: true },
          { key: 'ctr', label: 'CTR', format: 'percentage', sortable: true },
          { key: 'spend', label: 'Invest.', format: 'currency', sortable: true },
          { key: 'cpc', label: 'CPC', format: 'currency', sortable: true },
          { key: 'cpm', label: 'CPM', format: 'currency', sortable: true },
          { key: 'leads', label: 'Leads', format: 'number', sortable: true },
          { key: 'cost_per_lead', label: 'CPL', format: 'currency', sortable: true },
          { key: 'frequency', label: 'Freq.', format: 'number', sortable: true },
        ],
        pageSize: 10, sortBy: 'spend', sortDirection: 'desc',
      } }),
  ],
};

// =====================================================
// 2. META ADS — E-COMMERCE
// =====================================================

const META_ADS_ECOMMERCE: DashboardTemplate = {
  id: 'meta_ads_ecommerce',
  name: 'Meta Ads — E-commerce',
  description: 'ROAS, Receita, AOV, Conversões, Criativos, Frequência, Distribuição',
  icon: 'ShoppingCart',
  category: 'meta_ads',
  theme: { colorScheme: 'light', accentColor: '#1877F2', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'last_30d', platforms: ['meta_ads'] },
  widgets: [
    // Row 1: 6 KPIs
    kpi('ROAS', 0, 0, 2, 'roas', 'number', 'green'),
    kpi('Receita', 2, 0, 2, 'conversion_value', 'currency', 'blue'),
    kpi('Investimento', 4, 0, 2, 'spend', 'currency', 'purple'),
    kpi('Conversões', 6, 0, 2, 'conversions', 'number', 'indigo'),
    kpi('CPC', 8, 0, 2, 'cpc', 'currency', 'yellow'),
    kpi('CPM', 10, 0, 2, 'cpm', 'currency', 'red'),

    // Row 2: KPIs secundários
    kpi('Alcance', 0, 2, 3, 'reach', 'number', 'blue'),
    kpi('Frequência', 3, 2, 3, 'frequency', 'number', 'purple'),
    kpi('CTR', 6, 2, 3, 'ctr', 'percentage', 'yellow'),
    kpi('Custo/Conversão', 9, 2, 3, 'cost_per_conversion', 'currency', 'red'),

    // Row 3: Revenue chart + ROAS gauge
    w('area_chart', 'Receita vs Investimento Diário', { x: 0, y: 4, w: 8, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['conversion_value', 'spend'], groupBy: 'day' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'date', yAxis: ['conversion_value', 'spend'], colors: ['#10b981', '#3b82f6'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    w('gauge', 'Meta ROAS', { x: 8, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'meta_ads', metrics: ['roas'], groupBy: 'day' },
      { type: 'gauge', gauge: { metric: 'roas', min: 0, max: 10, format: 'number', thresholds: [{ value: 3, color: '#10b981' }, { value: 1.5, color: '#f59e0b' }, { value: 0, color: '#ef4444' }] } }),

    // Row 4: Distribution + ROAS by campaign
    w('pie_chart', 'Distribuição do Investimento', { x: 0, y: 8, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'meta_ads', metrics: ['spend'], groupBy: 'campaign' },
      { type: 'pie_chart', chart: { chartType: 'pie', showLegend: true, showLabels: false, colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'] } }),

    w('bar_chart', 'ROAS por Campanha', { x: 4, y: 8, w: 8, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['roas', 'spend'], groupBy: 'campaign' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'campaign_name', yAxis: ['roas'], colors: ['#10b981'], showGrid: true, showLegend: false } }),

    // Row 5: Ofensores + Comparativo
    w('bar_chart', 'Ofensores — Alto CPA', { x: 0, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['spend', 'cost_per_conversion', 'roas'], groupBy: 'campaign' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'campaign_name', yAxis: ['cost_per_conversion'], colors: ['#ef4444'], showGrid: true } }),

    w('comparison', 'Comparativo Período', { x: 6, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['spend', 'conversion_value', 'roas', 'conversions'], groupBy: 'day' },
      { type: 'comparison', comparison: { metrics: ['spend', 'conversion_value', 'roas', 'conversions'], period1: { preset: 'this_month', label: 'Este mês' }, period2: { preset: 'last_month', label: 'Mês passado' }, displayMode: 'side_by_side' } }),

    // Row 6: Criativos + Video funnel
    w('table', 'Top Criativos', { x: 0, y: 16, w: 7, h: 4, minW: 5, minH: 3 },
      { type: 'meta_ads', metrics: ['ad_name', 'impressions', 'ctr', 'hook_rate', 'hold_rate', 'roas', 'spend'], groupBy: 'creative' },
      { type: 'table', table: {
        columns: [
          { key: 'ad_name', label: 'Criativo', sortable: true },
          { key: 'ctr', label: 'CTR', format: 'percentage', sortable: true },
          { key: 'hook_rate', label: 'Hook', format: 'percentage', sortable: true },
          { key: 'hold_rate', label: 'Hold', format: 'percentage', sortable: true },
          { key: 'roas', label: 'ROAS', format: 'number', sortable: true },
          { key: 'spend', label: 'Invest.', format: 'currency', sortable: true },
        ],
        pageSize: 5, sortBy: 'roas', sortDirection: 'desc',
      } }),

    w('bar_chart', 'Funil de Vídeo', { x: 7, y: 16, w: 5, h: 4, minW: 3, minH: 3 },
      { type: 'meta_ads', metrics: ['video_views', 'video_p25', 'video_p50', 'video_p75', 'video_p100'], groupBy: 'campaign' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'stage', yAxis: ['value'], colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#10b981'], showGrid: true } }),

    // Row 7: Full table
    w('table', 'Performance Completa', { x: 0, y: 20, w: 12, h: 5, minW: 6, minH: 3 },
      { type: 'meta_ads', metrics: ['campaign_name', 'spend', 'conversion_value', 'roas', 'conversions', 'cost_per_conversion', 'cpc', 'ctr', 'reach', 'frequency'], groupBy: 'campaign' },
      { type: 'table', table: {
        columns: [
          { key: 'campaign_name', label: 'Campanha', sortable: true },
          { key: 'spend', label: 'Invest.', format: 'currency', sortable: true },
          { key: 'conversion_value', label: 'Receita', format: 'currency', sortable: true },
          { key: 'roas', label: 'ROAS', format: 'number', sortable: true },
          { key: 'conversions', label: 'Conv.', format: 'number', sortable: true },
          { key: 'cost_per_conversion', label: 'CPA', format: 'currency', sortable: true },
          { key: 'cpc', label: 'CPC', format: 'currency', sortable: true },
          { key: 'ctr', label: 'CTR', format: 'percentage', sortable: true },
          { key: 'reach', label: 'Alcance', format: 'number', sortable: true },
          { key: 'frequency', label: 'Freq.', format: 'number', sortable: true },
        ],
        pageSize: 10, sortBy: 'roas', sortDirection: 'desc',
      } }),
  ],
};

// =====================================================
// 3. GOOGLE ADS — INSIDE SALES
// =====================================================

const GOOGLE_ADS_INSIDE_SALES: DashboardTemplate = {
  id: 'google_ads_inside_sales',
  name: 'Google Ads — Inside Sales',
  description: 'Campanhas, Leads, CPA, Busca, Conversões, Comparativo',
  icon: 'Megaphone',
  category: 'google_ads',
  theme: { colorScheme: 'light', accentColor: '#4285F4', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'last_30d', platforms: ['google_ads'] },
  widgets: [
    kpi('Investimento', 0, 0, 2, 'spend', 'currency', 'blue', 'google_ads'),
    kpi('Conversões', 2, 0, 2, 'conversions', 'number', 'green', 'google_ads'),
    kpi('CPA', 4, 0, 2, 'cost_per_conversion', 'currency', 'purple', 'google_ads'),
    kpi('CTR', 6, 0, 2, 'ctr', 'percentage', 'yellow', 'google_ads'),
    kpi('CPC', 8, 0, 2, 'cpc', 'currency', 'red', 'google_ads'),
    kpi('Impressões', 10, 0, 2, 'impressions', 'number', 'indigo', 'google_ads'),

    w('line_chart', 'Performance Diária', { x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
      { type: 'google_ads', metrics: ['spend', 'conversions'], groupBy: 'day' },
      { type: 'line_chart', chart: { chartType: 'line', xAxis: 'date', yAxis: ['spend', 'conversions'], colors: ['#4285F4', '#34A853'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    w('donut_chart', 'Investimento por Tipo', { x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'google_ads', metrics: ['spend'], groupBy: 'campaign' },
      { type: 'donut_chart', chart: { chartType: 'donut', showLegend: true, colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#9AA0A6'] } }),

    w('bar_chart', 'Top Campanhas por Conversão', { x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'google_ads', metrics: ['conversions'], groupBy: 'campaign' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'campaign_name', yAxis: ['conversions'], colors: ['#34A853'], showGrid: true } }),

    w('bar_chart', 'Ofensores — CPA Alto', { x: 6, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'google_ads', metrics: ['cost_per_conversion', 'spend'], groupBy: 'campaign' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'campaign_name', yAxis: ['cost_per_conversion'], colors: ['#EA4335'], showGrid: true } }),

    w('comparison', 'Comparativo Período', { x: 0, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'google_ads', metrics: ['spend', 'conversions', 'ctr', 'cpc', 'cost_per_conversion'], groupBy: 'day' },
      { type: 'comparison', comparison: { metrics: ['spend', 'conversions', 'ctr', 'cpc', 'cost_per_conversion'], period1: { preset: 'this_month', label: 'Este mês' }, period2: { preset: 'last_month', label: 'Mês passado' }, displayMode: 'side_by_side' } }),

    w('area_chart', 'CPA ao Longo do Tempo', { x: 6, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'google_ads', metrics: ['cost_per_conversion'], groupBy: 'day' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'date', yAxis: ['cost_per_conversion'], colors: ['#EA4335'], showGrid: true, curveType: 'monotone' } }),

    w('table', 'Detalhamento por Campanha', { x: 0, y: 14, w: 12, h: 5, minW: 6, minH: 3 },
      { type: 'google_ads', metrics: ['campaign_name', 'impressions', 'clicks', 'ctr', 'spend', 'cpc', 'conversions', 'cost_per_conversion'], groupBy: 'campaign' },
      { type: 'table', table: {
        columns: [
          { key: 'campaign_name', label: 'Campanha', sortable: true },
          { key: 'impressions', label: 'Impressões', format: 'number', sortable: true },
          { key: 'clicks', label: 'Cliques', format: 'number', sortable: true },
          { key: 'ctr', label: 'CTR', format: 'percentage', sortable: true },
          { key: 'spend', label: 'Invest.', format: 'currency', sortable: true },
          { key: 'cpc', label: 'CPC', format: 'currency', sortable: true },
          { key: 'conversions', label: 'Conv.', format: 'number', sortable: true },
          { key: 'cost_per_conversion', label: 'CPA', format: 'currency', sortable: true },
        ],
        pageSize: 10, sortBy: 'spend', sortDirection: 'desc',
      } }),
  ],
};

// =====================================================
// 4. GOOGLE ADS — E-COMMERCE
// =====================================================

const GOOGLE_ADS_ECOMMERCE: DashboardTemplate = {
  id: 'google_ads_ecommerce',
  name: 'Google Ads — E-commerce',
  description: 'ROAS, Receita, Shopping, CPC, Comparativo, Ofensores',
  icon: 'ShoppingCart',
  category: 'google_ads',
  theme: { colorScheme: 'light', accentColor: '#34A853', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'last_30d', platforms: ['google_ads'] },
  widgets: [
    kpi('ROAS', 0, 0, 2, 'roas', 'number', 'green', 'google_ads'),
    kpi('Receita', 2, 0, 2, 'conversion_value', 'currency', 'blue', 'google_ads'),
    kpi('Investimento', 4, 0, 2, 'spend', 'currency', 'purple', 'google_ads'),
    kpi('Conversões', 6, 0, 2, 'conversions', 'number', 'indigo', 'google_ads'),
    kpi('CPC', 8, 0, 2, 'cpc', 'currency', 'yellow', 'google_ads'),
    kpi('CTR', 10, 0, 2, 'ctr', 'percentage', 'red', 'google_ads'),

    w('area_chart', 'Receita vs Investimento', { x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
      { type: 'google_ads', metrics: ['conversion_value', 'spend'], groupBy: 'day' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'date', yAxis: ['conversion_value', 'spend'], colors: ['#34A853', '#4285F4'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    w('gauge', 'Meta ROAS', { x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'google_ads', metrics: ['roas'], groupBy: 'day' },
      { type: 'gauge', gauge: { metric: 'roas', min: 0, max: 10, format: 'number', thresholds: [{ value: 3, color: '#34A853' }, { value: 1.5, color: '#FBBC05' }, { value: 0, color: '#EA4335' }] } }),

    w('bar_chart', 'ROAS por Campanha', { x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'google_ads', metrics: ['roas'], groupBy: 'campaign' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'campaign_name', yAxis: ['roas'], colors: ['#34A853'], showGrid: true } }),

    w('pie_chart', 'Distribuição de Investimento', { x: 6, y: 6, w: 6, h: 4, minW: 3, minH: 3 },
      { type: 'google_ads', metrics: ['spend'], groupBy: 'campaign' },
      { type: 'pie_chart', chart: { chartType: 'pie', showLegend: true, colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#9AA0A6'] } }),

    w('bar_chart', 'Ofensores — Baixo ROAS', { x: 0, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'google_ads', metrics: ['roas', 'spend'], groupBy: 'campaign' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'campaign_name', yAxis: ['roas', 'spend'], colors: ['#EA4335', '#9AA0A6'], showGrid: true, showLegend: true } }),

    w('comparison', 'Comparativo', { x: 6, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'google_ads', metrics: ['spend', 'conversion_value', 'roas', 'conversions'], groupBy: 'day' },
      { type: 'comparison', comparison: { metrics: ['spend', 'conversion_value', 'roas', 'conversions'], period1: { preset: 'this_month', label: 'Este mês' }, period2: { preset: 'last_month', label: 'Mês passado' }, displayMode: 'side_by_side' } }),

    w('table', 'Performance Detalhada', { x: 0, y: 14, w: 12, h: 5, minW: 6, minH: 3 },
      { type: 'google_ads', metrics: ['campaign_name', 'spend', 'conversion_value', 'roas', 'conversions', 'cost_per_conversion', 'cpc', 'ctr', 'impressions'], groupBy: 'campaign' },
      { type: 'table', table: {
        columns: [
          { key: 'campaign_name', label: 'Campanha', sortable: true },
          { key: 'spend', label: 'Invest.', format: 'currency', sortable: true },
          { key: 'conversion_value', label: 'Receita', format: 'currency', sortable: true },
          { key: 'roas', label: 'ROAS', format: 'number', sortable: true },
          { key: 'conversions', label: 'Conv.', format: 'number', sortable: true },
          { key: 'cost_per_conversion', label: 'CPA', format: 'currency', sortable: true },
          { key: 'cpc', label: 'CPC', format: 'currency', sortable: true },
          { key: 'ctr', label: 'CTR', format: 'percentage', sortable: true },
        ],
        pageSize: 10, sortBy: 'roas', sortDirection: 'desc',
      } }),
  ],
};

// =====================================================
// 5. CRM/VENDAS — FUNIL (expandido)
// =====================================================

const CRM_VENDAS_FUNIL: DashboardTemplate = {
  id: 'crm_vendas_funil',
  name: 'CRM/Vendas — Funil',
  description: 'Leads, Oportunidades, Conversão, Perdas, Tempo de Fechamento, Pipeline, Cohort',
  icon: 'Target',
  category: 'crm',
  theme: { colorScheme: 'light', accentColor: '#8b5cf6', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'this_month' },
  widgets: [
    // Row 1: 6 KPIs
    kpi('Total Leads', 0, 0, 2, 'total_leads', 'number', 'blue', 'bi_leads'),
    kpi('Oportunidades', 2, 0, 2, 'oportunidades', 'number', 'purple', 'bi_oportunidades'),
    kpi('Vendas', 4, 0, 2, 'vendas', 'number', 'green', 'bi_leads'),
    kpi('Ticket Médio', 6, 0, 2, 'ticket_medio', 'currency', 'indigo', 'bi_leads'),
    kpi('Taxa Conversão', 8, 0, 2, 'taxa_conversao', 'percentage', 'yellow', 'bi_leads'),
    kpi('Valor Pipeline', 10, 0, 2, 'valor_pipeline', 'currency', 'blue', 'bi_oportunidades'),

    // Row 2: KPIs tempo + taxa
    kpi('Tempo Médio Fechamento', 0, 2, 3, 'tempo_medio_fechamento', 'number', 'blue', 'bi_leads'),
    kpi('Taxa de Resposta', 3, 2, 3, 'taxa_resposta', 'percentage', 'green', 'bi_leads'),
    kpi('Perdas', 6, 2, 3, 'perdas', 'number', 'red', 'bi_leads'),
    kpi('Em Aberto', 9, 2, 3, 'abertos', 'number', 'yellow', 'bi_leads'),

    // Row 3: Funil + Leads over time
    w('bar_chart', 'Funil de Conversão', { x: 0, y: 4, w: 5, h: 5, minW: 4, minH: 4 },
      { type: 'bi_leads', metrics: ['status_funil'], groupBy: 'status_funil' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'status', yAxis: ['count'], colors: ['#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa', '#10b981'], showGrid: true } }),

    w('area_chart', 'Leads por Mês', { x: 5, y: 4, w: 7, h: 5, minW: 4, minH: 3 },
      { type: 'bi_leads', metrics: ['count', 'vendas'], groupBy: 'month' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'month', yAxis: ['leads', 'vendas'], colors: ['#3b82f6', '#10b981'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    // Row 4: Cohort analysis + Motivos de perda
    w('bar_chart', 'Conversão por Safra (Cohort)', { x: 0, y: 9, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'bi_leads', metrics: ['leads', 'vendas', 'taxa_conversao'], groupBy: 'cohort' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'cohort', yAxis: ['leads', 'vendas'], colors: ['#93c5fd', '#10b981'], stacked: false, showGrid: true, showLegend: true } }),

    w('donut_chart', 'Motivos de Perda', { x: 6, y: 9, w: 3, h: 4, minW: 3, minH: 3 },
      { type: 'bi_leads', metrics: ['perdas'], groupBy: 'motivo_perda' },
      { type: 'donut_chart', chart: { chartType: 'donut', showLegend: true, colors: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'] } }),

    w('donut_chart', 'Perdas por Fonte', { x: 9, y: 9, w: 3, h: 4, minW: 3, minH: 3 },
      { type: 'bi_leads', metrics: ['perdas'], groupBy: 'fonte' },
      { type: 'donut_chart', chart: { chartType: 'donut', showLegend: true, colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#6b7280'] } }),

    // Row 5: Tempo de fechamento + Comparativo
    w('bar_chart', 'Tempo de Fechamento por Vendedor', { x: 0, y: 13, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'bi_leads', metrics: ['tempo_medio_fechamento'], groupBy: 'vendedor' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'vendedor', yAxis: ['dias'], colors: ['#3b82f6'], showGrid: true } }),

    w('comparison', 'Comparativo Mensal', { x: 6, y: 13, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'bi_leads', metrics: ['leads', 'vendas', 'perdas', 'taxa_conversao', 'ticket_medio'], groupBy: 'month' },
      { type: 'comparison', comparison: { metrics: ['leads', 'vendas', 'perdas', 'taxa_conversao', 'ticket_medio'], period1: { preset: 'this_month', label: 'Este mês' }, period2: { preset: 'last_month', label: 'Mês passado' }, displayMode: 'side_by_side' } }),

    // Row 6: Performance table
    w('table', 'Performance por Vendedor', { x: 0, y: 17, w: 12, h: 5, minW: 5, minH: 3 },
      { type: 'bi_vendedores', metrics: ['vendedor', 'leads', 'oportunidades', 'vendas', 'perdas', 'abertos', 'taxa_conversao', 'valor_total', 'tempo_medio'], groupBy: 'vendedor' },
      { type: 'table', table: {
        columns: [
          { key: 'vendedor_nome', label: 'Vendedor', sortable: true },
          { key: 'leads', label: 'Leads', format: 'number', sortable: true },
          { key: 'oportunidades', label: 'Opps', format: 'number', sortable: true },
          { key: 'vendas', label: 'Vendas', format: 'number', sortable: true },
          { key: 'perdas', label: 'Perdas', format: 'number', sortable: true },
          { key: 'abertos', label: 'Abertos', format: 'number', sortable: true },
          { key: 'taxa_conversao', label: 'Conversão', format: 'percentage', sortable: true },
          { key: 'valor_total', label: 'Valor Total', format: 'currency', sortable: true },
          { key: 'tempo_medio', label: 'Dias Médio', format: 'number', sortable: true },
        ],
        pageSize: 10, sortBy: 'vendas', sortDirection: 'desc',
      } }),
  ],
};

// =====================================================
// 6. E-COMMERCE — FATURAMENTO (expandido)
// =====================================================

const ECOMMERCE_FATURAMENTO: DashboardTemplate = {
  id: 'ecommerce_faturamento',
  name: 'E-commerce — Faturamento',
  description: 'Receita, Pedidos, Curva ABC, RFM, Geográfico, Cupons, CAC, Recompra',
  icon: 'BarChart3',
  category: 'ecommerce',
  theme: { colorScheme: 'light', accentColor: '#10b981', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'last_30d' },
  widgets: [
    // Row 1: 6 KPIs
    kpi('Receita Total', 0, 0, 2, 'receita', 'currency', 'green', 'ecommerce'),
    kpi('Pedidos', 2, 0, 2, 'pedidos', 'number', 'blue', 'ecommerce'),
    kpi('Ticket Médio', 4, 0, 2, 'ticket_medio', 'currency', 'purple', 'ecommerce'),
    kpi('Taxa Conversão', 6, 0, 2, 'taxa_conversao', 'percentage', 'yellow', 'ecommerce'),
    kpi('CAC', 8, 0, 2, 'cac', 'currency', 'red', 'ecommerce'),
    kpi('Taxa Recompra', 10, 0, 2, 'taxa_recompra', 'percentage', 'indigo', 'ecommerce'),

    // Row 2: Revenue chart + Revenue by source
    w('area_chart', 'Receita Mensal', { x: 0, y: 2, w: 7, h: 4, minW: 4, minH: 3 },
      { type: 'ecommerce', metrics: ['receita', 'pedidos'], groupBy: 'month' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'month', yAxis: ['receita'], colors: ['#10b981'], showGrid: true, curveType: 'monotone' } }),

    w('bar_chart', 'Receita por Fonte', { x: 7, y: 2, w: 5, h: 4, minW: 3, minH: 3 },
      { type: 'ecommerce', metrics: ['receita'], groupBy: 'fonte' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'source', yAxis: ['receita'], colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'], showGrid: true } }),

    // Row 3: Curva ABC + Distribuição geográfica
    w('bar_chart', 'Curva ABC — Produtos', { x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'ecommerce', metrics: ['receita', 'percentual_acumulado'], groupBy: 'product' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'product_name', yAxis: ['receita'], colors: ['#10b981', '#f59e0b', '#ef4444'], showGrid: true, showLegend: false } }),

    w('bar_chart', 'Vendas por Estado', { x: 6, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'ecommerce', metrics: ['pedidos', 'receita'], groupBy: 'estado' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'estado', yAxis: ['receita'], colors: ['#3b82f6'], showGrid: true } }),

    // Row 4: ROAS table + Source donut + Status pedidos
    w('table', 'ROAS por Canal', { x: 0, y: 10, w: 5, h: 4, minW: 4, minH: 3 },
      { type: 'ecommerce', metrics: ['source', 'receita', 'pedidos', 'roas'], groupBy: 'fonte' },
      { type: 'table', table: {
        columns: [
          { key: 'source', label: 'Fonte', sortable: true },
          { key: 'receita', label: 'Receita', format: 'currency', sortable: true },
          { key: 'pedidos', label: 'Pedidos', format: 'number', sortable: true },
          { key: 'roas', label: 'ROAS', format: 'number', sortable: true },
        ],
        pageSize: 5, sortBy: 'receita', sortDirection: 'desc',
      } }),

    w('donut_chart', 'Mix por Fonte', { x: 5, y: 10, w: 3, h: 4, minW: 3, minH: 3 },
      { type: 'ecommerce', metrics: ['receita'], groupBy: 'fonte' },
      { type: 'donut_chart', chart: { chartType: 'donut', showLegend: true, colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'] } }),

    w('pie_chart', 'Status de Pedidos', { x: 8, y: 10, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'ecommerce', metrics: ['pedidos'], groupBy: 'status' as 'product' },
      { type: 'pie_chart', chart: { chartType: 'pie', showLegend: true, colors: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'] } }),

    // Row 5: RFM + Cupons
    w('bar_chart', 'Análise RFM — Segmentos de Clientes', { x: 0, y: 14, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'ecommerce', metrics: ['clientes', 'receita'], groupBy: 'product' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'segmento', yAxis: ['clientes', 'receita'], colors: ['#3b82f6', '#10b981'], stacked: false, showGrid: true, showLegend: true } }),

    w('table', 'Faturamento por Cupom', { x: 6, y: 14, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'ecommerce', metrics: ['cupom', 'pedidos', 'receita', 'desconto'], groupBy: 'cupom' },
      { type: 'table', table: {
        columns: [
          { key: 'cupom', label: 'Cupom', sortable: true },
          { key: 'pedidos', label: 'Pedidos', format: 'number', sortable: true },
          { key: 'receita', label: 'Receita', format: 'currency', sortable: true },
          { key: 'desconto', label: 'Desconto', format: 'currency', sortable: true },
        ],
        pageSize: 5, sortBy: 'receita', sortDirection: 'desc',
      } }),

    // Row 6: Top products table (completa)
    w('table', 'Top Produtos', { x: 0, y: 18, w: 12, h: 5, minW: 6, minH: 3 },
      { type: 'ecommerce', metrics: ['product_name', 'vendas', 'receita', 'ticket', 'curva'], groupBy: 'product' },
      { type: 'table', table: {
        columns: [
          { key: 'product_name', label: 'Produto', sortable: true },
          { key: 'vendas', label: 'Vendas', format: 'number', sortable: true },
          { key: 'receita', label: 'Receita', format: 'currency', sortable: true },
          { key: 'ticket', label: 'Ticket', format: 'currency', sortable: true },
          { key: 'curva', label: 'Curva', format: 'text', sortable: true },
        ],
        pageSize: 10, sortBy: 'receita', sortDirection: 'desc',
      } }),

    // Row 7: Comparativo
    w('comparison', 'Comparativo Mensal', { x: 0, y: 23, w: 12, h: 4, minW: 6, minH: 3 },
      { type: 'ecommerce', metrics: ['receita', 'pedidos', 'ticket_medio', 'taxa_conversao', 'cac'], groupBy: 'month' },
      { type: 'comparison', comparison: { metrics: ['receita', 'pedidos', 'ticket_medio', 'taxa_conversao', 'cac'], period1: { preset: 'this_month', label: 'Este mês' }, period2: { preset: 'last_month', label: 'Mês passado' }, displayMode: 'side_by_side' } }),
  ],
};

// =====================================================
// 7. PROJECT REPORT — ClickUp + Ads (Cross-Platform)
// =====================================================

const PROJECT_REPORT: DashboardTemplate = {
  id: 'project_report',
  name: 'Project Report — Gestão + Performance',
  description: 'Visão unificada: tarefas ClickUp, Ads (Meta+Google), tempo, velocidade e ROI',
  icon: 'FolderKanban',
  category: 'project_report',
  theme: { colorScheme: 'light', accentColor: '#7C3AED', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'last_30d' },
  widgets: [
    // Row 1: Project KPIs (ClickUp)
    kpi('Tarefas Total', 0, 0, 2, 'total_tasks', 'number', 'purple', 'clickup'),
    kpi('Concluídas', 2, 0, 2, 'completed_tasks', 'number', 'green', 'clickup'),
    kpi('Em Progresso', 4, 0, 2, 'in_progress_tasks', 'number', 'blue', 'clickup'),
    kpi('Atrasadas', 6, 0, 2, 'overdue_tasks', 'number', 'red', 'clickup'),
    kpi('Taxa Conclusão', 8, 0, 2, 'completion_rate', 'percentage', 'indigo', 'clickup'),
    kpi('Ciclo Médio (dias)', 10, 0, 2, 'avg_cycle_time', 'number', 'yellow', 'clickup'),

    // Row 2: Ads KPIs (Cross-platform)
    kpi('Investimento Ads', 0, 2, 3, 'spend', 'currency', 'blue'),
    kpi('Leads', 3, 2, 3, 'leads', 'number', 'green'),
    kpi('ROAS', 6, 2, 3, 'roas', 'number', 'purple'),
    kpi('CPL', 9, 2, 3, 'cost_per_lead', 'currency', 'red'),

    // Row 3: Velocity chart (ClickUp) + Spend over time (Ads)
    w('area_chart', 'Velocidade do Projeto (semanal)', { x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'clickup', metrics: ['criadas', 'concluidas'], groupBy: 'week' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'date', yAxis: ['criadas', 'concluidas'], colors: ['#8b5cf6', '#10b981'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    w('line_chart', 'Investimento & Leads por Dia', { x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['spend', 'leads'], groupBy: 'day' },
      { type: 'line_chart', chart: { chartType: 'line', xAxis: 'date', yAxis: ['spend', 'leads'], colors: ['#3b82f6', '#10b981'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    // Row 4: Tasks by Status (pie) + Tasks by Assignee (bar) + Tasks by Priority (donut)
    w('donut_chart', 'Tarefas por Status', { x: 0, y: 8, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'clickup', metrics: ['count'], groupBy: 'status' },
      { type: 'donut_chart', chart: { chartType: 'donut', showLegend: true, colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'] } }),

    w('bar_chart', 'Tarefas por Responsável', { x: 4, y: 8, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'clickup', metrics: ['total', 'completed'], groupBy: 'assignee' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'assignee', yAxis: ['total', 'completed'], colors: ['#8b5cf6', '#10b981'], stacked: false, showGrid: true, showLegend: true } }),

    w('pie_chart', 'Prioridade das Tarefas', { x: 8, y: 8, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'clickup', metrics: ['count'], groupBy: 'priority' },
      { type: 'pie_chart', chart: { chartType: 'pie', showLegend: true, colors: ['#ef4444', '#f59e0b', '#3b82f6', '#6b7280'] } }),

    // Row 5: Top Campaigns table + Overdue tasks table
    w('table', 'Top Campanhas por Investimento', { x: 0, y: 12, w: 6, h: 5, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['campaign_name', 'spend', 'leads', 'ctr', 'roas'], groupBy: 'campaign' },
      { type: 'table', table: {
        columns: [
          { key: 'campaign_name', label: 'Campanha', sortable: true },
          { key: 'spend', label: 'Investimento', format: 'currency', sortable: true },
          { key: 'leads', label: 'Leads', format: 'number', sortable: true },
          { key: 'ctr', label: 'CTR', format: 'percentage', sortable: true },
          { key: 'roas', label: 'ROAS', format: 'number', sortable: true },
        ],
        pageSize: 10, sortBy: 'spend', sortDirection: 'desc',
      } }),

    w('table', 'Tarefas Atrasadas', { x: 6, y: 12, w: 6, h: 5, minW: 4, minH: 3 },
      { type: 'clickup', metrics: ['name', 'assignee', 'due_date', 'days_overdue'], groupBy: 'status' },
      { type: 'table', table: {
        columns: [
          { key: 'name', label: 'Tarefa', sortable: true },
          { key: 'assignee', label: 'Responsável', sortable: true },
          { key: 'due_date', label: 'Prazo', sortable: true },
          { key: 'days_overdue', label: 'Dias Atraso', format: 'number', sortable: true },
        ],
        pageSize: 10, sortBy: 'days_overdue', sortDirection: 'desc',
      } }),

    // Row 6: Funnel + Goals + Comparativo
    w('funnel_chart', 'Funil de Tarefas', { x: 0, y: 17, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'clickup', metrics: ['value'], groupBy: 'status' },
      { type: 'funnel_chart', chart: { chartType: 'funnel', colors: ['#8b5cf6', '#3b82f6', '#10b981'], showLegend: true } }),

    w('bar_chart', 'Metas (ClickUp Goals)', { x: 4, y: 17, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'clickup', metrics: ['percent_completed'], groupBy: 'goal' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'name', yAxis: ['percent_completed'], colors: ['#7C3AED'], showGrid: true } }),

    w('comparison', 'Comparativo — Período Anterior', { x: 8, y: 17, w: 4, h: 4, minW: 4, minH: 3 },
      { type: 'meta_ads', metrics: ['spend', 'leads', 'roas', 'ctr'], groupBy: 'day' },
      { type: 'comparison', comparison: { metrics: ['spend', 'leads', 'roas', 'ctr'], period1: { preset: 'this_month', label: 'Este mês' }, period2: { preset: 'last_month', label: 'Mês passado' }, displayMode: 'side_by_side' } }),
  ],
};

// =====================================================
// 8. SEO REPORT — SEARCH CONSOLE + GA4
// =====================================================

const SEO_REPORT: DashboardTemplate = {
  id: 'seo_report',
  name: 'SEO Report — Search Console + GA4',
  description: 'Queries, páginas, posição, tráfego orgânico, CTR, impressões',
  icon: 'Search',
  category: 'search_console',
  theme: { colorScheme: 'light', accentColor: '#34A853', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'last_30d', platforms: ['search_console', 'ga4'] },
  widgets: [
    // Row 1: 6 KPIs
    kpi('Clicks', 0, 0, 2, 'clicks', 'number', 'green', 'search_console'),
    kpi('Impressions', 2, 0, 2, 'impressions', 'number', 'blue', 'search_console'),
    kpi('CTR', 4, 0, 2, 'ctr', 'percentage', 'purple', 'search_console'),
    kpi('Avg Position', 6, 0, 2, 'position', 'number', 'yellow', 'search_console'),
    kpi('Sessions', 8, 0, 2, 'sessions', 'number', 'indigo', 'ga4'),
    kpi('Pageviews', 10, 0, 2, 'pageviews', 'number', 'red', 'ga4'),

    // Row 2: Daily clicks + impressions
    w('line_chart', 'Clicks & Impressões por Dia', { x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
      { type: 'search_console', metrics: ['clicks', 'impressions'], groupBy: 'day' },
      { type: 'line_chart', chart: { chartType: 'line', xAxis: 'date', yAxis: ['clicks', 'impressions'], colors: ['#34A853', '#4285F4'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    // Row 2b: Top queries by clicks
    w('bar_chart', 'Top Queries por Clicks', { x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'search_console', metrics: ['clicks'], groupBy: 'query' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'query', yAxis: ['clicks'], colors: ['#34A853'], showGrid: true } }),

    // Row 3: GA4 daily sessions + users
    w('area_chart', 'Sessões & Usuários (GA4)', { x: 0, y: 6, w: 8, h: 4, minW: 4, minH: 3 },
      { type: 'ga4', metrics: ['sessions', 'users'], groupBy: 'day' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'date', yAxis: ['sessions', 'users'], colors: ['#4285F4', '#FBBC05'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    // Row 3b: Traffic by source
    w('pie_chart', 'Tráfego por Fonte', { x: 8, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'ga4', metrics: ['sessions'], groupBy: 'fonte' },
      { type: 'pie_chart', chart: { chartType: 'pie', showLegend: true, showLabels: false, colors: ['#34A853', '#4285F4', '#EA4335', '#FBBC05', '#8b5cf6'] } }),

    // Row 4: Top queries table
    w('table', 'Top Queries', { x: 0, y: 10, w: 12, h: 5, minW: 6, minH: 3 },
      { type: 'search_console', metrics: ['query', 'clicks', 'impressions', 'ctr', 'position'], groupBy: 'query' },
      { type: 'table', table: {
        columns: [
          { key: 'query', label: 'Query', sortable: true },
          { key: 'clicks', label: 'Clicks', format: 'number', sortable: true },
          { key: 'impressions', label: 'Impressões', format: 'number', sortable: true },
          { key: 'ctr', label: 'CTR', format: 'percentage', sortable: true },
          { key: 'position', label: 'Posição', format: 'number', sortable: true },
        ],
        pageSize: 10, sortBy: 'clicks', sortDirection: 'desc',
      } }),
  ],
};

// =====================================================
// 9. SOCIAL MEDIA — YOUTUBE + LINKEDIN + META
// =====================================================

const SOCIAL_MEDIA_REPORT: DashboardTemplate = {
  id: 'social_media_report',
  name: 'Social Media — YouTube + LinkedIn + Meta',
  description: 'Visualizações, seguidores, engajamento, top conteúdos',
  icon: 'Share2',
  category: 'youtube',
  theme: { colorScheme: 'light', accentColor: '#FF0000', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'last_30d', platforms: ['youtube', 'linkedin', 'meta_ads'] },
  widgets: [
    // Row 1: 6 KPIs
    kpi('Views', 0, 0, 2, 'views', 'number', 'red', 'youtube'),
    kpi('Subscribers', 2, 0, 2, 'subscribers', 'number', 'red', 'youtube'),
    kpi('Followers', 4, 0, 2, 'followers', 'number', 'blue', 'linkedin'),
    kpi('Engagement Rate', 6, 0, 2, 'engagement_rate', 'percentage', 'blue', 'linkedin'),
    kpi('Impressions', 8, 0, 2, 'impressions', 'number', 'indigo', 'meta_ads'),
    kpi('Reach', 10, 0, 2, 'reach', 'number', 'purple', 'meta_ads'),

    // Row 2: YouTube views per day
    w('area_chart', 'YouTube Views por Dia', { x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
      { type: 'youtube', metrics: ['views'], groupBy: 'day' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'date', yAxis: ['views'], colors: ['#FF0000'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    // Row 2b: LinkedIn impressions + clicks
    w('line_chart', 'LinkedIn Impressões & Cliques', { x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'linkedin', metrics: ['impressions', 'clicks'], groupBy: 'day' },
      { type: 'line_chart', chart: { chartType: 'line', xAxis: 'date', yAxis: ['impressions', 'clicks'], colors: ['#0A66C2', '#10b981'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    // Row 3: Top videos bar chart
    w('bar_chart', 'Top Vídeos', { x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'youtube', metrics: ['views'], groupBy: 'video' },
      { type: 'bar_chart', chart: { chartType: 'horizontal_bar', xAxis: 'title', yAxis: ['views'], colors: ['#FF0000'], showGrid: true } }),

    // Row 3b: Engagement by platform donut
    w('donut_chart', 'Engajamento por Plataforma', { x: 6, y: 6, w: 6, h: 4, minW: 3, minH: 3 },
      { type: 'meta_ads', metrics: ['engagement'], groupBy: 'platform' },
      { type: 'donut_chart', chart: { chartType: 'donut', showLegend: true, colors: ['#FF0000', '#0A66C2', '#1877F2'] } }),

    // Row 4: YouTube top videos table
    w('table', 'YouTube — Top Vídeos', { x: 0, y: 10, w: 12, h: 5, minW: 6, minH: 3 },
      { type: 'youtube', metrics: ['title', 'views', 'likes', 'comments'], groupBy: 'video' },
      { type: 'table', table: {
        columns: [
          { key: 'title', label: 'Título', sortable: true },
          { key: 'views', label: 'Views', format: 'number', sortable: true },
          { key: 'likes', label: 'Likes', format: 'number', sortable: true },
          { key: 'comments', label: 'Comentários', format: 'number', sortable: true },
        ],
        pageSize: 10, sortBy: 'views', sortDirection: 'desc',
      } }),
  ],
};

// =====================================================
// 10. CRM PIPELINE — KOMMO
// =====================================================

const CRM_PIPELINE_KOMMO: DashboardTemplate = {
  id: 'crm_pipeline_kommo',
  name: 'CRM Pipeline — Kommo',
  description: 'Funil de vendas, leads, conversão, ciclo, responsáveis',
  icon: 'Users',
  category: 'kommo',
  theme: { colorScheme: 'light', accentColor: '#4C75A3', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'last_30d', platforms: ['kommo'] },
  widgets: [
    // Row 1: 6 KPIs
    kpi('Total Leads', 0, 0, 2, 'total_leads', 'number', 'blue', 'kommo'),
    kpi('Leads Won', 2, 0, 2, 'leads_won', 'number', 'green', 'kommo'),
    kpi('Conversão', 4, 0, 2, 'conversion_rate', 'percentage', 'purple', 'kommo'),
    kpi('Valor Pipeline', 6, 0, 2, 'pipeline_value', 'currency', 'indigo', 'kommo'),
    kpi('Ciclo Médio', 8, 0, 2, 'avg_deal_cycle', 'number', 'yellow', 'kommo'),
    kpi('Ticket Médio', 10, 0, 2, 'avg_deal_value', 'currency', 'red', 'kommo'),

    // Row 2: Funnel by status
    w('funnel_chart', 'Funil de Leads por Status', { x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'kommo', metrics: ['value'], groupBy: 'status_funil' },
      { type: 'funnel_chart', chart: { chartType: 'funnel', colors: ['#4C75A3', '#3b82f6', '#60a5fa', '#10b981', '#f59e0b'], showLegend: true } }),

    // Row 2b: Top sellers
    w('bar_chart', 'Top Vendedores', { x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
      { type: 'kommo', metrics: ['leads_won', 'pipeline_value'], groupBy: 'vendedor' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'vendedor', yAxis: ['leads_won'], colors: ['#4C75A3'], showGrid: true, showLegend: true } }),

    // Row 3: Daily leads
    w('area_chart', 'Leads por Dia', { x: 0, y: 6, w: 8, h: 4, minW: 4, minH: 3 },
      { type: 'kommo', metrics: ['total_leads', 'leads_won'], groupBy: 'day' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'date', yAxis: ['total_leads', 'leads_won'], colors: ['#4C75A3', '#10b981'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    // Row 3b: Leads by source
    w('pie_chart', 'Leads por Fonte', { x: 8, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'kommo', metrics: ['total_leads'], groupBy: 'fonte' },
      { type: 'pie_chart', chart: { chartType: 'pie', showLegend: true, showLabels: false, colors: ['#4C75A3', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'] } }),

    // Row 4: Leads by status table
    w('table', 'Leads por Status', { x: 0, y: 10, w: 12, h: 5, minW: 6, minH: 3 },
      { type: 'kommo', metrics: ['status', 'count', 'value'], groupBy: 'status_funil' },
      { type: 'table', table: {
        columns: [
          { key: 'status', label: 'Status', sortable: true },
          { key: 'count', label: 'Quantidade', format: 'number', sortable: true },
          { key: 'value', label: 'Valor', format: 'currency', sortable: true },
        ],
        pageSize: 10, sortBy: 'count', sortDirection: 'desc',
      } }),
  ],
};

// =====================================================
// 11. LOCAL BUSINESS — GOOGLE MEU NEGÓCIO
// =====================================================

const LOCAL_BUSINESS_GMB: DashboardTemplate = {
  id: 'local_business_gmb',
  name: 'Negócio Local — Google Meu Negócio',
  description: 'Reviews, rating, buscas, visualizações, chamadas, rotas',
  icon: 'MapPin',
  category: 'gmb',
  theme: { colorScheme: 'light', accentColor: '#4285F4', cardRadius: 'lg', cardShadow: 'sm' },
  defaultFilters: { datePreset: 'last_30d', platforms: ['gmb'] },
  widgets: [
    // Row 1: 6 KPIs
    kpi('Total Reviews', 0, 0, 2, 'total_reviews', 'number', 'blue', 'gmb'),
    kpi('Avg Rating', 2, 0, 2, 'avg_rating', 'number', 'yellow', 'gmb'),
    kpi('Search Views', 4, 0, 2, 'search_views', 'number', 'green', 'gmb'),
    kpi('Map Views', 6, 0, 2, 'map_views', 'number', 'indigo', 'gmb'),
    kpi('Website Clicks', 8, 0, 2, 'website_clicks', 'number', 'purple', 'gmb'),
    kpi('Phone Calls', 10, 0, 2, 'phone_calls', 'number', 'red', 'gmb'),

    // Row 2: Daily search + map views
    w('area_chart', 'Visualizações — Busca & Mapa', { x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
      { type: 'gmb', metrics: ['search_views', 'map_views'], groupBy: 'day' },
      { type: 'area_chart', chart: { chartType: 'area', xAxis: 'date', yAxis: ['search_views', 'map_views'], colors: ['#4285F4', '#34A853'], showGrid: true, showLegend: true, curveType: 'monotone' } }),

    // Row 2b: Actions breakdown
    w('bar_chart', 'Ações do Perfil', { x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { type: 'gmb', metrics: ['website_clicks', 'phone_calls', 'direction_requests'], groupBy: 'action' },
      { type: 'bar_chart', chart: { chartType: 'bar', xAxis: 'action', yAxis: ['value'], colors: ['#4285F4', '#34A853', '#FBBC05'], showGrid: true, showLegend: false } }),

    // Row 3: Recent reviews table
    w('table', 'Reviews Recentes', { x: 0, y: 6, w: 12, h: 5, minW: 6, minH: 3 },
      { type: 'gmb', metrics: ['reviewer', 'rating', 'comment'], groupBy: 'reviewer' },
      { type: 'table', table: {
        columns: [
          { key: 'reviewer', label: 'Reviewer', sortable: true },
          { key: 'rating', label: 'Rating', format: 'number', sortable: true },
          { key: 'comment', label: 'Comentário', sortable: false },
        ],
        pageSize: 10, sortBy: 'rating', sortDirection: 'desc',
      } }),
  ],
};

// =====================================================
// EXPORT ALL
// =====================================================

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  META_ADS_INSIDE_SALES,
  META_ADS_ECOMMERCE,
  GOOGLE_ADS_INSIDE_SALES,
  GOOGLE_ADS_ECOMMERCE,
  CRM_VENDAS_FUNIL,
  ECOMMERCE_FATURAMENTO,
  PROJECT_REPORT,
  SEO_REPORT,
  SOCIAL_MEDIA_REPORT,
  CRM_PIPELINE_KOMMO,
  LOCAL_BUSINESS_GMB,
];

export function getTemplateById(id: string): DashboardTemplate | undefined {
  return DASHBOARD_TEMPLATES.find((t) => t.id === id);
}
