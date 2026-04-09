/**
 * ============================================
 * MOCK PERFORMANCE — AdFlow v4
 * ============================================
 * Dados mock apenas para o layer de Performance (KPIs + charts)
 * da Visão Geral do Cliente. Substituído pelos adapters reais
 * (Google Ads, Meta, Kommo) no próximo sprint.
 *
 * Client metadata vem SEMPRE do ClickUp snapshot via
 * `clickupAdapter.getClientBySlug()`, nunca daqui.
 * ============================================
 */

import type { KPI, ProjectScopeId } from '@/types/metrics'

// =============================================================
// KPIs por scope
// =============================================================

export function getKPIsForScope(scope: ProjectScopeId): KPI[] {
  switch (scope) {
    case 'educacao':
      return [
        {
          key: 'edu.enrollments',
          label: 'Matrículas',
          description: 'Novas matrículas confirmadas no período',
          value: 17,
          previous_value: 13,
          delta_percent: 0.308,
          trend: 'up',
          improvement_direction: 'higher_better',
          unit: 'number',
          goal: 25,
          sparkline: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
          source: 'kommo',
        },
        {
          key: 'edu.cost_per_visit',
          label: 'Custo por visita agendada',
          description: 'Investimento total dividido pelo nº de visitas agendadas',
          value: 67.4,
          previous_value: 84.2,
          delta_percent: -0.2,
          trend: 'down',
          improvement_direction: 'lower_better',
          unit: 'currency',
          currency: 'BRL',
          goal: 70,
          sparkline: [98, 92, 88, 85, 82, 78, 75, 72, 70, 67],
          source: 'blended',
        },
        {
          key: 'edu.enrollment_rate',
          label: 'Taxa visita → matrícula',
          description: 'Percentual de visitas agendadas que viraram matrículas',
          value: 0.34,
          previous_value: 0.28,
          delta_percent: 0.214,
          trend: 'up',
          improvement_direction: 'higher_better',
          unit: 'percent',
          goal: 0.4,
          sparkline: [0.22, 0.24, 0.26, 0.27, 0.28, 0.3, 0.31, 0.33, 0.33, 0.34],
          source: 'kommo',
        },
        {
          key: 'edu.cpl',
          label: 'CPL',
          description: 'Custo por lead (qualquer formulário preenchido)',
          value: 22.91,
          previous_value: 28.5,
          delta_percent: -0.196,
          trend: 'down',
          improvement_direction: 'lower_better',
          unit: 'currency',
          currency: 'BRL',
          goal: 25,
          sparkline: [32, 30, 29, 28, 27, 26, 25, 24, 23, 22.91],
          source: 'blended',
        },
      ]

    case 'lead_gen':
      return [
        {
          key: 'lead.qualified',
          label: 'Leads qualificados',
          value: 84,
          previous_value: 72,
          delta_percent: 0.167,
          trend: 'up',
          improvement_direction: 'higher_better',
          unit: 'number',
          goal: 100,
          sparkline: [48, 52, 58, 62, 66, 70, 74, 78, 82, 84],
          source: 'kommo',
        },
        {
          key: 'lead.cac',
          label: 'CAC',
          value: 128.4,
          previous_value: 156.2,
          delta_percent: -0.178,
          trend: 'down',
          improvement_direction: 'lower_better',
          unit: 'currency',
          currency: 'BRL',
          goal: 150,
          sparkline: [180, 170, 165, 160, 155, 150, 145, 140, 132, 128],
          source: 'blended',
        },
        {
          key: 'lead.sql_rate',
          label: 'Taxa SQL',
          value: 0.42,
          previous_value: 0.36,
          delta_percent: 0.167,
          trend: 'up',
          improvement_direction: 'higher_better',
          unit: 'percent',
          goal: 0.5,
          sparkline: [0.28, 0.3, 0.32, 0.34, 0.36, 0.38, 0.4, 0.41, 0.41, 0.42],
          source: 'kommo',
        },
        {
          key: 'lead.pipeline_value',
          label: 'Pipeline',
          value: 182400,
          previous_value: 152300,
          delta_percent: 0.198,
          trend: 'up',
          improvement_direction: 'higher_better',
          unit: 'currency',
          currency: 'BRL',
          sparkline: [110000, 120000, 130000, 140000, 150000, 155000, 165000, 172000, 178000, 182400],
          source: 'kommo',
        },
      ]

    case 'performance':
    default:
      return [
        {
          key: 'perf.cpl',
          label: 'CPL',
          value: 42.18,
          previous_value: 45.9,
          delta_percent: -0.081,
          trend: 'down',
          improvement_direction: 'lower_better',
          unit: 'currency',
          currency: 'BRL',
          goal: 45,
          sparkline: [52, 48, 50, 47, 46, 44, 43, 42, 41, 42],
          source: 'blended',
        },
        {
          key: 'perf.conversions',
          label: 'Conversões',
          value: 47,
          previous_value: 38,
          delta_percent: 0.237,
          trend: 'up',
          improvement_direction: 'higher_better',
          unit: 'number',
          goal: 60,
          sparkline: [25, 28, 31, 33, 35, 38, 40, 43, 45, 47],
          source: 'blended',
        },
        {
          key: 'perf.roas',
          label: 'ROAS',
          value: 3.2,
          previous_value: 2.8,
          delta_percent: 0.143,
          trend: 'up',
          improvement_direction: 'higher_better',
          unit: 'ratio',
          goal: 3,
          sparkline: [2.1, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9, 3, 3.1, 3.2],
          source: 'blended',
        },
        {
          key: 'perf.impression_share',
          label: 'Impression Share',
          value: 0.64,
          previous_value: 0.66,
          delta_percent: -0.03,
          trend: 'down',
          improvement_direction: 'higher_better',
          unit: 'percent',
          goal: 0.75,
          sparkline: [0.7, 0.68, 0.69, 0.67, 0.66, 0.65, 0.64, 0.64, 0.63, 0.64],
          source: 'google_ads',
        },
      ]
  }
}

