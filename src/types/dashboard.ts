/**
 * ============================================
 * DASHBOARD BUILDER TYPES
 * ============================================
 * Tipos para dashboards configuráveis com
 * grid drag-and-drop e widgets dinâmicos.
 */

import type { DatePreset } from './reports';

// =====================================================
// DATA SOURCES
// =====================================================

export type DataSourceType =
  | 'meta_ads'
  | 'google_ads'
  | 'bi_leads'
  | 'bi_vendedores'
  | 'bi_oportunidades'
  | 'ecommerce'
  | 'manual';

export interface DataSourceConfig {
  type: DataSourceType;
  accountId?: string;
  campaignIds?: string[];
  metrics: string[];
  dateOverride?: {
    preset: DatePreset;
    customRange?: { startDate: string; endDate: string };
  } | null;
  groupBy?: 'day' | 'week' | 'month' | 'campaign' | 'adset' | 'ad' | 'vendedor' | 'fonte' | 'status_funil' | 'product' | 'estado' | 'cupom' | 'motivo_perda' | 'cohort' | 'creative';
}

// =====================================================
// WIDGET TYPES
// =====================================================

export type WidgetType =
  | 'kpi_card'
  | 'line_chart'
  | 'area_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'donut_chart'
  | 'funnel_chart'
  | 'table'
  | 'gauge'
  | 'comparison'
  | 'waterfall_chart'
  | 'treemap'
  | 'scatter_plot'
  | 'heatmap'
  | 'text'
  | 'image';

// =====================================================
// WIDGET CONFIGS (per type)
// =====================================================

export interface KPICardConfig {
  metric: string;
  format: 'number' | 'currency' | 'percentage' | 'decimal';
  showTrend: boolean;
  comparisonPeriod?: 'previous_period' | 'previous_month' | 'previous_year';
  color?: string;
  icon?: string;
}

export interface ChartConfig {
  chartType: 'line' | 'area' | 'bar' | 'horizontal_bar' | 'pie' | 'donut' | 'funnel' | 'waterfall' | 'treemap' | 'scatter' | 'heatmap';
  xAxis?: string;
  yAxis?: string[];
  colors?: string[];
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  curveType?: 'monotone' | 'linear' | 'step';
}

export interface TableConfig {
  columns: Array<{
    key: string;
    label: string;
    format?: 'number' | 'currency' | 'percentage' | 'text';
    sortable?: boolean;
    width?: number;
  }>;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface GaugeConfig {
  metric: string;
  min: number;
  max: number;
  thresholds?: Array<{ value: number; color: string }>;
  format: 'number' | 'currency' | 'percentage';
}

export interface ComparisonConfig {
  metrics: string[];
  period1: { preset: DatePreset; label: string };
  period2: { preset: DatePreset; label: string };
  displayMode: 'side_by_side' | 'overlay' | 'table';
}

export interface TextConfig {
  content: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  alignment?: 'left' | 'center' | 'right';
}

export interface ImageConfig {
  url: string;
  alt?: string;
  fit: 'contain' | 'cover' | 'fill';
}

export type WidgetConfig =
  | { type: 'kpi_card'; kpi: KPICardConfig }
  | { type: 'line_chart' | 'area_chart' | 'bar_chart' | 'pie_chart' | 'donut_chart' | 'funnel_chart' | 'waterfall_chart' | 'treemap' | 'scatter_plot' | 'heatmap'; chart: ChartConfig }
  | { type: 'table'; table: TableConfig }
  | { type: 'gauge'; gauge: GaugeConfig }
  | { type: 'comparison'; comparison: ComparisonConfig }
  | { type: 'text'; text: TextConfig }
  | { type: 'image'; image: ImageConfig };

// =====================================================
// GRID POSITION
// =====================================================

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

// =====================================================
// WIDGET (full row)
// =====================================================

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: WidgetType;
  title: string;
  data_source: DataSourceConfig;
  config: WidgetConfig;
  position: WidgetPosition;
  created_at: string;
}

// =====================================================
// DASHBOARD THEME
// =====================================================

export interface DashboardTheme {
  colorScheme: 'light' | 'dark';
  accentColor: string;
  fontFamily?: string;
  cardRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  cardShadow?: 'none' | 'sm' | 'md' | 'lg';
}

// =====================================================
// GLOBAL FILTERS
// =====================================================

export interface DashboardGlobalFilters {
  datePreset: DatePreset;
  customRange?: { startDate: string; endDate: string };
  platforms?: string[];
  accountIds?: string[];
  campaignIds?: string[];
  clientId?: string;
}

