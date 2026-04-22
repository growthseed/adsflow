import type { LibraryBlockDef } from './types'

/**
 * Catálogo fixo da biblioteca de blocos do Report Builder.
 * Cada entry vira um item draggable na coluna esquerda.
 * Handoff V2: 14 tipos fixos + future extensions via registro de plugin.
 */
export const BLOCK_LIBRARY: LibraryBlockDef[] = [
  // KPIs
  { type: 'kpi-single', category: 'KPIs', label: 'KPI único',   iconChar: '#',  defaultProps: { kpi: 'leads' } },
  { type: 'kpi-strip',  category: 'KPIs', label: 'Strip 4 KPIs', iconChar: '⋮⋮', defaultProps: { kpis: ['leads', 'cpl', 'roas', 'spend'] } },
  { type: 'kpi-gauge',  category: 'KPIs', label: 'KPI + gauge', iconChar: '◎',  defaultProps: { kpi: 'roas', goal: 3.5 } },

  // Gráficos
  { type: 'line-chart', category: 'Gráficos', label: 'Linha (tempo)', iconChar: '~', defaultProps: { metric: 'leads', period: '30d' } },
  { type: 'bar-chart',  category: 'Gráficos', label: 'Barras',        iconChar: '▦', defaultProps: { metric: 'conversions', breakdown: 'campaign' } },
  { type: 'donut',      category: 'Gráficos', label: 'Donut',         iconChar: '◯', defaultProps: { metric: 'spend', breakdown: 'platform' } },
  { type: 'funnel',     category: 'Gráficos', label: 'Funil',         iconChar: '▽', defaultProps: { stages: ['impressions', 'clicks', 'leads'] } },
  { type: 'heatmap',    category: 'Gráficos', label: 'Heatmap',       iconChar: '⊞', defaultProps: { metric: 'leads' } },
  { type: 'pacing-chart', category: 'Gráficos', label: 'Pacing',      iconChar: '▲', defaultProps: {} },

  // Comparativos
  { type: 'yoy',     category: 'Comparativos', label: 'YoY',     iconChar: '⇄', defaultProps: { metric: 'leads' } },
  { type: 'cohort',  category: 'Comparativos', label: 'Cohort',  iconChar: '⋮', defaultProps: {} },
  { type: 'ltv-cac', category: 'Comparativos', label: 'LTV / CAC', iconChar: '$', defaultProps: {} },

  // Texto
  { type: 'paragraph-ai', category: 'Texto', label: 'Parágrafo IA', iconChar: '¶', defaultProps: { prompt: 'Resuma o período em 3 frases' } },
  { type: 'highlight',    category: 'Texto', label: 'Destaque',     iconChar: '❝', defaultProps: { text: 'Destaque chave do período.' } },
  { type: 'wins-list',    category: 'Texto', label: 'Lista de wins', iconChar: '✓', defaultProps: {} },

  // Layout
  { type: 'image',      category: 'Layout', label: 'Imagem',          iconChar: '◨', defaultProps: {} },
  { type: 'page-break', category: 'Layout', label: 'Quebra de página', iconChar: '—', defaultProps: {} },
]

export function findBlockDef(type: string): LibraryBlockDef | undefined {
  return BLOCK_LIBRARY.find((b) => b.type === type)
}
