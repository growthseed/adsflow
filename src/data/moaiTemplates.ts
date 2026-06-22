/**
 * ============================================
 * MOAI DASHBOARD TEMPLATES — v2.1 Ops 360°
 * ============================================
 * Seis templates específicos pro projeto MOAI (Clube de Líderes do Vinícius
 * Postai). Combinam três fontes:
 *
 *   - Clint CRM (sales): pipeline, funil, origens
 *   - Monday (ops): NPS, Carteiras por mentor, Cronograma de conteúdo,
 *     Inadimplência, Health Score
 *   - Meta Ads: campanhas, criativos, custo por lead
 *
 * Inspirado em Power BI Mídia Hub V4 (8 páginas) com tema cores
 * navy MOAI #1A1F36 substituindo vermelho V4 #DC1223.
 *
 * Detalhes do blueprint em:
 *   MOAI/01_casa/plano-growth/dashboard-looker-blueprint-v2-1.md
 *   MOAI/01_casa/plano-growth/midiahub-extracao-tecnica.md
 * ============================================
 */

import type { DashboardTemplate } from '@/types/dashboardTemplate'

// MOAI brand palette — navy primary, V4 accents (laranja/roxo/amarelo)
const MOAI_PALETTE = {
  primary:   '#1A1F36',  // navy MOAI
  bold:      '#000000',
  accent1:   '#E66C37',  // laranja (V4)
  accent2:   '#6B007B',  // roxo profundo
  accent3:   '#E044A7',  // rosa
  accent4:   '#744EC2',  // roxo médio
  accent5:   '#D9B300',  // amarelo
  accent6:   '#3599B8',  // azul claro
  success:   '#00C896',
  warning:   '#FFB800',
  critical:  '#FF4D4D',
  neutral:   '#6B7280',
}

// =============================================================
// 1. EXECUTIVE PULSE — visão Holding diária pro Vinicius/Duda
// =============================================================

export const MOAI_EXECUTIVE_PULSE: DashboardTemplate = {
  id: 'moai_executive_pulse',
  name: 'MOAI · Executive Pulse',
  scope: 'leads_b2b',
  description: 'Visão Holding 360° — sales + ops + financeiro num glance de 5s.',
  widgets: [
    // Top: 8 cards KPI hero (4 colunas × 2 linhas no desktop)
    {
      id: 'kpi_strip_hero',
      type: 'kpi_strip',
      title: 'Hoje',
      kpiKeys: [
        'receita_mes',
        'qtd_vendas',
        'win_rate',
        'ticket_medio',
        'pipeline_open',
        'deals_emposados',
        'nps_conselhos_medio',
        'inadimplencia_total',
      ],
      hero: true,
      colSpan: 12,
    },
    // Funil clássico 5 estágios
    {
      id: 'funnel_sales',
      type: 'funnel_chart',
      title: 'Funil de vendas',
      subtitle: 'Do lead ao contrato',
      dataPath: 'funnel.stages',
      colSpan: 4,
    },
    // Evolução temporal Leads × Vendas
    {
      id: 'cohort_temporal',
      type: 'line_chart',
      title: 'Cohort mensal',
      subtitle: 'Leads × Vendas × Win Rate',
      dataPath: 'timeseries.monthly',
      xKey: 'mes',
      series: [
        { key: 'leads', label: 'Leads', color: MOAI_PALETTE.primary },
        { key: 'vendas', label: 'Vendas', color: MOAI_PALETTE.success },
        { key: 'win_rate', label: 'Win Rate %', color: MOAI_PALETTE.accent1 },
      ],
      colSpan: 8,
    },
    // Health Score por mentor (barra horizontal)
    {
      id: 'health_por_mentor',
      type: 'bar_chart',
      title: 'Health Score por mentor',
      subtitle: 'Média da carteira',
      dataPath: 'mentores.health_score',
      categoryKey: 'mentor',
      series: [{ key: 'health', label: 'Health Score', color: MOAI_PALETTE.success }],
      horizontal: true,
      colSpan: 6,
    },
    // Top 5 alertas urgentes (table com inadimplentes + reposições + emposados)
    {
      id: 'alertas_urgentes',
      type: 'table',
      title: '🚨 Alertas urgentes',
      subtitle: 'Ações que precisam decisão esta semana',
      dataPath: 'alerts.top5',
      columns: [
        { key: 'tipo', label: 'Tipo', align: 'left', width: '120px' },
        { key: 'titulo', label: 'Item', align: 'left' },
        { key: 'valor', label: 'Valor', align: 'right', format: 'currency' },
        { key: 'responsavel', label: 'Responsável', align: 'left', width: '140px' },
      ],
      colSpan: 6,
    },
  ],
}

