export type ReportBlockType =
  | 'header'
  | 'kpi-single'
  | 'kpi-strip'
  | 'kpi-gauge'
  | 'line-chart'
  | 'bar-chart'
  | 'donut'
  | 'funnel'
  | 'heatmap'
  | 'yoy'
  | 'cohort'
  | 'ltv-cac'
  | 'pacing-chart'
  | 'paragraph-ai'
  | 'highlight'
  | 'wins-list'
  | 'image'
  | 'page-break'

export interface ReportBlock {
  id: string
  type: ReportBlockType
  props: Record<string, unknown>
}

export interface ReportDocument {
  id: string
  clientId: string | null
  name: string
  status: 'draft' | 'final' | 'scheduled' | 'archived'
  blocks: ReportBlock[]
  config: Record<string, unknown>
  templateId: string | null
  createdBy: string | null
  lastEditedBy: string | null
  lastPdfUrl: string | null
  lastPdfAt: string | null
  updatedAt: string
}

export interface ReportTemplate {
  id: string
  name: string
  subtitle: string | null
  source: 'official' | 'personal'
  category: string | null
  thumbStyle: string | null
  blocks: ReportBlock[]
}

export interface LibraryBlockDef {
  type: ReportBlockType
  label: string
  category: 'KPIs' | 'Gráficos' | 'Comparativos' | 'Texto' | 'Layout'
  iconChar: string
  defaultProps: Record<string, unknown>
}
