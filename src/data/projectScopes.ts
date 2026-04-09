/**
 * ============================================
 * PROJECT SCOPE PRESETS — AdFlow v4
 * ============================================
 * Pre-defined sets of success metrics per project type.
 * A client's "scope" determines which 4 KPIs appear on the
 * hero strip of the Visão Geral page.
 *
 * Gestores can switch scopes on the fly (dropdown), or create
 * "custom" scopes with any 4 metrics from any source.
 * ============================================
 */

import type { ProjectScope } from '@/types/metrics'

export const PROJECT_SCOPES: Record<string, ProjectScope> = {
  performance: {
    id: 'performance',
    name: 'Performance (Tráfego Pago)',
    description: 'Geração de leads e conversões via mídia paga',
    icon: 'TrendingUp',
    success_metrics: [
      {
        key: 'perf.cpl',
        label: 'CPL',
        source: 'blended',
        unit: 'currency',
        improvement_direction: 'lower_better',
      },
      {
        key: 'perf.conversions',
        label: 'Conversões',
        source: 'blended',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'perf.roas',
        label: 'ROAS',
        source: 'blended',
        unit: 'ratio',
        improvement_direction: 'higher_better',
      },
      {
        key: 'perf.impression_share',
        label: 'Impression Share',
        source: 'google_ads',
        unit: 'percent',
        improvement_direction: 'higher_better',
      },
    ],
  },

  branding: {
    id: 'branding',
    name: 'Branding',
    description: 'Alcance, percepção e presença da marca',
    icon: 'Sparkles',
    success_metrics: [
      {
        key: 'brand.reach',
        label: 'Alcance',
        source: 'meta_ads',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'brand.mentions',
        label: 'Menções',
        source: 'manual',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'brand.share_of_voice',
        label: 'Share of Voice',
        source: 'manual',
        unit: 'percent',
        improvement_direction: 'higher_better',
      },
      {
        key: 'brand.search_volume',
        label: 'Buscas pela marca',
        source: 'gsc',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
    ],
  },

  social: {
    id: 'social',
    name: 'Social Media',
    description: 'Crescimento orgânico, engajamento e comunidade',
    icon: 'Users',
    success_metrics: [
      {
        key: 'social.followers_growth',
        label: 'Novos seguidores',
        source: 'meta_ads',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'social.engagement_rate',
        label: 'Taxa de engajamento',
        source: 'meta_ads',
        unit: 'percent',
        improvement_direction: 'higher_better',
      },
      {
        key: 'social.reach_organic',
        label: 'Alcance orgânico',
        source: 'meta_ads',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'social.interactions',
        label: 'Interações',
        source: 'meta_ads',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
    ],
  },

  lead_gen: {
    id: 'lead_gen',
    name: 'Lead Generation (B2B)',
    description: 'Captura, qualificação e nurturing de leads',
    icon: 'Target',
    success_metrics: [
      {
        key: 'lead.qualified',
        label: 'Leads qualificados',
        source: 'kommo',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'lead.cac',
        label: 'CAC',
        source: 'blended',
        unit: 'currency',
        improvement_direction: 'lower_better',
      },
      {
        key: 'lead.sql_rate',
        label: 'Taxa SQL',
        source: 'kommo',
        unit: 'percent',
        improvement_direction: 'higher_better',
      },
      {
        key: 'lead.pipeline_value',
        label: 'Valor em pipeline',
        source: 'kommo',
        unit: 'currency',
        improvement_direction: 'higher_better',
      },
    ],
  },

  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Vendas online, ticket médio e conversão',
    icon: 'ShoppingCart',
    success_metrics: [
      {
        key: 'ecom.revenue',
        label: 'Receita',
        source: 'ecommerce',
        unit: 'currency',
        improvement_direction: 'higher_better',
      },
      {
        key: 'ecom.roas',
        label: 'ROAS',
        source: 'blended',
        unit: 'ratio',
        improvement_direction: 'higher_better',
      },
      {
        key: 'ecom.aov',
        label: 'Ticket médio',
        source: 'ecommerce',
        unit: 'currency',
        improvement_direction: 'higher_better',
      },
      {
        key: 'ecom.conversion_rate',
        label: 'Taxa de conversão',
        source: 'ga4',
        unit: 'percent',
        improvement_direction: 'higher_better',
      },
    ],
  },

  educacao: {
    id: 'educacao',
    name: 'Educação',
    description: 'Captação de matrículas, visitas agendadas e retenção',
    icon: 'GraduationCap',
    success_metrics: [
      {
        key: 'edu.enrollments',
        label: 'Matrículas',
        source: 'kommo',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'edu.cost_per_visit',
        label: 'Custo por visita agendada',
        source: 'blended',
        unit: 'currency',
        improvement_direction: 'lower_better',
      },
      {
        key: 'edu.enrollment_rate',
        label: 'Taxa de conversão visita → matrícula',
        source: 'kommo',
        unit: 'percent',
        improvement_direction: 'higher_better',
      },
      {
        key: 'edu.cpl',
        label: 'CPL',
        source: 'blended',
        unit: 'currency',
        improvement_direction: 'lower_better',
      },
    ],
  },

  hibrido: {
    id: 'hibrido',
    name: 'Híbrido',
    description: 'Mix de performance + branding + social',
    icon: 'Layers',
    success_metrics: [
      {
        key: 'hyb.impressions',
        label: 'Impressões',
        source: 'blended',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'hyb.clicks',
        label: 'Cliques',
        source: 'blended',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'hyb.leads',
        label: 'Leads',
        source: 'blended',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'hyb.cpa',
        label: 'CPA',
        source: 'blended',
        unit: 'currency',
        improvement_direction: 'lower_better',
      },
    ],
  },

  custom: {
    id: 'custom',
    name: 'Personalizado',
    description: 'Gestor define as 4 métricas de sucesso livremente',
    icon: 'Sliders',
    success_metrics: [],
  },
}

/** List ordered for UI dropdowns */
export const PROJECT_SCOPE_LIST: ProjectScope[] = [
  PROJECT_SCOPES.performance,
  PROJECT_SCOPES.branding,
  PROJECT_SCOPES.social,
  PROJECT_SCOPES.lead_gen,
  PROJECT_SCOPES.ecommerce,
  PROJECT_SCOPES.educacao,
  PROJECT_SCOPES.hibrido,
  PROJECT_SCOPES.custom,
]
