/**
 * REPORTS TYPES — Sistema de Relatórios de Tráfego Pago
 * Efeito Digital — Ads Flow
 *
 * Define tipos para:
 * 1. Relatórios de campanha (Meta Ads, Google Ads)
 * 2. Templates de relatórios
 * 3. Métricas e KPIs de tráfego
 * 4. Filtros e períodos
 * 5. Exportação
 */

// =====================================================
// PLATAFORMAS SUPORTADAS
// =====================================================

export type AdPlatform = 'meta_ads' | 'google_ads';

export type ReportStatus = 'draft' | 'generating' | 'ready' | 'error' | 'archived';

// =====================================================
// TIPOS DE RELATÓRIO
// =====================================================

export type ReportType =
  | 'campaign_overview'      // Visão geral de campanhas
  | 'adset_performance'      // Performance por conjunto de anúncios
  | 'ad_creative'            // Performance por criativo
  | 'audience_insights'      // Insights de audiência
  | 'conversion_funnel'      // Funil de conversão
  | 'budget_analysis'        // Análise de orçamento/gastos
  | 'roi_analysis'           // Análise de ROI/ROAS
  | 'comparative'            // Comparativo entre períodos
  | 'custom';                // Relatório personalizado

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  campaign_overview: 'Visão Geral de Campanhas',
  adset_performance: 'Performance por Conjunto',
  ad_creative: 'Performance por Criativo',
  audience_insights: 'Insights de Audiência',
  conversion_funnel: 'Funil de Conversão',
  budget_analysis: 'Análise de Orçamento',
  roi_analysis: 'Análise de ROI/ROAS',
  comparative: 'Comparativo de Períodos',
  custom: 'Relatório Personalizado',
};

export const REPORT_TYPE_DESCRIPTIONS: Record<ReportType, string> = {
  campaign_overview: 'Resumo de todas as campanhas ativas com métricas principais',
  adset_performance: 'Detalhamento de performance por conjunto de anúncios',
  ad_creative: 'Análise de performance por criativo e formato de anúncio',
  audience_insights: 'Dados demográficos, interesses e comportamento da audiência',
  conversion_funnel: 'Funil completo desde impressão até conversão',
  budget_analysis: 'Distribuição de gastos, orçamento restante e projeções',
  roi_analysis: 'Retorno sobre investimento e retorno sobre gasto em anúncios',
  comparative: 'Comparação de métricas entre dois períodos selecionados',
  custom: 'Monte seu relatório escolhendo as métricas desejadas',
};

// =====================================================
// MÉTRICAS DISPONÍVEIS
// =====================================================