// =============================================================
// 2. SALES + CRM — funil profundo Clint
// =============================================================

export const MOAI_SALES_CRM: DashboardTemplate = {
  id: 'moai_sales_crm',
  name: 'MOAI · Sales + CRM',
  scope: 'leads_b2b',
  description: 'Pipeline Clint completo: 4.609 deals, 30 etapas, 19 origens.',
  widgets: [
    {
      id: 'kpi_strip_sales',
      type: 'kpi_strip',
      title: 'Sales — visão geral',
      kpiKeys: ['qtd_leads', 'qtd_vendas', 'win_rate', 'tempo_medio_fechamento', 'pipeline_open'],
      hero: true,
      colSpan: 12,
    },
    {
      id: 'funnel_clint',
      type: 'funnel_chart',
      title: 'Funil completo',
      subtitle: '5 estágios: Lead → Op → Reunião → Proposta → WON',
      dataPath: 'funnel.stages',
      colSpan: 4,
    },
    {
      id: 'evolucao_origem',
      type: 'area_chart',
      title: 'Evolução por origem',
      subtitle: 'Leads mensais',
      dataPath: 'origens.timeseries',
      xKey: 'mes',
      series: [
        { key: 'comercial', label: 'Comercial', color: MOAI_PALETTE.primary },
        { key: 'reativacao', label: 'Reativação', color: MOAI_PALETTE.warning },
        { key: 'funil_alavanca', label: 'Funil Alavanca', color: MOAI_PALETTE.accent1 },
        { key: 'outras', label: 'Outras', color: MOAI_PALETTE.neutral },
      ],
      stacked: true,
      colSpan: 8,
    },
    // Cohort matrix mês entrada × mês fechamento (padrão MidiaHub Tempo)
    {
      id: 'cohort_matrix',
      type: 'cohort_matrix',
      title: 'Cohort — Mês entrada × Mês fechamento',
      subtitle: 'Win Rate % por cohort temporal',
      dataPath: 'cohort.matrix',
      rowKey: 'mes_entrada',
      colKey: 'mes_fechamento',
      valueKey: 'win_rate_pct',
      valueFormat: 'percent',
      colorScale: 'green',
      colSpan: 12,
    },
    // Tabela origens
    {
      id: 'origens_perf',
      type: 'table',
      title: 'Origens — performance',
      subtitle: '19 origens × conv × receita × tempo',
      dataPath: 'origens.list',
      columns: [
        { key: 'origem', label: 'Origem', align: 'left' },
        { key: 'total', label: 'Deals', align: 'right', format: 'number' },
        { key: 'won', label: 'WON', align: 'right', format: 'number' },
        { key: 'conv', label: 'Conv %', align: 'right', format: 'percent' },
        { key: 'receita', label: 'Receita', align: 'right', format: 'currency' },
        { key: 'ticket', label: 'Ticket', align: 'right', format: 'currency' },
        { key: 'tempo', label: 'Tempo (d)', align: 'right', format: 'number' },
      ],
      defaultSortKey: 'receita',
      defaultSortDir: 'desc',
      colSpan: 12,
    },
  ],
}

// =============================================================
// 3. CX & NPS — Saúde dos membros (Monday)
// =============================================================

