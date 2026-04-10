/**
 * ============================================
 * DASHBOARD TEMPLATES — TDD v3.0 nichos
 * ============================================
 * Four canonical templates, one per nicho:
 *
 *   - leads_b2b     — Lead generation (saúde, educação, serviços, B2B)
 *   - ecommerce     — Online retail
 *   - pdv_local     — Local/PDV with GMB
 *   - sales_inside  — Inside sales with CRM (Kommo)
 *
 * Each template is a declarative list of widgets. The WidgetRenderer
 * reads the template + client performance snapshot and composes the
 * canonical components. If a widget's dataPath is missing from the
 * snapshot, the widget renders its empty state gracefully.
 *
 * Colors follow a consistent palette so clients can read the
 * dashboards without needing a legend lookup:
 *
 *   primary   #3b82f6   (blue)       — main metric / investment
 *   success   #10b981   (emerald)    — revenue / won
 *   warning   #f59e0b   (amber)      — attention / mid funnel
 *   danger    #ef4444   (red)        — loss / overdue
 *   accent    #8b5cf6   (violet)     — secondary channel
 *   neutral   #64748b   (slate)      — comparison / previous
 * ============================================
 */

import type { DashboardTemplate } from '@/types/dashboardTemplate'
import type { ProjectScopeId } from '@/types/metrics'

const PALETTE = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  accent: '#8b5cf6',
  neutral: '#64748b',
  meta: '#0866ff',
  google: '#4285f4',
}

// =============================================================
// 1. LEADS / B2B — Saúde, educação, serviços
// =============================================================

export const LEADS_B2B_TEMPLATE: DashboardTemplate = {
  id: 'leads_b2b_default',
  name: 'Leads / B2B — Padrão',
  scope: 'leads_b2b',
  description: 'Captação de leads qualificados com funil CRM integrado.',
  widgets: [
    {
      id: 'kpi_strip',
      type: 'kpi_strip',
      title: 'Resultados do período',
      kpiKeys: ['spend', 'leads', 'cpl', 'qualified_rate', 'pipeline'],
      hero: true,
      colSpan: 12,
    },
    {
      id: 'leads_over_time',
      type: 'area_chart',
      title: 'Leads vs Investimento',
      subtitle: 'Evolução diária no período',
      dataPath: 'timeseries.daily',
      xKey: 'date',
      series: [
        { key: 'leads', label: 'Leads', color: PALETTE.primary },
        { key: 'spend', label: 'Investimento', color: PALETTE.warning },
      ],
      colSpan: 8,
    },
    {
      id: 'funnel',
      type: 'funnel_chart',
      title: 'Funil do cliente',
      subtitle: 'Do anúncio ao contrato',
      dataPath: 'funnel.stages',
      colSpan: 4,
    },
    {
      id: 'channel_split',
      type: 'donut_chart',
      title: 'Distribuição por canal',
      subtitle: 'Investimento por plataforma',
      dataPath: 'channels',
      centerLabel: 'TOTAL',
      centerValuePath: 'blended.spend_formatted',
      colSpan: 4,
    },
    {
      id: 'top_campaigns',
      type: 'table',
      title: 'Campanhas com mais leads',
      subtitle: 'Ordenadas por volume',
      dataPath: 'campaigns.top',
      columns: [
        { key: 'name', label: 'Campanha', align: 'left' },
        { key: 'channel', label: 'Canal', align: 'left', width: '80px' },
        { key: 'spend', label: 'Investido', align: 'right', format: 'currency' },
        { key: 'leads', label: 'Leads', align: 'right', format: 'number' },
        { key: 'cpl', label: 'CPL', align: 'right', format: 'currency' },
      ],
      defaultSortKey: 'leads',
      defaultSortDir: 'desc',
      colSpan: 8,
    },
  ],
}

// =============================================================
// 2. E-COMMERCE
// =============================================================

export const ECOMMERCE_TEMPLATE: DashboardTemplate = {
  id: 'ecommerce_default',
  name: 'E-commerce — Padrão',
  scope: 'ecommerce',
  description: 'Receita, ROAS e performance por produto.',
  widgets: [
    {
      id: 'kpi_strip',
      type: 'kpi_strip',
      title: 'Resultados do período',
      kpiKeys: ['revenue', 'roas', 'spend', 'orders', 'aov'],
      hero: true,
      colSpan: 12,
    },
    {
      id: 'revenue_vs_spend',
      type: 'line_chart',
      title: 'Receita vs Investimento',
      subtitle: 'Evolução diária',
      dataPath: 'timeseries.daily',
      xKey: 'date',
      series: [
        { key: 'revenue', label: 'Receita', color: PALETTE.success },
        { key: 'spend', label: 'Investimento', color: PALETTE.neutral },
      ],
      colSpan: 8,
    },
    {
      id: 'roas_gauge',
      type: 'gauge',
      title: 'ROAS atual',
      subtitle: 'Meta vs realizado',
      valuePath: 'kpis.roas.value',
      goalPath: 'kpis.roas.goal',
      higherIsBetter: true,
      colSpan: 4,
    },
    {
      id: 'roas_by_campaign',
      type: 'bar_chart',
      title: 'ROAS por campanha',
      subtitle: 'Horizontal ranking',
      dataPath: 'campaigns.top',
      categoryKey: 'name',
      series: [{ key: 'roas', label: 'ROAS', color: PALETTE.success }],
      horizontal: true,
      colSpan: 6,
    },
    {
      id: 'channel_split',
      type: 'donut_chart',
      title: 'Receita por canal',
      dataPath: 'channels',
      centerLabel: 'RECEITA',
      centerValuePath: 'blended.revenue_formatted',
      colSpan: 6,
    },
    {
      id: 'top_products',
      type: 'table',
      title: 'Top produtos',
      subtitle: 'Mais vendidos no período',
      dataPath: 'products.top',
      columns: [
        { key: 'name', label: 'Produto', align: 'left' },
        { key: 'revenue', label: 'Receita', align: 'right', format: 'currency' },
        { key: 'quantity', label: 'Qtd', align: 'right', format: 'number' },
        { key: 'aov', label: 'Ticket', align: 'right', format: 'currency' },
      ],
      defaultSortKey: 'revenue',
      defaultSortDir: 'desc',
      colSpan: 12,
    },
  ],
}