// =============================================================
// Charts
// =============================================================

export function getEvolutionSeries(): Array<{
  date: string
  conversoes: number
  cpl: number
  matriculas: number
}> {
  const points: Array<{ date: string; conversoes: number; cpl: number; matriculas: number }> = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayIdx = 29 - i
    points.push({
      date: d.toISOString().slice(0, 10),
      conversoes: Math.round(8 + dayIdx * 0.4 + Math.sin(dayIdx / 3) * 3),
      cpl: Math.round((45 - dayIdx * 0.6 + Math.cos(dayIdx / 4) * 4) * 100) / 100,
      matriculas: Math.round(0.3 + dayIdx * 0.06 + Math.sin(dayIdx / 5) * 0.5),
    })
  }
  return points
}

export function getChannelDistribution(): Array<{
  name: string
  value: number
  color: string
  brand: 'meta_ads' | 'google_ads' | 'kommo'
}> {
  return [
    { name: 'Meta Ads', value: 2400, color: '#0866FF', brand: 'meta_ads' },
    { name: 'Google Ads', value: 1800, color: '#4285F4', brand: 'google_ads' },
    { name: 'Outros', value: 300, color: '#94A3B8', brand: 'kommo' },
  ]
}

export function getFunnelStages(): Array<{
  stage: string
  count: number
  rate?: number
}> {
  return [
    { stage: 'Visitantes do site', count: 4280 },
    { stage: 'Leads (formulário)', count: 196, rate: 0.046 },
    { stage: 'Visitas agendadas', count: 50, rate: 0.255 },
    { stage: 'Visitas realizadas', count: 38, rate: 0.76 },
    { stage: 'Matrículas', count: 17, rate: 0.447 },
  ]
}

// =============================================================
// Highlights da semana
// =============================================================

export interface ClientHighlight {
  id: string
  type: 'insight' | 'opportunity' | 'urgent'
  title: string
  description: string
  cta?: string
  href?: string
  source_label?: string
}

export function getClientHighlights(): ClientHighlight[] {
  return [
    {
      id: 'h1',
      type: 'opportunity',
      title: 'Oportunidade de escala detectada',
      description:
        'Campanha "Matrículas 2026 — Search" está perdendo 34% de impression share por orçamento. Estimativa: +8 matrículas/mês com R$ 600 adicionais.',
      cta: 'Ver análise completa',
      href: '#',
      source_label: 'Google Ads',
    },
    {
      id: 'h2',
      type: 'insight',
      title: 'Nova auditoria SEO disponível',
      description:
        'SEM Rush identificou 34 links internos quebrados (cdn-cgi/l/email-protection) e Core Web Vitals em 0%. Crítico para SEO local.',
      cta: 'Abrir relatório',
      href: '#',
      source_label: 'SEM Rush',
    },
    {
      id: 'h3',
      type: 'urgent',
      title: '2 tarefas atrasadas no ClickUp',
      description:
        'Aprovar criativo "Open House Maio" (atrasado 2 dias) · Revisar landing page de matrículas (vence amanhã).',
      cta: 'Ver no Projeto',
      href: '#',
      source_label: 'ClickUp',
    },
  ]
}