// =====================================================
// DASHBOARD (full row + widgets)
// =====================================================

export interface Dashboard {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  template_id: string | null;
  layout: Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>>;
  theme: DashboardTheme;
  global_filters: DashboardGlobalFilters;
  is_template: boolean;
  is_public: boolean;
  share_token: string | null;
  widgets: DashboardWidget[];
  created_at: string;
  updated_at: string;
}

export type DashboardInsert = Omit<Dashboard, 'id' | 'widgets' | 'created_at' | 'updated_at'>;
export type DashboardUpdate = Partial<Omit<Dashboard, 'id' | 'user_id' | 'widgets' | 'created_at'>>;

// =====================================================
// DEFAULT WIDGET SIZES (12-col grid)
// =====================================================

export const WIDGET_DEFAULT_SIZES: Record<WidgetType, WidgetPosition> = {
  kpi_card:        { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  line_chart:      { x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  area_chart:      { x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  bar_chart:       { x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  pie_chart:       { x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
  donut_chart:     { x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
  funnel_chart:    { x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
  table:           { x: 0, y: 0, w: 12, h: 5, minW: 4, minH: 3 },
  gauge:           { x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
  comparison:      { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
  waterfall_chart: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
  treemap:         { x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  scatter_plot:    { x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  heatmap:         { x: 0, y: 0, w: 8, h: 5, minW: 4, minH: 3 },
  text:            { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1 },
  image:           { x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
};

// =====================================================
// WIDGET TYPE CATALOG (for UI palette)
// =====================================================

export interface WidgetTypeMeta {
  type: WidgetType;
  label: string;
  icon: string;
  category: 'kpi' | 'chart' | 'data' | 'layout';
  description: string;
}

export const WIDGET_TYPE_CATALOG: WidgetTypeMeta[] = [
  { type: 'kpi_card',        label: 'KPI Card',           icon: 'TrendingUp',       category: 'kpi',    description: 'Métrica única com tendência' },
  { type: 'line_chart',      label: 'Gráfico de Linha',   icon: 'LineChart',         category: 'chart',  description: 'Série temporal com linhas' },
  { type: 'area_chart',      label: 'Gráfico de Área',    icon: 'AreaChart',         category: 'chart',  description: 'Série temporal preenchida' },
  { type: 'bar_chart',       label: 'Gráfico de Barras',  icon: 'BarChart3',         category: 'chart',  description: 'Barras verticais ou horizontais' },
  { type: 'pie_chart',       label: 'Pizza',              icon: 'PieChart',          category: 'chart',  description: 'Distribuição proporcional' },
  { type: 'donut_chart',     label: 'Donut',              icon: 'PieChart',          category: 'chart',  description: 'Donut com métrica central' },
  { type: 'funnel_chart',    label: 'Funil',              icon: 'Filter',            category: 'chart',  description: 'Funil de conversão' },
  { type: 'table',           label: 'Tabela',             icon: 'Table2',            category: 'data',   description: 'Tabela com ordenação' },
  { type: 'gauge',           label: 'Gauge',              icon: 'Gauge',             category: 'kpi',    description: 'Indicador radial' },
  { type: 'comparison',      label: 'Comparativo',        icon: 'ArrowLeftRight',    category: 'chart',  description: 'Período vs período' },
  { type: 'waterfall_chart', label: 'Waterfall',          icon: 'BarChart3',         category: 'chart',  description: 'Variação acumulada' },
  { type: 'treemap',         label: 'Treemap',            icon: 'LayoutGrid',        category: 'chart',  description: 'Mapa proporcional' },
  { type: 'scatter_plot',    label: 'Dispersão',          icon: 'ScatterChart',      category: 'chart',  description: 'Correlação entre métricas' },
  { type: 'heatmap',         label: 'Mapa de Calor',      icon: 'Grid3X3',           category: 'chart',  description: 'Intensidade por célula' },
  { type: 'text',            label: 'Texto',              icon: 'Type',              category: 'layout', description: 'Bloco de texto livre' },
  { type: 'image',           label: 'Imagem/Logo',        icon: 'Image',             category: 'layout', description: 'Logo ou imagem estática' },
];

// =====================================================
// TEMPLATE TYPE
// =====================================================

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'meta_ads' | 'google_ads' | 'crm' | 'ecommerce';
  widgets: Array<Omit<DashboardWidget, 'id' | 'dashboard_id' | 'created_at'>>;
  theme: DashboardTheme;
  defaultFilters: DashboardGlobalFilters;
}