export type MetricKey =
  // Alcance e visibilidade
  | 'impressions'
  | 'reach'
  | 'frequency'
  // Cliques e tráfego
  | 'clicks'
  | 'link_clicks'
  | 'ctr'
  | 'unique_clicks'
  // Custos
  | 'spend'
  | 'cpc'
  | 'cpm'
  | 'cost_per_result'
  // Conversões
  | 'conversions'
  | 'conversion_rate'
  | 'cost_per_conversion'
  | 'conversion_value'
  // Engajamento
  | 'engagement'
  | 'post_reactions'
  | 'post_comments'
  | 'post_shares'
  | 'post_saves'
  // Vídeo
  | 'video_views'
  | 'video_thruplay'
  | 'video_avg_time'
  | 'video_p25'
  | 'video_p50'
  | 'video_p75'
  | 'video_p100'
  // ROI
  | 'roas'
  | 'roi'
  | 'revenue'
  // Leads
  | 'leads'
  | 'cost_per_lead'
  | 'lead_conversion_rate';

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  description: string;
  format: 'number' | 'currency' | 'percentage' | 'decimal' | 'duration';
  category: 'reach' | 'traffic' | 'cost' | 'conversion' | 'engagement' | 'video' | 'roi' | 'leads';
  platforms: AdPlatform[];
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // Alcance
  { key: 'impressions', label: 'Impressões', description: 'Número total de vezes que o anúncio foi exibido', format: 'number', category: 'reach', platforms: ['meta_ads', 'google_ads'] },
  { key: 'reach', label: 'Alcance', description: 'Número de pessoas únicas que viram o anúncio', format: 'number', category: 'reach', platforms: ['meta_ads', 'google_ads'] },
  { key: 'frequency', label: 'Frequência', description: 'Média de vezes que cada pessoa viu o anúncio', format: 'decimal', category: 'reach', platforms: ['meta_ads', 'google_ads'] },

  // Tráfego
  { key: 'clicks', label: 'Cliques', description: 'Total de cliques no anúncio', format: 'number', category: 'traffic', platforms: ['meta_ads', 'google_ads'] },
  { key: 'link_clicks', label: 'Cliques no Link', description: 'Cliques que direcionaram para o destino', format: 'number', category: 'traffic', platforms: ['meta_ads', 'google_ads'] },
  { key: 'ctr', label: 'CTR', description: 'Taxa de cliques (cliques / impressões)', format: 'percentage', category: 'traffic', platforms: ['meta_ads', 'google_ads'] },
  { key: 'unique_clicks', label: 'Cliques Únicos', description: 'Número de pessoas únicas que clicaram', format: 'number', category: 'traffic', platforms: ['meta_ads'] },

  // Custos
  { key: 'spend', label: 'Investimento', description: 'Valor total gasto no período', format: 'currency', category: 'cost', platforms: ['meta_ads', 'google_ads'] },
  { key: 'cpc', label: 'CPC', description: 'Custo por clique', format: 'currency', category: 'cost', platforms: ['meta_ads', 'google_ads'] },
  { key: 'cpm', label: 'CPM', description: 'Custo por 1.000 impressões', format: 'currency', category: 'cost', platforms: ['meta_ads', 'google_ads'] },
  { key: 'cost_per_result', label: 'Custo por Resultado', description: 'Custo médio por resultado otimizado', format: 'currency', category: 'cost', platforms: ['meta_ads', 'google_ads'] },

  // Conversões
  { key: 'conversions', label: 'Conversões', description: 'Total de ações de conversão', format: 'number', category: 'conversion', platforms: ['meta_ads', 'google_ads'] },
  { key: 'conversion_rate', label: 'Taxa de Conversão', description: 'Conversões / cliques', format: 'percentage', category: 'conversion', platforms: ['meta_ads', 'google_ads'] },
  { key: 'cost_per_conversion', label: 'Custo por Conversão', description: 'Custo médio por conversão', format: 'currency', category: 'conversion', platforms: ['meta_ads', 'google_ads'] },
  { key: 'conversion_value', label: 'Valor de Conversão', description: 'Valor total das conversões', format: 'currency', category: 'conversion', platforms: ['meta_ads', 'google_ads'] },

  // Engajamento
  { key: 'engagement', label: 'Engajamento', description: 'Total de interações com o conteúdo', format: 'number', category: 'engagement', platforms: ['meta_ads'] },
  { key: 'post_reactions', label: 'Reações', description: 'Curtidas e reações na publicação', format: 'number', category: 'engagement', platforms: ['meta_ads'] },
  { key: 'post_comments', label: 'Comentários', description: 'Comentários na publicação', format: 'number', category: 'engagement', platforms: ['meta_ads'] },
  { key: 'post_shares', label: 'Compartilhamentos', description: 'Compartilhamentos da publicação', format: 'number', category: 'engagement', platforms: ['meta_ads'] },
  { key: 'post_saves', label: 'Salvamentos', description: 'Vezes que a publicação foi salva', format: 'number', category: 'engagement', platforms: ['meta_ads'] },

  // Vídeo
  { key: 'video_views', label: 'Visualizações de Vídeo', description: 'Total de visualizações do vídeo', format: 'number', category: 'video', platforms: ['meta_ads', 'google_ads'] },
  { key: 'video_thruplay', label: 'ThruPlay', description: 'Visualizações de 15s+ ou completas', format: 'number', category: 'video', platforms: ['meta_ads'] },
  { key: 'video_avg_time', label: 'Tempo Médio de Vídeo', description: 'Tempo médio de visualização', format: 'duration', category: 'video', platforms: ['meta_ads', 'google_ads'] },
  { key: 'video_p25', label: 'Vídeo 25%', description: 'Visualizações que passaram de 25%', format: 'number', category: 'video', platforms: ['meta_ads'] },
  { key: 'video_p50', label: 'Vídeo 50%', description: 'Visualizações que passaram de 50%', format: 'number', category: 'video', platforms: ['meta_ads'] },
  { key: 'video_p75', label: 'Vídeo 75%', description: 'Visualizações que passaram de 75%', format: 'number', category: 'video', platforms: ['meta_ads'] },
  { key: 'video_p100', label: 'Vídeo 100%', description: 'Visualizações completas do vídeo', format: 'number', category: 'video', platforms: ['meta_ads'] },

  // ROI
  { key: 'roas', label: 'ROAS', description: 'Retorno sobre o gasto em anúncios', format: 'decimal', category: 'roi', platforms: ['meta_ads', 'google_ads'] },
  { key: 'roi', label: 'ROI', description: 'Retorno sobre o investimento total', format: 'percentage', category: 'roi', platforms: ['meta_ads', 'google_ads'] },
  { key: 'revenue', label: 'Receita', description: 'Receita total gerada', format: 'currency', category: 'roi', platforms: ['meta_ads', 'google_ads'] },

  // Leads
  { key: 'leads', label: 'Leads', description: 'Total de leads gerados', format: 'number', category: 'leads', platforms: ['meta_ads', 'google_ads'] },
  { key: 'cost_per_lead', label: 'Custo por Lead', description: 'Custo médio por lead', format: 'currency', category: 'leads', platforms: ['meta_ads', 'google_ads'] },
  { key: 'lead_conversion_rate', label: 'Taxa de Conversão de Lead', description: 'Leads / cliques', format: 'percentage', category: 'leads', platforms: ['meta_ads', 'google_ads'] },
];

