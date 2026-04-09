/**
 * ============================================
 * PROJECT SCOPE PRESETS — AdFlow v4 (TDD v3.0)
 * ============================================
 * Pre-defined sets of success metrics per nicho/ICP. A client's
 * "scope" determines which 4 KPIs appear on the hero strip of the
 * Visão Geral page, which dashboard template gets loaded in
 * Performance, and which data sources are active.
 *
 * Collapsed from 8 ad-hoc scopes to the 4 canonical nichos of TDD
 * v3.0, plus a free-form `custom` scope for one-off setups:
 *
 *   1. leads_b2b    — Lead generation, CRM-centric. Includes legacy
 *                     "lead_gen", "educacao" and "performance" (when
 *                     no specific vertical info is available).
 *   2. ecommerce    — Online retail. Revenue, ROAS, AOV, conversion.
 *   3. pdv_local    — Local/PDV. GMB routes, calls, store visits.
 *   4. sales_inside — Inside sales. Pipeline, vendedor performance,
 *                     cohort analysis.
 *   5. custom       — Gestor picks metrics freely.
 *
 * The legacy ids (lead_gen, performance, educacao, branding, social,
 * hibrido) are still accepted at resolve time via the
 * `resolveLegacyScopeId` helper so existing DB rows don't break.
 * ============================================
 */

import type { ProjectScope, ProjectScopeId } from '@/types/metrics'
export type { ProjectScopeId }

export const PROJECT_SCOPES: Record<ProjectScopeId, ProjectScope> = {
  leads_b2b: {
    id: 'leads_b2b',
    name: 'Leads / B2B',
    description:
      'Captação, qualificação e nurturing de leads. Educação, saúde, serviços e B2B.',
    icon: 'Target',
    success_metrics: [
      {
        key: 'lead.cpl',
        label: 'CPL',
        source: 'blended',
        unit: 'currency',
        improvement_direction: 'lower_better',
      },
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
    description: 'Vendas online, ticket médio e conversão de loja.',
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

  pdv_local: {
    id: 'pdv_local',
    name: 'PDV / Negócio Local',
    description: 'Visitas à loja, rotas GMB, ligações e presença local.',
    icon: 'MapPin',
    success_metrics: [
      {
        key: 'local.reach',
        label: 'Alcance local',
        source: 'meta_ads',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'local.route_clicks',
        label: 'Cliques de rota',
        source: 'gmb',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'local.calls',
        label: 'Ligações (GMB)',
        source: 'gmb',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'local.cost_per_visit',
        label: 'Custo por visita estimada',
        source: 'blended',
        unit: 'currency',
        improvement_direction: 'lower_better',
      },
    ],
  },

  sales_inside: {
    id: 'sales_inside',
    name: 'Sales / Inside Sales',
    description: 'Pipeline, performance de vendedores e tempo de fechamento.',
    icon: 'Briefcase',
    success_metrics: [
      {
        key: 'sales.opportunities',
        label: 'Oportunidades abertas',
        source: 'kommo',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'sales.closed',
        label: 'Vendas fechadas',
        source: 'kommo',
        unit: 'number',
        improvement_direction: 'higher_better',
      },
      {
        key: 'sales.pipeline_value',
        label: 'Valor do pipeline',
        source: 'kommo',
        unit: 'currency',
        improvement_direction: 'higher_better',
      },
      {
        key: 'sales.avg_cycle_days',
        label: 'Tempo médio de venda',
        source: 'kommo',
        unit: 'number',
        improvement_direction: 'lower_better',
      },
    ],
  },

  custom: {
    id: 'custom',
    name: 'Personalizado',
    description: 'Gestor define as 4 métricas de sucesso livremente.',
    icon: 'Sliders',
    success_metrics: [],
  },
}

/** List ordered for UI dropdowns (leads first — most common). */
export const PROJECT_SCOPE_LIST: ProjectScope[] = [
  PROJECT_SCOPES.leads_b2b,
  PROJECT_SCOPES.ecommerce,
  PROJECT_SCOPES.pdv_local,
  PROJECT_SCOPES.sales_inside,
  PROJECT_SCOPES.custom,
]

// =============================================================
// LEGACY ID MIGRATION
// =============================================================
// Existing DB rows have `active_scope` values from the pre-v3 set:
//   performance, branding, social, lead_gen, ecommerce, educacao,
//   hibrido, custom
//
// This helper maps any legacy id to the closest canonical one so
// pages resolve cleanly without a db migration (we can run one
// later when we're ready to drop the legacy labels entirely).

const LEGACY_SCOPE_ALIASES: Record<string, ProjectScopeId> = {
  performance: 'leads_b2b',
  lead_gen: 'leads_b2b',
  educacao: 'leads_b2b',
  branding: 'leads_b2b',
  social: 'leads_b2b',
  hibrido: 'leads_b2b',
  ecommerce: 'ecommerce',
  local: 'pdv_local',
  pdv: 'pdv_local',
  sales: 'sales_inside',
  custom: 'custom',
}

export function resolveScopeId(raw: string | null | undefined): ProjectScopeId {
  if (!raw) return 'leads_b2b'
  if (raw in PROJECT_SCOPES) return raw as ProjectScopeId
  return LEGACY_SCOPE_ALIASES[raw] ?? 'leads_b2b'
}

export function getScope(raw: string | null | undefined): ProjectScope {
  return PROJECT_SCOPES[resolveScopeId(raw)]
}

/**
 * Infer a default scope from a client's `industry` field. Used during
 * client onboarding / whenever `clients.active_scope` is null. Falls
 * back to `leads_b2b` because that's the most common Efeito Digital
 * contract shape (saúde, educação, serviços, B2B).
 */
export function inferDefaultScope(industry: string | null | undefined): ProjectScopeId {
  if (!industry) return 'leads_b2b'
  const i = industry.toLowerCase()

  if (i.includes('ecomm') || i.includes('varej') || i.includes('loja virtual')) {
    return 'ecommerce'
  }
  if (
    i.includes('restaurante') ||
    i.includes('gastronomia') ||
    i.includes('moda') ||
    i.includes('bar') ||
    i.includes('padaria') ||
    i.includes('pdv')
  ) {
    return 'pdv_local'
  }
  if (
    i.includes('inside sales') ||
    i.includes('saas') ||
    i.includes('consultoria') ||
    i.includes('imobili') ||
    i.includes('advocacia')
  ) {
    return 'sales_inside'
  }
  // Saúde, educação, serviços, B2B → lead_gen family
  return 'leads_b2b'
}