export const MOAI_CX_NPS: DashboardTemplate = {
  id: 'moai_cx_nps',
  name: 'MOAI · CX & NPS',
  scope: 'leads_b2b',
  description: 'Saúde dos membros = antecedente de churn. NPS 1.128 respostas.',
  widgets: [
    {
      id: 'kpi_cx',
      type: 'kpi_strip',
      title: 'Saúde do cliente',
      kpiKeys: [
        'nps_conselhos_medio',
        'nps_alavanca_medio',
        'reposicoes_mes',
        'health_score_medio',
        'pct_detratores',
      ],
      hero: true,
      colSpan: 12,
    },
    {
      id: 'nps_evolucao',
      type: 'line_chart',
      title: 'NPS — evolução 12 meses',
      subtitle: 'Conselhos × Alavanca',
      dataPath: 'nps.timeseries',
      xKey: 'mes',
      series: [
        { key: 'nps_conselhos', label: 'NPS Conselhos', color: MOAI_PALETTE.primary },
        { key: 'nps_alavanca', label: 'NPS Alavanca', color: MOAI_PALETTE.accent1 },
      ],
      colSpan: 8,
    },
    {
      id: 'nps_distribuicao',
      type: 'donut_chart',
      title: 'NPS — distribuição',
      subtitle: 'Promotor / Neutro / Detrator',
      dataPath: 'nps.distribuicao',
      centerLabel: 'NPS',
      centerValuePath: 'nps.score_formatted',
      colSpan: 4,
    },
    {
      id: 'nps_por_mentor',
      type: 'bar_chart',
      title: 'NPS médio por mentor',
      subtitle: '1.128 respostas Conselhos Estratégicos',
      dataPath: 'nps.por_mentor',
      categoryKey: 'mentor',
      series: [{ key: 'nps_medio', label: 'NPS Médio', color: MOAI_PALETTE.primary }],
      horizontal: true,
      colSpan: 6,
    },
    // Scatter NPS × Reposições (identifica membros doloridos)
    {
      id: 'nps_vs_reposicoes',
      type: 'scatter_chart',
      title: 'NPS × Reposições',
      subtitle: 'Cada ponto = 1 membro. Embaixo-direita = alerta',
      dataPath: 'nps.scatter_membros',
      xKey: 'reposicoes',
      yKey: 'nps_score',
      sizeKey: 'meses_membro',
      tooltipKey: 'membro_nome',
      colorKey: 'mentor',
      xLabel: 'Reposições no ano',
      yLabel: 'NPS médio (0-10)',
      colSpan: 6,
    },
    // Tabela membros com health < 6
    {
      id: 'alertas_health',
      type: 'table',
      title: '🚨 Membros em risco (Health < 6)',
      subtitle: 'Priorizar reunião 1-on-1',
      dataPath: 'cx.membros_em_risco',
      columns: [
        { key: 'membro_nome', label: 'Membro', align: 'left' },
        { key: 'mentor', label: 'Mentor', align: 'left', width: '120px' },
        { key: 'health_score', label: 'Health', align: 'right', format: 'number' },
        { key: 'ultimo_nps', label: 'Último NPS', align: 'right', format: 'number' },
        { key: 'reposicoes', label: 'Reposições', align: 'right', format: 'number' },
        { key: 'ultimo_contato', label: 'Último contato', align: 'right' },
      ],
      defaultSortKey: 'health_score',
      defaultSortDir: 'asc',
      colSpan: 12,
    },
  ],
}

// =============================================================
// 4. MEMBROS & CARTEIRAS — 1.342 distribuídos por mentor
// =============================================================

export const MOAI_MEMBROS_CARTEIRAS: DashboardTemplate = {
  id: 'moai_membros_carteiras',
  name: 'MOAI · Membros & Carteiras',
  scope: 'leads_b2b',
  description:
    'Resolve gap owner_id Clint cruzando emails × 6 Carteiras Monday (Vilker/Vini/Ale/Luma/Yas/Marcos).',
  widgets: [
    {
      id: 'kpi_carteiras',
      type: 'kpi_strip',
      title: 'Total na operação',
      kpiKeys: [
        'membros_ativos_total',
        'membros_high_end',
        'membros_alavanca',
        'receita_carteira_total',
      ],
      hero: true,
      colSpan: 12,
    },
    {
      id: 'carteiras_por_mentor',
      type: 'bar_chart',
      title: 'Carteiras por mentor',
      subtitle: 'Tamanho da carteira × receita média',
      dataPath: 'mentores.ranking',
      categoryKey: 'mentor',
      series: [
        { key: 'qtd_membros', label: 'Membros', color: MOAI_PALETTE.primary },
        { key: 'qtd_won_clint', label: 'Vendas Clint cruzadas', color: MOAI_PALETTE.success },
      ],
      horizontal: true,
      colSpan: 6,
    },
    {
      id: 'mentor_x_estagio',
      type: 'bar_chart',
      title: 'Mentor × Estágio',
      subtitle: 'Onboarding / Ativo / Em Risco / Churn',
      dataPath: 'mentores.por_estagio',
      categoryKey: 'mentor',
      series: [
        { key: 'onboarding', label: 'Onboarding', color: MOAI_PALETTE.accent6 },
        { key: 'ativo', label: 'Ativo', color: MOAI_PALETTE.success },
        { key: 'em_risco', label: 'Em risco', color: MOAI_PALETTE.warning },
        { key: 'churn', label: 'Churn', color: MOAI_PALETTE.critical },
      ],
      colSpan: 6,
    },
    // Pivot hierarchical Mentor → Conselho → Membro
    {
      id: 'pivot_mentor_conselho',
      type: 'pivot_hierarchical',
      title: 'Drill: Mentor → Conselho → Membro',
      subtitle: '1.342 membros distribuídos',
      dataPath: 'mentores.hierarquia',
      hierarchy: ['mentor', 'conselho', 'membro'],
      metrics: [
        { key: 'qtd', label: 'Qtd', format: 'number', align: 'right' },
        { key: 'receita', label: 'Receita', format: 'currency', align: 'right' },
        { key: 'health_medio', label: 'Health', format: 'number', align: 'right' },
        { key: 'nps_medio', label: 'NPS', format: 'number', align: 'right' },
      ],
      defaultExpandDepth: 1,
      colSpan: 12,
    },
    // Jornada do Membro funnel
    {
      id: 'jornada_membro',
      type: 'funnel_chart',
      title: 'Jornada do Membro',
      subtitle: 'Lead → Onboarding → Primeiro Conselho → Ativação → Advocate',
      dataPath: 'membros.jornada',
      colSpan: 12,
    },
  ],
}