// =====================================================
// MÉTRICAS POR TIPO DE RELATÓRIO (defaults)
// =====================================================

export const DEFAULT_METRICS_BY_REPORT_TYPE: Record<ReportType, MetricKey[]> = {
  campaign_overview: ['impressions', 'reach', 'clicks', 'ctr', 'spend', 'cpc', 'conversions', 'cost_per_result'],
  adset_performance: ['impressions', 'reach', 'clicks', 'ctr', 'spend', 'cpc', 'cpm', 'conversions', 'cost_per_conversion'],
  ad_creative: ['impressions', 'clicks', 'ctr', 'spend', 'engagement', 'post_reactions', 'post_comments', 'post_shares'],
  audience_insights: ['reach', 'impressions', 'frequency', 'clicks', 'ctr', 'conversions', 'conversion_rate'],
  conversion_funnel: ['impressions', 'clicks', 'link_clicks', 'conversions', 'conversion_rate', 'cost_per_conversion', 'conversion_value'],
  budget_analysis: ['spend', 'cpc', 'cpm', 'cost_per_result', 'cost_per_conversion', 'cost_per_lead'],
  roi_analysis: ['spend', 'revenue', 'roas', 'roi', 'conversions', 'conversion_value', 'cost_per_conversion'],
  comparative: ['impressions', 'reach', 'clicks', 'ctr', 'spend', 'cpc', 'conversions', 'cost_per_result'],
  custom: [],
};

// =====================================================
// PERÍODOS
// =====================================================

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7d'
  | 'last_14d'
  | 'last_30d'
  | 'this_month'
  | 'last_month'
  | 'last_90d'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'lifetime'
  | 'custom';

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  last_7d: 'Últimos 7 dias',
  last_14d: 'Últimos 14 dias',
  last_30d: 'Últimos 30 dias',
  this_month: 'Este mês',
  last_month: 'Mês passado',
  last_90d: 'Últimos 90 dias',
  this_quarter: 'Este trimestre',
  last_quarter: 'Trimestre passado',
  this_year: 'Este ano',
  last_year: 'Ano passado',
  lifetime: 'Todo período',
  custom: 'Período personalizado',
};

// =====================================================
// GRANULARIDADE TEMPORAL
// =====================================================

export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter';

export const TIME_GRANULARITY_LABELS: Record<TimeGranularity, string> = {
  day: 'Diário',
  week: 'Semanal',
  month: 'Mensal',
  quarter: 'Trimestral',
};

// =====================================================
// BREAKDOWNS (Segmentação)
// =====================================================

export type ReportBreakdown =
  | 'none'
  | 'age'
  | 'gender'
  | 'age_gender'
  | 'country'
  | 'region'
  | 'placement'
  | 'platform'
  | 'device'
  | 'campaign'
  | 'adset'
  | 'ad';

export const BREAKDOWN_LABELS: Record<ReportBreakdown, string> = {
  none: 'Sem segmentação',
  age: 'Idade',
  gender: 'Gênero',
  age_gender: 'Idade e Gênero',
  country: 'País',
  region: 'Região/Estado',
  placement: 'Posicionamento',
  platform: 'Plataforma',
  device: 'Dispositivo',
  campaign: 'Campanha',
  adset: 'Conjunto de Anúncios',
  ad: 'Anúncio',
};

// =====================================================
// FILTROS DO RELATÓRIO
// =====================================================

