/**
 * ============================================
 * REPORT BUILDER TYPES
 * ============================================
 * Types for the visual report builder with
 * editable text blocks between metrics.
 * Inspired by Reportei-style block composition.
 */

// =====================================================
// BLOCK TYPES
// =====================================================

export type ReportBlockType =
  | 'cover'
  | 'kpi_row'
  | 'chart'
  | 'table'
  | 'text'
  | 'campaign_detail'
  | 'comparison'
  | 'spacer'
  | 'image';

export interface ReportBlock {
  id: string;
  type: ReportBlockType;
  order: number;
  config: Record<string, unknown>;
  // For text blocks:
  content?: string; // rich text / markdown
  // For KPI blocks:
  metrics?: string[]; // e.g. ['spend', 'impressions', 'clicks', 'ctr']
  // For chart blocks:
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'funnel';
  dataSource?: string; // 'meta_ads' | 'google_ads' | 'ga4'
  // For campaign detail:
  campaignIds?: string[];
  // For comparison:
  compareWith?: 'previous_period' | 'previous_year';
}

// =====================================================
// BUILDER TEMPLATE
// =====================================================

export interface BuilderReportTemplate {
  id: string;
  name: string;
  description: string;
  blocks: ReportBlock[];
  platforms: string[]; // ['meta_ads', 'google_ads', 'ga4']
}

// =====================================================
// BLOCK PALETTE ITEM
// =====================================================

export interface BlockPaletteItem {
  type: ReportBlockType;
  label: string;
  description: string;
  icon: string; // lucide icon name reference
  defaultConfig: Partial<ReportBlock>;
}

// =====================================================
// BUILDER STATE
// =====================================================

export interface ReportBuilderState {
  id?: string;
  name: string;
  description: string;
  blocks: ReportBlock[];
  platforms: string[];
  datePreset: string;
  customDateRange?: { startDate: string; endDate: string };
  selectedBlockId: string | null;
  isDirty: boolean;
}
