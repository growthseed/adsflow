/**
 * ============================================
 * REPORT BUILDER TEMPLATES
 * ============================================
 * Default templates for the visual report builder.
 * Each template is a preset combination of blocks.
 */

import type { BuilderReportTemplate, ReportBlock } from '@/types/reportBuilder';

// Helper to generate unique IDs
let _counter = 0;
function blockId(): string {
  _counter += 1;
  return `tpl-block-${_counter}`;
}

// =====================================================
// TEMPLATE: Relatório Semanal Meta Ads
// =====================================================

const weeklyMetaBlocks: ReportBlock[] = [
  {
    id: blockId(),
    type: 'cover',
    order: 0,
    config: { title: 'Relatório Semanal — Meta Ads', subtitle: 'Análise de desempenho semanal' },
  },
  {
    id: blockId(),
    type: 'kpi_row',
    order: 1,
    config: {},
    metrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions'],
  },
  {
    id: blockId(),
    type: 'text',
    order: 2,
    config: {},
    content: '',
  },
  {
    id: blockId(),
    type: 'chart',
    order: 3,
    config: {},
    chartType: 'line',
    dataSource: 'meta_ads',
  },
  {
    id: blockId(),
    type: 'table',
    order: 4,
    config: {},
  },
  {
    id: blockId(),
    type: 'text',
    order: 5,
    config: {},
    content: '',
  },
];

// =====================================================
// TEMPLATE: Relatório Mensal Completo
// =====================================================

const monthlyFullBlocks: ReportBlock[] = [
  {
    id: blockId(),
    type: 'cover',
    order: 0,
    config: { title: 'Relatório Mensal Completo', subtitle: 'Visão consolidada Meta Ads + Google Ads' },
  },
  {
    id: blockId(),
    type: 'kpi_row',
    order: 1,
    config: { label: 'Meta Ads' },
    metrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions'],
    dataSource: 'meta_ads',
  },
  {
    id: blockId(),
    type: 'text',
    order: 2,
    config: {},
    content: '',
  },
  {
    id: blockId(),
    type: 'chart',
    order: 3,
    config: { label: 'Meta Ads — Evolução diária' },
    chartType: 'area',
    dataSource: 'meta_ads',
  },
  {
    id: blockId(),
    type: 'kpi_row',
    order: 4,
    config: { label: 'Google Ads' },
    metrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions'],
    dataSource: 'google_ads',
  },
  {
    id: blockId(),
    type: 'text',
    order: 5,
    config: {},
    content: '',
  },
  {
    id: blockId(),
    type: 'chart',
    order: 6,
    config: { label: 'Google Ads — Evolução diária' },
    chartType: 'bar',
    dataSource: 'google_ads',
  },
  {
    id: blockId(),
    type: 'table',
    order: 7,
    config: {},
  },
  {
    id: blockId(),
    type: 'text',
    order: 8,
    config: {},
    content: '',
  },
];

// =====================================================
// TEMPLATE: Relatório para Cliente
// =====================================================

const clientReportBlocks: ReportBlock[] = [
  {
    id: blockId(),
    type: 'cover',
    order: 0,
    config: { title: 'Relatório de Performance', subtitle: 'Preparado para o cliente' },
  },
  {
    id: blockId(),
    type: 'text',
    order: 1,
    config: {},
    content: '## Introdução\n\nApresentamos os principais resultados da sua campanha no período analisado.',
  },
  {
    id: blockId(),
    type: 'kpi_row',
    order: 2,
    config: {},
    metrics: ['spend', 'impressions', 'clicks', 'ctr', 'conversions', 'roas'],
  },
  {
    id: blockId(),
    type: 'chart',
    order: 3,
    config: {},
    chartType: 'area',
    dataSource: 'meta_ads',
  },
  {
    id: blockId(),
    type: 'text',
    order: 4,
    config: {},
    content: '## Análise\n\nDescreva aqui os pontos de destaque e oportunidades identificadas.',
  },
  {
    id: blockId(),
    type: 'comparison',
    order: 5,
    config: {},
    compareWith: 'previous_period',
  },
  {
    id: blockId(),
    type: 'text',
    order: 6,
    config: {},
    content: '## Recomendações\n\n- Ponto 1\n- Ponto 2\n- Ponto 3',
  },
];

// =====================================================
// EXPORT
// =====================================================

export const REPORT_BUILDER_TEMPLATES: BuilderReportTemplate[] = [
  {
    id: 'tpl-weekly-meta',
    name: 'Relatório Semanal Meta Ads',
    description: 'Cover + KPIs principais + gráfico de investimento diário + tabela de campanhas + texto de análise',
    blocks: weeklyMetaBlocks,
    platforms: ['meta_ads'],
  },
  {
    id: 'tpl-monthly-full',
    name: 'Relatório Mensal Completo',
    description: 'Visão consolidada de Meta Ads e Google Ads com KPIs, gráficos e tabela',
    blocks: monthlyFullBlocks,
    platforms: ['meta_ads', 'google_ads'],
  },
  {
    id: 'tpl-client-report',
    name: 'Relatório para Cliente',
    description: 'Introdução + KPIs + gráfico + análise + comparativo vs mês anterior + recomendações',
    blocks: clientReportBlocks,
    platforms: ['meta_ads'],
  },
];
