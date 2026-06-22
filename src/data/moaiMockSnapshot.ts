/**
 * ============================================
 * MOAI MOCK SNAPSHOT — dados pra prototipar os 6 dashboards
 * ============================================
 * Mock realista baseado no que extraímos em 2026-06-02:
 *
 *   Clint: 10.640 contatos, 4.609 deals, 30,2% WR, R$ 170k receita
 *   Monday: 25 ws, 677 boards, ~50k items, 1.342 membros distribuídos
 *
 * Vai ser substituído pela Edge Function `snapshot-builder-moai`
 * (Fase 5) que monta isso live em Supabase.
 * ============================================
 */

import type { ClientDashboardSnapshot } from '@/types/clientDashboardSnapshot'

export const MOAI_MOCK_SNAPSHOT = {
  slug: 'moai',
  name: 'MOAI · Clube de Líderes',
  scope: 'leads_b2b' as const,
  period: { from: '2026-05-01', to: '2026-05-31', label: 'Maio 2026', days: 31 },
  last_synced_at: new Date('2026-06-02').toISOString(),

  kpis: {
    // Executive Pulse + Sales
    receita_mes:         { key: 'receita_mes', label: 'Receita do mês', value: 170027, previous_value: 145000, delta_percent: 0.172, trend: 'up', unit: 'currency', currency: 'BRL', improvement_direction: 'higher_better' },
    qtd_vendas:          { key: 'qtd_vendas', label: 'Vendas', value: 103, previous_value: 95, delta_percent: 0.084, trend: 'up', unit: 'number', improvement_direction: 'higher_better' },
    win_rate:            { key: 'win_rate', label: 'Win Rate', value: 0.302, previous_value: 0.28, delta_percent: 0.079, trend: 'up', unit: 'percent', improvement_direction: 'higher_better' },
    ticket_medio:        { key: 'ticket_medio', label: 'Ticket médio', value: 2576.17, previous_value: 2480, delta_percent: 0.039, trend: 'up', unit: 'currency', currency: 'BRL', improvement_direction: 'higher_better' },
    pipeline_open:       { key: 'pipeline_open', label: 'Pipeline OPEN', value: 4268, previous_value: 4150, delta_percent: 0.028, trend: 'flat', unit: 'number', improvement_direction: 'higher_better' },
    deals_emposados:     { key: 'deals_emposados', label: 'Empoçados +30d', value: 713, previous_value: 690, delta_percent: 0.033, trend: 'down', unit: 'number', improvement_direction: 'lower_better' },
    qtd_leads:           { key: 'qtd_leads', label: 'Qtd Leads', value: 4609, previous_value: 4300, delta_percent: 0.072, trend: 'up', unit: 'number', improvement_direction: 'higher_better' },
    tempo_medio_fechamento: { key: 'tempo_medio_fechamento', label: 'Tempo médio (d)', value: 41.6, previous_value: 44, delta_percent: -0.055, trend: 'up', unit: 'number', improvement_direction: 'lower_better' },

    // CX & NPS
    nps_conselhos_medio: { key: 'nps_conselhos_medio', label: 'NPS Conselhos', value: 8.7, previous_value: 8.5, delta_percent: 0.024, trend: 'up', unit: 'number', improvement_direction: 'higher_better' },
    nps_alavanca_medio:  { key: 'nps_alavanca_medio', label: 'NPS Alavanca', value: 9.1, previous_value: 9.0, delta_percent: 0.011, trend: 'flat', unit: 'number', improvement_direction: 'higher_better' },
    reposicoes_mes:      { key: 'reposicoes_mes', label: 'Reposições', value: 42, previous_value: 38, delta_percent: 0.105, trend: 'down', unit: 'number', improvement_direction: 'lower_better' },
    health_score_medio:  { key: 'health_score_medio', label: 'Health Score', value: 7.4, previous_value: 7.6, delta_percent: -0.026, trend: 'down', unit: 'number', improvement_direction: 'higher_better' },
    pct_detratores:      { key: 'pct_detratores', label: '% Detratores', value: 0.08, previous_value: 0.06, delta_percent: 0.333, trend: 'down', unit: 'percent', improvement_direction: 'lower_better' },

    // Membros
    membros_ativos_total: { key: 'membros_ativos_total', label: 'Membros ativos', value: 1342, previous_value: 1290, delta_percent: 0.04, trend: 'up', unit: 'number', improvement_direction: 'higher_better' },
    membros_high_end:    { key: 'membros_high_end', label: 'High End', value: 66, previous_value: 62, delta_percent: 0.065, trend: 'up', unit: 'number', improvement_direction: 'higher_better' },
    membros_alavanca:    { key: 'membros_alavanca', label: 'Alavanca', value: 240, previous_value: 220, delta_percent: 0.091, trend: 'up', unit: 'number', improvement_direction: 'higher_better' },
    receita_carteira_total: { key: 'receita_carteira_total', label: 'Receita carteiras', value: 850000, previous_value: 790000, delta_percent: 0.076, trend: 'up', unit: 'currency', currency: 'BRL', improvement_direction: 'higher_better' },

    // Conteúdo & MKT
    posts_publicados_mes: { key: 'posts_publicados_mes', label: 'Posts publicados', value: 87, previous_value: 80, delta_percent: 0.088, trend: 'up', unit: 'number', improvement_direction: 'higher_better' },
    stories_postai_mes:  { key: 'stories_postai_mes', label: 'Stories Postai', value: 45, previous_value: 38, delta_percent: 0.184, trend: 'up', unit: 'number', improvement_direction: 'higher_better' },
    engagement_medio:    { key: 'engagement_medio', label: 'Engajamento', value: 0.067, previous_value: 0.061, delta_percent: 0.098, trend: 'up', unit: 'percent', improvement_direction: 'higher_better' },
    cpl_meta:            { key: 'cpl_meta', label: 'CPL Meta', value: 47.50, previous_value: 52.00, delta_percent: -0.087, trend: 'up', unit: 'currency', currency: 'BRL', improvement_direction: 'lower_better' },
    leads_meta_mes:      { key: 'leads_meta_mes', label: 'Leads Meta', value: 182, previous_value: 165, delta_percent: 0.103, trend: 'up', unit: 'number', improvement_direction: 'higher_better' },

    // Financeiro
    receita_confirmada_mes: { key: 'receita_confirmada_mes', label: 'Receita confirmada', value: 170027, previous_value: 145000, delta_percent: 0.172, trend: 'up', unit: 'currency', currency: 'BRL', improvement_direction: 'higher_better' },
    inadimplencia_total: { key: 'inadimplencia_total', label: 'Inadimplência', value: 187500, previous_value: 165000, delta_percent: 0.136, trend: 'down', unit: 'currency', currency: 'BRL', improvement_direction: 'lower_better' },
    churn_taxa:          { key: 'churn_taxa', label: 'Churn taxa', value: 0.024, previous_value: 0.021, delta_percent: 0.143, trend: 'down', unit: 'percent', improvement_direction: 'lower_better' },
    pagamentos_pendentes:{ key: 'pagamentos_pendentes', label: 'Pagamentos pendentes', value: 28, previous_value: 32, delta_percent: -0.125, trend: 'up', unit: 'number', improvement_direction: 'lower_better' },
    congelamentos_ativos:{ key: 'congelamentos_ativos', label: 'Congelamentos', value: 3, previous_value: 5, delta_percent: -0.4, trend: 'up', unit: 'number', improvement_direction: 'lower_better' },
  },

  funnel: {
    stages: [
      { label: 'Leads', value: 4609, color: '#1A1F36' },
      { label: 'Oportunidades', value: 341, color: '#3599B8' },
      { label: 'Reunião agendada', value: 167, color: '#744EC2' },
      { label: 'Proposta enviada', value: 134, color: '#E66C37' },
      { label: 'Vendas (WON)', value: 103, color: '#00C896' },
    ],
  },

  timeseries: {
    monthly: [
      { mes: 'jan/26', leads: 750, vendas: 16, win_rate: 21 },
      { mes: 'fev/26', leads: 780, vendas: 18, win_rate: 23 },
      { mes: 'mar/26', leads: 820, vendas: 20, win_rate: 24 },
      { mes: 'abr/26', leads: 850, vendas: 24, win_rate: 28 },
      { mes: 'mai/26', leads: 920, vendas: 30, win_rate: 33 },
    ],
  },

  mentores: {
    health_score: [
      { mentor: 'Vilker', health: 8.2 },
      { mentor: 'Vini', health: 8.0 },
      { mentor: 'Ale', health: 7.8 },
      { mentor: 'Luma', health: 7.5 },
      { mentor: 'Yas', health: 7.2 },
      { mentor: 'Marcos', health: 6.9 },
    ],
    ranking: [
      { mentor: 'Vilker', qtd_membros: 304, qtd_won_clint: 38 },
      { mentor: 'Vini',   qtd_membros: 281, qtd_won_clint: 22 },
      { mentor: 'Ale',    qtd_membros: 277, qtd_won_clint: 19 },
      { mentor: 'Luma',   qtd_membros: 222, qtd_won_clint: 14 },
      { mentor: 'Yas',    qtd_membros: 206, qtd_won_clint: 8 },
      { mentor: 'Marcos', qtd_membros: 52,  qtd_won_clint: 2 },
    ],
    por_estagio: [
      { mentor: 'Vilker', onboarding: 12, ativo: 268, em_risco: 18, churn: 6 },
      { mentor: 'Vini',   onboarding: 18, ativo: 240, em_risco: 16, churn: 7 },
      { mentor: 'Ale',    onboarding: 22, ativo: 230, em_risco: 19, churn: 6 },
      { mentor: 'Luma',   onboarding: 14, ativo: 188, em_risco: 14, churn: 6 },
      { mentor: 'Yas',    onboarding: 8,  ativo: 178, em_risco: 14, churn: 6 },
      { mentor: 'Marcos', onboarding: 4,  ativo: 42,  em_risco: 4,  churn: 2 },
    ],
    // Drill hierárquico Mentor → Conselho → Membro
    hierarquia: [
      { mentor: 'Vilker', conselho: 'Conselho A', membro: 'João S.', qtd: 1, receita: 12000, health_medio: 8.5, nps_medio: 9 },
      { mentor: 'Vilker', conselho: 'Conselho A', membro: 'Maria L.', qtd: 1, receita: 9500, health_medio: 7.8, nps_medio: 8 },
      { mentor: 'Vilker', conselho: 'Conselho B', membro: 'Carlos M.', qtd: 1, receita: 15000, health_medio: 8.9, nps_medio: 10 },
      { mentor: 'Vilker', conselho: 'Conselho B', membro: 'Ana P.', qtd: 1, receita: 8800, health_medio: 7.2, nps_medio: 7 },
      { mentor: 'Vini', conselho: 'Conselho C', membro: 'Pedro F.', qtd: 1, receita: 11000, health_medio: 8.1, nps_medio: 9 },
      { mentor: 'Vini', conselho: 'Conselho C', membro: 'Lucia A.', qtd: 1, receita: 13500, health_medio: 8.5, nps_medio: 9 },
      { mentor: 'Ale',  conselho: 'Conselho D', membro: 'Bruno R.', qtd: 1, receita: 9800, health_medio: 7.5, nps_medio: 8 },
      { mentor: 'Ale',  conselho: 'Conselho D', membro: 'Sara T.', qtd: 1, receita: 7200, health_medio: 6.8, nps_medio: 6 },
    ],
  },

  origens: {
    list: [
      { origem: 'Comercial', total: 327, won: 91, conv: 0.282, receita: 170027, ticket: 2576, tempo: 41.6 },
      { origem: 'Funil Alavanca', total: 16, won: 12, conv: 0.75, receita: 0, ticket: 0, tempo: 35 },
      { origem: '[4] Reativação', total: 1483, won: 0, conv: 0, receita: 0, ticket: 0, tempo: 0 },
      { origem: 'Jornada Comunidade', total: 608, won: 0, conv: 0, receita: 0, ticket: 0, tempo: 0 },
      { origem: 'Jornada Conselhos', total: 468, won: 0, conv: 0, receita: 0, ticket: 0, tempo: 0 },
      { origem: 'Parcerias', total: 317, won: 0, conv: 0, receita: 0, ticket: 0, tempo: 0 },
      { origem: '[5] Patrocínio', total: 213, won: 0, conv: 0, receita: 0, ticket: 0, tempo: 0 },
    ],
    timeseries: [
      { mes: 'jan', comercial: 60, reativacao: 200, funil_alavanca: 4, outras: 480 },
      { mes: 'fev', comercial: 62, reativacao: 230, funil_alavanca: 3, outras: 490 },
      { mes: 'mar', comercial: 66, reativacao: 280, funil_alavanca: 3, outras: 470 },
      { mes: 'abr', comercial: 70, reativacao: 320, funil_alavanca: 3, outras: 460 },
      { mes: 'mai', comercial: 69, reativacao: 453, funil_alavanca: 3, outras: 395 },
    ],
  },

  // Cohort matrix mês entrada × mês fechamento
  cohort: {
    matrix: [
      { mes_entrada: '2026-01', mes_fechamento: '2026-01', win_rate_pct: 12 },
      { mes_entrada: '2026-01', mes_fechamento: '2026-02', win_rate_pct: 8 },
      { mes_entrada: '2026-01', mes_fechamento: '2026-03', win_rate_pct: 4 },
      { mes_entrada: '2026-02', mes_fechamento: '2026-02', win_rate_pct: 14 },
      { mes_entrada: '2026-02', mes_fechamento: '2026-03', win_rate_pct: 9 },
      { mes_entrada: '2026-02', mes_fechamento: '2026-04', win_rate_pct: 5 },
      { mes_entrada: '2026-03', mes_fechamento: '2026-03', win_rate_pct: 17 },
      { mes_entrada: '2026-03', mes_fechamento: '2026-04', win_rate_pct: 11 },
      { mes_entrada: '2026-03', mes_fechamento: '2026-05', win_rate_pct: 6 },
      { mes_entrada: '2026-04', mes_fechamento: '2026-04', win_rate_pct: 18 },
      { mes_entrada: '2026-04', mes_fechamento: '2026-05', win_rate_pct: 14 },
      { mes_entrada: '2026-05', mes_fechamento: '2026-05', win_rate_pct: 21 },
    ],
  },

  // NPS
  nps: {
    timeseries: [
      { mes: 'jan/26', nps_conselhos: 8.1, nps_alavanca: 8.9 },
      { mes: 'fev/26', nps_conselhos: 8.3, nps_alavanca: 9.0 },
      { mes: 'mar/26', nps_conselhos: 8.4, nps_alavanca: 9.0 },
      { mes: 'abr/26', nps_conselhos: 8.5, nps_alavanca: 9.0 },
      { mes: 'mai/26', nps_conselhos: 8.7, nps_alavanca: 9.1 },
    ],
    distribuicao: [
      { label: 'Promotores', value: 740, color: '#00C896' },
      { label: 'Neutros', value: 285, color: '#FFB800' },
      { label: 'Detratores', value: 103, color: '#FF4D4D' },
    ],
    score_formatted: '+57',
    por_mentor: [
      { mentor: 'Vilker', nps_medio: 9.0 },
      { mentor: 'Vini', nps_medio: 8.8 },
      { mentor: 'Ale', nps_medio: 8.6 },
      { mentor: 'Luma', nps_medio: 8.5 },
      { mentor: 'Yas', nps_medio: 8.3 },
      { mentor: 'Marcos', nps_medio: 7.9 },
    ],
    scatter_membros: [
      { membro_nome: 'Carlos M.', mentor: 'Vilker', reposicoes: 0, nps_score: 10, meses_membro: 18 },
      { membro_nome: 'Maria L.', mentor: 'Vilker', reposicoes: 1, nps_score: 8, meses_membro: 12 },
      { membro_nome: 'João S.', mentor: 'Vilker', reposicoes: 3, nps_score: 6, meses_membro: 8 },
      { membro_nome: 'Pedro F.', mentor: 'Vini', reposicoes: 0, nps_score: 9, meses_membro: 24 },
      { membro_nome: 'Lucia A.', mentor: 'Vini', reposicoes: 2, nps_score: 7, meses_membro: 14 },
      { membro_nome: 'Bruno R.', mentor: 'Ale', reposicoes: 4, nps_score: 5, meses_membro: 6 },
      { membro_nome: 'Sara T.', mentor: 'Ale', reposicoes: 1, nps_score: 8, meses_membro: 16 },
      { membro_nome: 'Ana P.', mentor: 'Luma', reposicoes: 0, nps_score: 9, meses_membro: 20 },
      { membro_nome: 'Renato Q.', mentor: 'Yas', reposicoes: 5, nps_score: 4, meses_membro: 4 },
    ],
  },

  cx: {
    membros_em_risco: [
      { membro_nome: 'Renato Q.', mentor: 'Yas', health_score: 4.2, ultimo_nps: 4, reposicoes: 5, ultimo_contato: '15 dias' },
      { membro_nome: 'Bruno R.', mentor: 'Ale', health_score: 4.8, ultimo_nps: 5, reposicoes: 4, ultimo_contato: '12 dias' },
      { membro_nome: 'João S.', mentor: 'Vilker', health_score: 5.5, ultimo_nps: 6, reposicoes: 3, ultimo_contato: '8 dias' },
      { membro_nome: 'Carla V.', mentor: 'Luma', health_score: 5.8, ultimo_nps: 7, reposicoes: 2, ultimo_contato: '5 dias' },
    ],
  },

  // Jornada do Membro
  membros: {
    jornada: [
      { label: 'Lead', value: 4609, color: '#1A1F36' },
      { label: 'Onboarding', value: 78, color: '#3599B8' },
      { label: '1º Conselho', value: 65, color: '#744EC2' },
      { label: 'Ativação', value: 54, color: '#E66C37' },
      { label: 'Advocate', value: 38, color: '#00C896' },
    ],
  },

  // Conteúdo Cronograma
  conteudo: {
    calendar: generateCalendarData(),
    por_canal: [
      { canal: 'Instagram', planejado: 12, em_producao: 4, aprovado: 6, publicado: 28 },
      { canal: 'Stories', planejado: 8, em_producao: 2, aprovado: 3, publicado: 45 },
      { canal: 'Founder Led', planejado: 5, em_producao: 3, aprovado: 1, publicado: 14 },
      { canal: 'Newsletter', planejado: 2, em_producao: 1, aprovado: 0, publicado: 4 },
    ],
  },

  // Meta Ads
  meta: {
    criativos: [
      { ad_name: 'AD001 Brasília', campaign_name: 'CP1 Masterclass', ctr: 2.4, cpl: 38, spend: 1200 },
      { ad_name: 'AD002 Brasília', campaign_name: 'CP1 Masterclass', ctr: 3.1, cpl: 32, spend: 1500 },
      { ad_name: 'AD003 Postai', campaign_name: 'CP2 Founder Led', ctr: 4.2, cpl: 28, spend: 2000 },
      { ad_name: 'AD004 High End', campaign_name: 'CP3 High End', ctr: 1.8, cpl: 65, spend: 900 },
      { ad_name: 'AD005 Reativação', campaign_name: 'CP4 Reativação', ctr: 2.0, cpl: 55, spend: 1100 },
      { ad_name: 'AD006 Atenção BSB', campaign_name: 'CP5 Remarketing', ctr: 5.1, cpl: 22, spend: 800 },
    ],
    hierarquia: [
      { campaign_name: 'CP1 Masterclass', adset_name: 'Audience BSB', ad_name: 'AD001 Brasília', spend: 1200, impressions: 28000, clicks: 672, leads: 32, cpl: 37.5, ctr: 0.024 },
      { campaign_name: 'CP1 Masterclass', adset_name: 'Audience BSB', ad_name: 'AD002 Brasília', spend: 1500, impressions: 32000, clicks: 992, leads: 47, cpl: 31.9, ctr: 0.031 },
      { campaign_name: 'CP2 Founder Led', adset_name: 'Lookalike', ad_name: 'AD003 Postai', spend: 2000, impressions: 38000, clicks: 1596, leads: 71, cpl: 28.2, ctr: 0.042 },
      { campaign_name: 'CP3 High End', adset_name: 'CEOs +5M', ad_name: 'AD004 High End', spend: 900, impressions: 15000, clicks: 270, leads: 14, cpl: 64.3, ctr: 0.018 },
      { campaign_name: 'CP4 Reativação', adset_name: 'Engaged 365d', ad_name: 'AD005 Reativação', spend: 1100, impressions: 22000, clicks: 440, leads: 20, cpl: 55.0, ctr: 0.020 },
      { campaign_name: 'CP5 Remarketing', adset_name: 'Site visitors', ad_name: 'AD006 Atenção BSB', spend: 800, impressions: 14000, clicks: 714, leads: 36, cpl: 22.2, ctr: 0.051 },
    ],
  },

  // Financeiro
  financeiro: {
    inadimp_mensal: [
      { mes: 'jan/26', valor: 95000 },
      { mes: 'fev/26', valor: 110000 },
      { mes: 'mar/26', valor: 132000 },
      { mes: 'abr/26', valor: 165000 },
      { mes: 'mai/26', valor: 187500 },
    ],
    funil_churn: [
      { label: 'Ativos', value: 1342, color: '#00C896' },
      { label: 'Em Risco', value: 85, color: '#FFB800' },
      { label: 'Churn confirmado', value: 32, color: '#FF4D4D' },
    ],
    ofensores: [
      { categoria: 'Receita Abr', delta: 145000, isTotal: true },
      { categoria: 'Comercial +', delta: 8500 },
      { categoria: 'Reativação +', delta: 2200 },
      { categoria: 'Funil Alavanca +', delta: 1800 },
      { categoria: 'Inadimplência -', delta: -3500 },
      { categoria: 'Reposições -', delta: -1200 },
      { categoria: 'Churn -', delta: -2800 },
      { categoria: 'Outras +', delta: 20027 },
      { categoria: 'Receita Mai', delta: 170027, isTotal: true },
    ],
    top_inadimplentes: [
      { membro_nome: 'Empresa Alpha', mentor_responsavel: 'Vilker', valor: 15000, dias_atraso: 45, status: 'Negociando', vencimento: '15/04/2026' },
      { membro_nome: 'Empresa Beta', mentor_responsavel: 'Vini', valor: 12000, dias_atraso: 38, status: 'Aberto', vencimento: '22/04/2026' },
      { membro_nome: 'Empresa Gamma', mentor_responsavel: 'Ale', valor: 9500, dias_atraso: 30, status: 'Aberto', vencimento: '30/04/2026' },
      { membro_nome: 'Empresa Delta', mentor_responsavel: 'Luma', valor: 8800, dias_atraso: 25, status: 'Negociando', vencimento: '05/05/2026' },
      { membro_nome: 'Empresa Epsilon', mentor_responsavel: 'Yas', valor: 7500, dias_atraso: 20, status: 'Aberto', vencimento: '10/05/2026' },
    ],
  },

  alerts: {
    top5: [
      { tipo: '🔴 Inadimp', titulo: 'Empresa Alpha — 45d', valor: 15000, responsavel: 'Vilker' },
      { tipo: '🟡 Health', titulo: 'Renato Q. — Health 4.2', valor: 0, responsavel: 'Yas' },
      { tipo: '🟠 Empoçado', titulo: '713 deals OPEN +30d', valor: 132297, responsavel: 'Comercial' },
      { tipo: '🟡 Reposição', titulo: '8 reposições pendentes', valor: 0, responsavel: 'CS' },
      { tipo: '🔴 Churn', titulo: 'Empresa Theta — confirmou', valor: 4500, responsavel: 'Marcos' },
    ],
  },
} as unknown as ClientDashboardSnapshot

function generateCalendarData() {
  const out: Array<{ date: string; count: number; items?: string[] }> = []
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  const cursor = new Date(start)
  while (cursor <= today) {
    const dow = cursor.getDay()
    const count = dow === 0 || dow === 6 ? Math.floor(2) : Math.floor(3 + Math.random() * 5)
    out.push({ date: cursor.toISOString().slice(0, 10), count })
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}