export interface ReportFilters {
  datePreset: DatePreset;
  customDateRange?: {
    startDate: string; // YYYY-MM-DD
    endDate: string;
  };
  comparisonDateRange?: {
    startDate: string;
    endDate: string;
  };
  platforms: AdPlatform[];
  accountIds: string[];
  campaignIds?: string[];
  adsetIds?: string[];
  adIds?: string[];
  campaignStatus?: ('ACTIVE' | 'PAUSED' | 'ARCHIVED')[];
  objectives?: string[];
  granularity: TimeGranularity;
  breakdown: ReportBreakdown;
}

// =====================================================
// RELATÓRIO
// =====================================================

export interface Report {
  id: string;
  workspace_id: string;
  user_id: string;

  // Configuração
  name: string;
  description?: string;
  type: ReportType;
  status: ReportStatus;

  // Dados
  filters: ReportFilters;
  metrics: MetricKey[];
  data?: ReportData;

  // Template
  template_id?: string;
  is_template: boolean;

  // Agendamento
  schedule?: ReportSchedule;

  // Metadados
  last_generated_at?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// DADOS DO RELATÓRIO
// =====================================================

export interface ReportDataRow {
  // Identifiers
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;

  // Breakdown
  breakdown_value?: string;

  // Date
  date?: string;

  // Metrics (valores dinâmicos baseados nas MetricKey selecionadas)
  metrics: Partial<Record<MetricKey, number>>;
}

export interface ReportData {
  rows: ReportDataRow[];
  totals: Partial<Record<MetricKey, number>>;
  period: {
    start: string;
    end: string;
  };
  comparison?: {
    rows: ReportDataRow[];
    totals: Partial<Record<MetricKey, number>>;
    period: {
      start: string;
      end: string;
    };
    changes: Partial<Record<MetricKey, number>>; // % de mudança
  };
  generatedAt: string;
}

// =====================================================
// TEMPLATE DE RELATÓRIO
// =====================================================

export interface ReportTemplate {
  id: string;
  workspace_id?: string; // null = template global
  user_id?: string;

  name: string;
  description: string;
  type: ReportType;
  icon?: string;
  color?: string;

  // Configuração pré-definida
  defaultFilters: Partial<ReportFilters>;
  defaultMetrics: MetricKey[];
  defaultBreakdown: ReportBreakdown;

  // Flags
  is_system: boolean; // template do sistema (não editável)
  is_public: boolean;

  created_at: string;
  updated_at: string;
}

// =====================================================
// AGENDAMENTO DE RELATÓRIO
// =====================================================

export type ScheduleFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface ReportSchedule {
  enabled: boolean;
  frequency: ScheduleFrequency;
  dayOfWeek?: number; // 0-6 (domingo-sábado)
  dayOfMonth?: number; // 1-31
  time: string; // HH:mm
  recipientEmails: string[];
  format: 'pdf' | 'csv' | 'xlsx';
  lastSentAt?: string;
  nextSendAt?: string;
}

// =====================================================
// EXPORTAÇÃO
// =====================================================

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'png';

export interface ExportConfig {
  format: ExportFormat;
  includeCharts: boolean;
  includeLogo: boolean;
  dateInFilename: boolean;
  language: 'pt-BR' | 'en-US';
}

// =====================================================
// ESTADO DO MODAL DE CRIAÇÃO DE RELATÓRIO
// =====================================================

export interface CreateReportState {
  step: 'type' | 'platform' | 'accounts' | 'filters' | 'metrics' | 'preview';
  reportType?: ReportType;
  platforms: AdPlatform[];
  accountIds: string[];
  filters: Partial<ReportFilters>;
  metrics: MetricKey[];
  name: string;
  description: string;
}

// =====================================================
// HELPERS
// =====================================================

export function getMetricsByCategory(category: MetricDefinition['category']): MetricDefinition[] {
  return METRIC_DEFINITIONS.filter(m => m.category === category);
}

export function getMetricsByPlatform(platform: AdPlatform): MetricDefinition[] {
  return METRIC_DEFINITIONS.filter(m => m.platforms.includes(platform));
}

export function getMetricDefinition(key: MetricKey): MetricDefinition | undefined {
  return METRIC_DEFINITIONS.find(m => m.key === key);
}

export function formatMetricValue(value: number, format: MetricDefinition['format']): string {
  switch (format) {
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(value);
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    case 'percentage':
      return `${value.toFixed(2)}%`;
    case 'decimal':
      return value.toFixed(2);
    case 'duration':
      return `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`;
    default:
      return String(value);
  }
}