// =============================================================
// 5. CONTEÚDO & MARKETING — Monday × Meta Ads
// =============================================================

export const MOAI_CONTEUDO_MKT: DashboardTemplate = {
  id: 'moai_conteudo_mkt',
  name: 'MOAI · Conteúdo & Marketing',
  scope: 'leads_b2b',
  description:
    'Cronograma Comunidade (406) + IG (277) + Redes Sociais (633) + Founder Led + Meta Ads.',
  widgets: [
    {
      id: 'kpi_conteudo',
      type: 'kpi_strip',
      title: 'Conteúdo & Mídia',
      kpiKeys: [
        'posts_publicados_mes',
        'stories_postai_mes',
        'engagement_medio',
        'cpl_meta',
        'leads_meta_mes',
      ],
      hero: true,
      colSpan: 12,
    },
    // Calendar heatmap (densidade de conteúdo por dia)
    {
      id: 'calendar_cronograma',
      type: 'calendar_heatmap',
      title: 'Cronograma — densidade',
      subtitle: 'Últimos 3 meses',
      dataPath: 'conteudo.calendar',
      months: 3,
      colorScale: 'orange',
      itemLabel: 'posts',
      colSpan: 12,
    },
    // Posts por canal (stacked bar)
    {
      id: 'conteudo_por_canal',
      type: 'bar_chart',
      title: 'Conteúdo por canal',
      subtitle: 'Mês corrente',
      dataPath: 'conteudo.por_canal',
      categoryKey: 'canal',
      series: [
        { key: 'planejado', label: 'Planejado', color: MOAI_PALETTE.accent6 },
        { key: 'em_producao', label: 'Em produção', color: MOAI_PALETTE.warning },
        { key: 'aprovado', label: 'Aprovado', color: MOAI_PALETTE.accent1 },
        { key: 'publicado', label: 'Publicado', color: MOAI_PALETTE.success },
      ],
      colSpan: 6,
    },
    // Scatter CTR × CPL Meta (padrão MidiaHub Criativos)
    {
      id: 'meta_cpl_ctr',
      type: 'scatter_chart',
      title: 'Anúncios Meta — CPL × CTR',
      subtitle: 'Cada ponto = 1 anúncio. Esq-cima = winner',
      dataPath: 'meta.criativos',
      xKey: 'ctr',
      yKey: 'cpl',
      sizeKey: 'spend',
      tooltipKey: 'ad_name',
      colorKey: 'campaign_name',
      xLabel: 'CTR %',
      yLabel: 'CPL R$',
      yInverted: true,
      colSpan: 6,
    },
    // Pivot hierarchical Campanha → Conjunto → Anúncio (padrão MidiaHub Meta Ads)
    {
      id: 'meta_hierarquia',
      type: 'pivot_hierarchical',
      title: 'Meta Ads — Campanha → Conjunto → Anúncio',
      subtitle: 'Drilldown completo',
      dataPath: 'meta.hierarquia',
      hierarchy: ['campaign_name', 'adset_name', 'ad_name'],
      metrics: [
        { key: 'spend', label: 'Inv', format: 'currency', align: 'right' },
        { key: 'impressions', label: 'Imp', format: 'number', align: 'right' },
        { key: 'clicks', label: 'Clk', format: 'number', align: 'right' },
        { key: 'leads', label: 'Leads', format: 'number', align: 'right' },
        { key: 'cpl', label: 'CPL', format: 'currency', align: 'right' },
        { key: 'ctr', label: 'CTR', format: 'percent', align: 'right' },
      ],
      defaultExpandDepth: 0,
      colSpan: 12,
    },
  ],
}

