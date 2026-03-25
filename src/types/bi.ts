// =====================================================
// ADS FLOW - B.I. V4 COMPANY TYPES
// Types for Inside Sales Dashboard
// =====================================================

// =====================================================
// VENDEDOR (Sales Person)
// =====================================================
export interface Vendedor {
  id: string;
  user_id?: string;
  nome: string;
  email?: string;
  telefone?: string;
  departamento: string;
  cargo: string;
  avatar_url?: string;
  meta_mensal: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// LEAD
// =====================================================
export type LeadStatusFunil =
  | 'Sem contato'
  | 'Contato feito'
  | 'Identificação do interesse'
  | 'Aguardando documento'
  | 'Contrato fechado'
  | 'Perdido';

export type LeadFonte =
  | 'Busca Paga/Google'
  | 'Busca Paga/Facebook'
  | 'SMM Organic'
  | 'Indicação'
  | 'Evento'
  | 'Inbound'
  | 'Outbound'
  | 'Parceiro'
  | 'Outro';

export type LeadResultado = 'aberto' | 'vendido' | 'perdido';

export interface Lead {
  id: string;
  user_id: string;
  vendedor_id?: string;
  titulo: string;
  descricao?: string;
  empresa?: string;
  contato_nome?: string;
  contato_email?: string;
  contato_telefone?: string;
  status_funil: LeadStatusFunil;
  fonte?: LeadFonte;
  valor_estimado: number;
  valor_fechado?: number;
  data_primeiro_contato?: string;
  data_fechamento?: string;
  resultado: LeadResultado;
  motivo_perda?: string;
  dias_ciclo?: number;
  created_at: string;
  updated_at: string;
  // Relations
  vendedor?: Vendedor;
}

// =====================================================
// OPORTUNIDADE
// =====================================================
export type OportunidadeStatus =
  | 'Qualificação'
  | 'Proposta Enviada'
  | 'Negociação'
  | 'Fechada Ganha'
  | 'Fechada Perdida';

export type OportunidadeResultado = 'aberta' | 'ganha' | 'perdida';

export interface Oportunidade {
  id: string;
  lead_id?: string;
  user_id: string;
  vendedor_id?: string;
  titulo: string;
  descricao?: string;
  status: OportunidadeStatus;
  valor: number;
  probabilidade: number;
  data_previsao_fechamento?: string;
  data_fechamento?: string;
  resultado: OportunidadeResultado;
  motivo_perda?: string;
  dias_ciclo?: number;
  created_at: string;
  updated_at: string;
  // Relations
  lead?: Lead;
  vendedor?: Vendedor;
}

// =====================================================
// HISTORICO FUNIL
// =====================================================
export interface HistoricoFunil {
  id: string;
  lead_id?: string;
  oportunidade_id?: string;
  etapa_anterior?: string;
  etapa_nova: string;
  usuario_id?: string;
  observacoes?: string;
  data_transicao: string;
}

// =====================================================
// FLOW CONVERSION STATS
// =====================================================
export interface FlowConversionStats {
  id: string;
  flow_id: string;
  user_id: string;
  source_node_id: string;
  target_node_id: string;
  visitors: number;
  conversions: number;
  conversion_rate: number;
  avg_time_seconds?: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// FLOW UTM PARAMS
// =====================================================
export interface FlowUTMParams {
  id: string;
  flow_id: string;
  user_id: string;
  utm_source: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  visits: number;
  unique_visitors: number;
  conversions: number;
  revenue: number;
  cost: number;
  roi: number;
  period_date: string;
  created_at: string;
}

// =====================================================
// KPI SNAPSHOT
// =====================================================
export interface KPISnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  // Lead metrics
  total_leads: number;
  leads_novos: number;
  leads_convertidos: number;
  leads_perdidos: number;
  leads_abertos: number;
  // Opportunity metrics
  total_oportunidades: number;
  oportunidades_ganhas: number;
  oportunidades_perdidas: number;
  oportunidades_abertas: number;
  // Value metrics
  valor_pipeline: number;
  valor_fechado: number;
  ticket_medio: number;
  // Time metrics
  tempo_medio_fechamento_dias?: number;
  // Conversion rates
  taxa_conversao_lead_opp?: number;
  taxa_conversao_opp_venda?: number;
  taxa_perda_geral?: number;
  created_at: string;
}

// =====================================================
// KPI CARD DATA
// =====================================================
export interface KPICardData {
  title: string;
  value: number | string;
  format?: 'number' | 'currency' | 'percentage' | 'days';
  lastMonth?: {
    value: number;
    percentageChange: number;
  };
  lastYear?: {
    value: number;
    percentageChange: number;
  };
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

// =====================================================
// FUNNEL DATA
// =====================================================
export interface FunnelStageData {
  name: string;
  count: number;
  percentage: number;
  previousCount?: number;
  color?: string;
}

export interface FunnelData {
  stages: FunnelStageData[];
  totalEntries: number;
  finalConversions: number;
  overallConversionRate: number;
}

// =====================================================
// TIME SERIES DATA
// =====================================================
export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  name: string;
  data: TimeSeriesPoint[];
  color?: string;
}

// =====================================================
// RESPONSAVEL (Sales Person Stats)
// =====================================================
export interface ResponsavelStats {
  vendedor_id: string;
  vendedor_nome: string;
  leads: number;
  oportunidades: number;
  vendas: number;
  perdas: number;
  abertos: number;
  valor_total: number;
  taxa_conversao: number;
}

// =====================================================
// PERDAS ANALYSIS
// =====================================================
export interface PerdasPorFonte {
  fonte: string;
  count: number;
  percentage: number;
}

export interface PerdasPorEtapa {
  etapa: string;
  count: number;
  percentage: number;
}

// =====================================================
// DATE RANGE
// =====================================================
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// =====================================================
// FILTER STATE
// =====================================================
export interface BIFilterState {
  dateRange: DateRange;
  clientId?: string;
  vendedorId?: string;
  statusFunil?: LeadStatusFunil[];
  fonte?: LeadFonte[];
  resultado?: LeadResultado[];
}

// =====================================================
// DASHBOARD PAGE PROPS
// =====================================================
export type BIPageType =
  | 'funil'
  | 'variacoes'
  | 'tempo'
  | 'perdas'
  | 'ecommerce';

// =====================================================
// HELPERS
// =====================================================
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercentageBI(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function getStatusColor(resultado: LeadResultado): string {
  switch (resultado) {
    case 'vendido':
      return 'green';
    case 'perdido':
      return 'red';
    default:
      return 'blue';
  }
}

export function getFunnelStatusColor(status: LeadStatusFunil): string {
  const colors: Record<LeadStatusFunil, string> = {
    'Sem contato': '#94A3B8',
    'Contato feito': '#3B82F6',
    'Identificação do interesse': '#8B5CF6',
    'Aguardando documento': '#F59E0B',
    'Contrato fechado': '#22C55E',
    'Perdido': '#EF4444',
  };
  return colors[status] || '#6B7280';
}