// =============================================================
// 3. PDV / LOCAL
// =============================================================

export const PDV_LOCAL_TEMPLATE: DashboardTemplate = {
  id: 'pdv_local_default',
  name: 'PDV / Local — Padrão',
  scope: 'pdv_local',
  description: 'Visitas à loja, rotas GMB e presença local.',
  widgets: [
    {
      id: 'kpi_strip',
      type: 'kpi_strip',
      title: 'Alcance local',
      kpiKeys: ['reach', 'route_clicks', 'calls', 'website_clicks', 'cost_per_visit'],
      hero: true,
      colSpan: 12,
    },
    {
      id: 'gmb_actions',
      type: 'bar_chart',
      title: 'Ações no perfil GMB',
      subtitle: 'Interações por tipo',
      dataPath: 'gmb.actions',
      categoryKey: 'action',
      series: [{ key: 'count', label: 'Interações', color: PALETTE.primary }],
      rainbow: true,
      colSpan: 6,
    },
    {
      id: 'reach_over_time',
      type: 'area_chart',
      title: 'Alcance ao longo do tempo',
      dataPath: 'timeseries.daily',
      xKey: 'date',
      series: [
        { key: 'reach', label: 'Alcance', color: PALETTE.primary },
        { key: 'impressions', label: 'Impressões', color: PALETTE.accent },
      ],
      colSpan: 6,
    },
    {
      id: 'reviews_rating',
      type: 'donut_chart',
      title: 'Distribuição de avaliações',
      subtitle: 'Últimos 30 dias',
      dataPath: 'gmb.rating_distribution',
      centerLabel: 'MÉDIA',
      centerValuePath: 'gmb.avg_rating_formatted',
      colSpan: 4,
    },
    {
      id: 'latest_reviews',
      type: 'table',
      title: 'Últimas avaliações',
      dataPath: 'gmb.latest_reviews',
      columns: [
        { key: 'author', label: 'Cliente', align: 'left' },
        { key: 'rating', label: 'Nota', align: 'center', format: 'number' },
        { key: 'date', label: 'Data', align: 'left' },
        { key: 'comment', label: 'Comentário', align: 'left' },
      ],
      colSpan: 8,
    },
  ],
}

// =============================================================
// 4. SALES / INSIDE
// =============================================================

export const SALES_INSIDE_TEMPLATE: DashboardTemplate = {
  id: 'sales_inside_default',
  name: 'Sales / Inside — Padrão',
  scope: 'sales_inside',
  description: 'Pipeline, performance por vendedor e motivos de perda.',
  widgets: [
    {
      id: 'kpi_strip',
      type: 'kpi_strip',
      title: 'Pipeline',
      kpiKeys: ['opportunities', 'won', 'lost', 'pipeline_value', 'avg_cycle'],
      hero: true,
      colSpan: 12,
    },
    {
      id: 'funnel',
      type: 'funnel_chart',
      title: 'Funil de vendas',
      subtitle: 'Do contato ao contrato',
      dataPath: 'funnel.stages',
      colSpan: 6,
    },
    {
      id: 'leads_by_month',
      type: 'area_chart',
      title: 'Leads por mês',
      subtitle: 'Evolução no ano',
      dataPath: 'timeseries.monthly',
      xKey: 'month',
      series: [
        { key: 'leads', label: 'Leads', color: PALETTE.primary },
        { key: 'won', label: 'Ganhos', color: PALETTE.success },
      ],
      colSpan: 6,
    },
    {
      id: 'by_vendedor',
      type: 'bar_chart',
      title: 'Performance por vendedor',
      subtitle: 'Volume de vendas',
      dataPath: 'sellers',
      categoryKey: 'name',
      series: [
        { key: 'won', label: 'Ganhas', color: PALETTE.success },
        { key: 'open', label: 'Em aberto', color: PALETTE.neutral },
      ],
      colSpan: 8,
    },
    {
      id: 'loss_reasons',
      type: 'bar_chart',
      title: 'Motivos de perda',
      subtitle: 'Ranking horizontal',
      dataPath: 'loss_reasons',
      categoryKey: 'reason',
      series: [{ key: 'count', label: 'Perdas', color: PALETTE.danger }],
      horizontal: true,
      colSpan: 4,
    },
  ],
}

// =============================================================
// LOOKUP
// =============================================================

export const DASHBOARD_TEMPLATES: Record<ProjectScopeId, DashboardTemplate> = {
  leads_b2b: LEADS_B2B_TEMPLATE,
  ecommerce: ECOMMERCE_TEMPLATE,
  pdv_local: PDV_LOCAL_TEMPLATE,
  sales_inside: SALES_INSIDE_TEMPLATE,
  // Custom falls back to the leads_b2b template as a sane default;
  // future work can allow gestores to build custom layouts.
  custom: LEADS_B2B_TEMPLATE,
}

export function getDashboardTemplate(scope: ProjectScopeId): DashboardTemplate {
  return DASHBOARD_TEMPLATES[scope] ?? LEADS_B2B_TEMPLATE
}