// =============================================================
// 6. FINANCEIRO — Inadimplência + Churn + Pagamentos
// =============================================================

export const MOAI_FINANCEIRO: DashboardTemplate = {
  id: 'moai_financeiro',
  name: 'MOAI · Financeiro',
  scope: 'leads_b2b',
  description: 'Inadimplência 2.804 + Churn 162 + Solicitações Pagamento 641.',
  widgets: [
    {
      id: 'kpi_financeiro',
      type: 'kpi_strip',
      title: 'Saúde financeira',
      kpiKeys: [
        'receita_confirmada_mes',
        'inadimplencia_total',
        'churn_taxa',
        'pagamentos_pendentes',
        'congelamentos_ativos',
      ],
      hero: true,
      colSpan: 12,
    },
    {
      id: 'inadimp_evolucao',
      type: 'bar_chart',
      title: 'Inadimplência — evolução',
      subtitle: 'Valor total por mês',
      dataPath: 'financeiro.inadimp_mensal',
      categoryKey: 'mes',
      series: [{ key: 'valor', label: 'Inadimplência R$', color: MOAI_PALETTE.critical }],
      colSpan: 8,
    },
    // Funil Churn (Ativo → Em Risco → Churn confirmado)
    {
      id: 'funnel_churn',
      type: 'funnel_chart',
      title: 'Funil Churn',
      subtitle: 'Ativo → Em Risco → Churn',
      dataPath: 'financeiro.funil_churn',
      colSpan: 4,
    },
    // Waterfall ofensores do mês (padrão MidiaHub Ofensores)
    {
      id: 'waterfall_ofensores',
      type: 'waterfall_chart',
      title: '⛰ Ofensores do mês',
      subtitle: 'Decomposição variação vs mês anterior',
      dataPath: 'financeiro.ofensores',
      categoryKey: 'categoria',
      valueKey: 'delta',
      positiveColor: MOAI_PALETTE.success,
      negativeColor: MOAI_PALETTE.critical,
      totalColor: MOAI_PALETTE.primary,
      colSpan: 12,
    },
    // Top 50 inadimplentes
    {
      id: 'top_inadimplentes',
      type: 'table',
      title: 'Top 50 inadimplentes',
      subtitle: 'Priorizar negociação',
      dataPath: 'financeiro.top_inadimplentes',
      columns: [
        { key: 'membro_nome', label: 'Membro', align: 'left' },
        { key: 'mentor_responsavel', label: 'Mentor', align: 'left', width: '120px' },
        { key: 'valor', label: 'Valor', align: 'right', format: 'currency' },
        { key: 'dias_atraso', label: 'Dias atraso', align: 'right', format: 'number' },
        { key: 'status', label: 'Status', align: 'left', width: '120px' },
        { key: 'vencimento', label: 'Vencimento', align: 'right' },
      ],
      defaultSortKey: 'valor',
      defaultSortDir: 'desc',
      colSpan: 12,
    },
  ],
}

// =============================================================
// EXPORTS
// =============================================================

export const MOAI_TEMPLATES = {
  executive_pulse: MOAI_EXECUTIVE_PULSE,
  sales_crm: MOAI_SALES_CRM,
  cx_nps: MOAI_CX_NPS,
  membros_carteiras: MOAI_MEMBROS_CARTEIRAS,
  conteudo_mkt: MOAI_CONTEUDO_MKT,
  financeiro: MOAI_FINANCEIRO,
} as const

export type MoaiTemplateId = keyof typeof MOAI_TEMPLATES

export function getMoaiTemplate(id: MoaiTemplateId): DashboardTemplate {
  return MOAI_TEMPLATES[id]
}

export function getAllMoaiTemplates(): DashboardTemplate[] {
  return Object.values(MOAI_TEMPLATES)
}
