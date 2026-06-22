/**
 * MOAI — Operação atual + Planner Estratégico 90 dias
 *
 * Snapshot real da conta MOAI (act_394842817764673) em 2026-05-21:
 *   - 3 campanhas ACTIVE (1 entregando, 2 zumbis sem delivery há 67d)
 *   - Masterclass Alavanca [19/05] CBO em fase de aprendizado
 *   - 196 campanhas totais na conta (193 PAUSED) — sinal de necessidade
 *     de limpeza estrutural
 *
 * O template também desenha as 7 frentes do planner 90 dias entregue ao
 * cliente em 2026-05-20 (jun-ago/2026): expansão geográfica, calendário
 * de eventos, funil lead-first, pipeline criativo, reestruturação,
 * retargeting e refinamento de targeting.
 *
 * Dados puxados da Meta Graph API v24.0.
 */

import type { PlannerTemplate } from '@/types/plannerTemplates'

const nodes = [
  // ============== HEADER ==============
  {
    id: 'moai-title',
    type: 'advancedText',
    position: { x: 480, y: 20 },
    data: {
      text: 'MOAI — Operação Atual + Planner 90 dias',
      fontSize: 26,
      fontWeight: 'bold',
      color: '#0f172a',
    },
  },
  {
    id: 'moai-subtitle',
    type: 'advancedText',
    position: { x: 480, y: 60 },
    data: {
      text: 'Meta Ads · act_394842817764673 · Vinícius Postai · Snapshot 21/05/2026',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#64748b',
    },
  },

  // ============== BRAND + GOAL ==============
  {
    id: 'moai-brand',
    type: 'brand',
    position: { x: 60, y: 110 },
    data: {
      brand: 'instagram',
      label: 'MOAI',
      subtitle: 'Mentoria · Empresários · Brasília/DF',
      description: 'Masterclass Alavanca · A Alavanca · A Nova Mesa',
    },
  },
  {
    id: 'moai-goal-current',
    type: 'goal',
    position: { x: 960, y: 110 },
    data: {
      label: 'Leads — Mai/26 (parcial)',
      objective: 'Leads via pixel (Masterclass)',
      period: 'Mensal',
      target: null,
      current: 33,
      unit: 'number',
    },
  },

  // ============== DIAGNÓSTICO LATERAL ==============
  {
    id: 'moai-diag-saturacao',
    type: 'postit',
    position: { x: 1340, y: 110 },
    data: {
      label: 'Saturação DF (6m)',
      content:
        'Freq 5,60x · 93% do gasto em Brasília · 265k contas alcançadas (17% do público-alvo). Continuar só em DF = leilão cada vez mais caro.',
      color: 'pink',
    },
  },
  {
    id: 'moai-diag-historico',
    type: 'postit',
    position: { x: 1340, y: 290 },
    data: {
      label: 'Histórico 6m',
      content:
        'R$ 46.394 · 1.033 leads · CPL R$ 44,91 · 45 campanhas com gasto · Melhor mês: Abr (CPL R$ 25, 307 leads). Pior: Jan (CPL R$ 67).',
      color: 'blue',
    },
  },

  // ============== TOFU ==============
  {
    id: 'moai-tofu',
    type: 'postit',
    position: { x: 40, y: 320 },
    data: {
      label: 'ToFu — Captação',
      content:
        'Meta Ads (90% IG). Foco em empresários 25-44 DF. Criativos vencedores: depoimento + manifesto Postai.',
      color: 'blue',
    },
  },

  // Traffic source
  {
    id: 'moai-meta',
    type: 'trafficSource',
    position: { x: 540, y: 340 },
    data: {
      label: 'Meta Ads',
      channel: 'meta',
      platform: 'Facebook/Instagram',
      account: 'act_394842817764673',
    },
  },

  // ============== CAMPANHAS ATIVAS ==============
  {
    id: 'moai-camp-active-label',
    type: 'postit',
    position: { x: 40, y: 500 },
    data: {
      label: 'Campanhas ACTIVE hoje',
      content: '3 ativas — apenas 1 entrega volume. 2 zumbis com R$ 500/dia configurados sem delivery há 67 dias.',
      color: 'amber',
    },
  },

  // Campanha 1 — entregando
  {
    id: 'moai-cp-master19',
    type: 'campaign',
    position: { x: 360, y: 540 },
    data: {
      label: 'PH [19/05] LEADS CBO MASTERCLASS ALAV',
      objective: 'Leads',
      status: 'active',
      budgetType: 'daily',
      budget: 50,
      spent: 584.78,
      impressions: 17235,
      clicks: 118,
      ctr: 0.0093,
      conversions: 7,
      costPerResult: 83.54,
      isActive: true,
    },
  },

  // Campanha 2 — zumbi SYMPLA
  {
    id: 'moai-cp-felipe-sympla',
    type: 'campaign',
    position: { x: 800, y: 540 },
    data: {
      label: '[FELIPE] SYMPLA VENDAS DIRETAS',
      objective: 'Vendas',
      status: 'paused',
      budgetType: 'daily',
      budget: 200,
      spent: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      conversions: 0,
      costPerResult: 0,
      isActive: false,
    },
  },

  // Campanha 3 — zumbi FORM NATIVO
  {
    id: 'moai-cp-felipe-form',
    type: 'campaign',
    position: { x: 1240, y: 540 },
    data: {
      label: '[FELIPE] LEADS FORM NATIVO',
      objective: 'Leads',
      status: 'paused',
      budgetType: 'daily',
      budget: 300,
      spent: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      conversions: 0,
      costPerResult: 0,
      isActive: false,
    },
  },

  // ============== ALERTAS IMEDIATOS ==============
  {
    id: 'moai-alert-zumbis',
    type: 'postit',
    position: { x: 800, y: 720 },
    data: {
      label: '🟡 Decisão pendente',
      content:
        'Status ACTIVE mas zero delivery há 67 dias. R$ 500/dia "ocupando" budget mental. Investigar audiência/criativo ou ARQUIVAR.',
      color: 'amber',
    },
  },

  // ============== ADSETS DA CAMPANHA ATIVA ==============
  {
    id: 'moai-adset-aberto',
    type: 'adSet',
    position: { x: 60, y: 880 },
    data: {
      label: '1 - Aberto BSB [25-55]',
      targeting: 'Advantage aberto · 25-55 · Brasília +40km',
      budget: 'CBO',
      location: 'Brasília',
      spend: 59.86,
      results: 1,
      isActive: true,
    },
  },
  {
    id: 'moai-adset-restaurantes',
    type: 'adSet',
    position: { x: 400, y: 880 },
    data: {
      label: '2 - Restaurantes [25-55] ⭐',
      targeting: 'Interesses Restaurantes/Food Service · 25-55',
      budget: 'CBO',
      location: 'Brasília',
      spend: 361.13,
      results: 5,
      isActive: true,
    },
  },
  {
    id: 'moai-adset-empresarios',
    type: 'adSet',
    position: { x: 740, y: 880 },
    data: {
      label: '3 - Empresários BSB 🔴',
      targeting: 'Interesses Empresários · 25-55 · Brasília',
      budget: 'CBO',
      location: 'Brasília',
      spend: 163.79,
      results: 1,
      isActive: true,
    },
  },
  {
    id: 'moai-alert-empresarios',
    type: 'postit',
    position: { x: 1060, y: 880 },
    data: {
      label: '🔴 PAUSAR HOJE',
      content:
        'Adset Empresários BSB: CPL R$ 163,79 (3.6x média da campanha). Mesmo perfil que a auditoria de abril identificou como problemático. Sangria.',
      color: 'pink',
    },
  },

  // ============== ADS ATIVOS ==============
  {
    id: 'moai-ad-restaurante-winner',
    type: 'ad',
    position: { x: 60, y: 1140 },
    data: {
      label: 'AD001 — Restaurante cheio no fim de semana ⭐',
      format: 'Estático IG/FB',
      headline: 'Top performer (CPL R$ 58, 5 leads em 2d)',
      status: 'enabled',
      isActive: true,
    },
  },
  {
    id: 'moai-ad-vender-indicacao',
    type: 'ad',
    position: { x: 400, y: 1140 },
    data: {
      label: 'AD004 — Você só consegue vender se recebe indicação',
      format: 'Estático IG/FB',
      headline: 'CPL R$ 37 (amostra pequena)',
      status: 'enabled',
      isActive: true,
    },
  },
  {
    id: 'moai-ad-100k',
    type: 'ad',
    position: { x: 740, y: 1140 },
    data: {
      label: 'AD005 — Fatura até R$100k/mês no mesmo lugar',
      format: 'Estático IG/FB',
      headline: 'CPL R$ 141 (rodando no adset problemático)',
      status: 'enabled',
      isActive: true,
    },
  },

  // ============== LP + FUNIL ==============
  {
    id: 'moai-lp',
    type: 'landingPage',
    position: { x: 400, y: 1340 },
    data: {
      label: 'LP — Masterclass Alavanca',
      url: 'https://alavanca.moai.com.br',
    },
  },
  {
    id: 'moai-bofu',
    type: 'postit',
    position: { x: 40, y: 1500 },
    data: {
      label: 'BoFu — Conversão',
      content:
        'Captura no LP → automação Clint → ligação 1:1 → checkout Sympla. Conv Lead→Matrícula precisa ser medida (frente do planner).',
      color: 'green',
    },
  },
  {
    id: 'moai-action-lead',
    type: 'funnelAction',
    position: { x: 280, y: 1540 },
    data: { label: 'Pixel Lead', actionType: 'form_submit' },
  },
  {
    id: 'moai-action-wpp',
    type: 'funnelAction',
    position: { x: 560, y: 1540 },
    data: { label: 'WhatsApp Clint', actionType: 'whatsapp_click' },
  },
  {
    id: 'moai-result',
    type: 'result',
    position: { x: 400, y: 1720 },
    data: {
      label: 'Leads para Clint → Matrícula',
      value: 33,
      description: 'Mai parcial: 33 leads · Taxa Lead→Matrícula a medir',
    },
  },

  // ============== PLANNER 90 DIAS — 7 FRENTES ==============
  {
    id: 'moai-planner-header',
    type: 'advancedText',
    position: { x: 60, y: 1920 },
    data: {
      text: 'Planner 90 dias (PROPOSTA — a validar com cliente)',
      fontSize: 20,
      fontWeight: 'bold',
      color: '#e64a19',
    },
  },
  {
    id: 'moai-planner-sub',
    type: 'advancedText',
    position: { x: 60, y: 1960 },
    data: {
      text: '7 frentes paralelas · sem aumento de budget total · entregue em DOCX 20/05 · aguarda OK do Vinícius',
      fontSize: 13,
      fontWeight: 'normal',
      color: '#64748b',
    },
  },

  // Frente 1: Expansão geográfica
  {
    id: 'moai-f1',
    type: 'postit',
    position: { x: 40, y: 2020 },
    data: {
      label: 'F1 — Expansão geográfica',
      content:
        'Jun: SP teste R$ 100/d · Jul: + Goiânia + Campinas R$ 50/d cada · Ago: Top 5 capitais. Budget separado por praça. Meta: 50% fora-DF até ago.',
      color: 'blue',
    },
  },

  // Frente 2: Eventos
  {
    id: 'moai-f2',
    type: 'postit',
    position: { x: 320, y: 2020 },
    data: {
      label: 'F2 — Calendário de eventos',
      content:
        'Jun: Masterclass Crescimento Travado · Jul: Workshop Decisão · Ago: Imersão A Alavanca presencial + remoto. Always-on R$ 50/d entre eventos.',
      color: 'purple',
    },
  },

  // Frente 3: Funil
  {
    id: 'moai-f3',
    type: 'postit',
    position: { x: 600, y: 2020 },
    data: {
      label: 'F3 — Funil Lead-first',
      content:
        'Descontinuar [VENDAS][SYMPLA] (CPL >R$ 57). Topo: LP captura. Meio: Clint 7d. Fundo: 1:1 + Sympla. Meta LPV→Lead 20%.',
      color: 'amber',
    },
  },

  // Frente 4: Criativo
  {
    id: 'moai-f4',
    type: 'postit',
    position: { x: 880, y: 2020 },
    data: {
      label: 'F4 — Pipeline criativo',
      content:
        '3 depoimentos novos/mês + 1 manifesto Postai + 2 estáticos. Aposentar criativo com freq >2,5 ou CPL >2x média. Foco: depoimento de empresário cliente.',
      color: 'pink',
    },
  },

  // Frente 5: Reestruturação
  {
    id: 'moai-f5',
    type: 'postit',
    position: { x: 40, y: 2220 },
    data: {
      label: 'F5 — Reestruturar conta',
      content:
        'Arquivar 193 PAUSED + 2 zumbis [FELIPE]. 4 campanhas-mestre: [AON][LEADS][BR-DF], [EVENTO][LEADS][LP], [RTG][LEADS][7-30D], [EXPAND][LEADS][BR-SP-CWB].',
      color: 'slate',
    },
  },

  // Frente 6: Retargeting
  {
    id: 'moai-f6',
    type: 'postit',
    position: { x: 320, y: 2220 },
    data: {
      label: 'F6 — Retargeting (zero hoje)',
      content:
        'Custom Audience: LP 30d + IG Eng 60d + Lead 90d. Criativo: urgência/autoridade. R$ 50/d inicial, R$ 80-100/d em janela de evento. Esperado: -30% no CPL.',
      color: 'emerald',
    },
  },

  // Frente 7: Targeting
  {
    id: 'moai-f7',
    type: 'postit',
    position: { x: 600, y: 2220 },
    data: {
      label: 'F7 — Refinar targeting',
      content:
        'Cortar 55+ (CPL R$ 78-89, leakage ~R$ 700/mês). Age 25-54 fixo. Bloquear Audience Network + Threads + Instream Video. Advantage+ Placement.',
      color: 'violet',
    },
  },

  // Metas quantificáveis — PROPOSTA
  {
    id: 'moai-metas',
    type: 'postit',
    position: { x: 880, y: 2220 },
    data: {
      label: 'Metas propostas (a validar)',
      content:
        'CPL: R$ 45→25 · Leads/mês: ~170→400 · Freq: 5,6→<2,8 · Spend fora-DF: 7%→50% · Spend retargeting: 0%→20%. Números do DOCX 20/05, sem aprovação ainda.',
      color: 'amber',
    },
  },

  // ============== AÇÕES IMEDIATAS ==============
  {
    id: 'moai-acoes-header',
    type: 'advancedText',
    position: { x: 60, y: 2440 },
    data: {
      text: '🚨 Ações imediatas (hoje)',
      fontSize: 18,
      fontWeight: 'bold',
      color: '#c0392b',
    },
  },
  {
    id: 'moai-acao-1',
    type: 'postit',
    position: { x: 40, y: 2490 },
    data: {
      label: '1. Pausar adset Empresários BSB',
      content: 'CPL R$ 164 na campanha [19/05]. Sangria, sem fadiga (freq 1,48). Recurso liberado: R$ ~80/dia.',
      color: 'pink',
    },
  },
  {
    id: 'moai-acao-2',
    type: 'postit',
    position: { x: 320, y: 2490 },
    data: {
      label: '2. Decidir zumbis [FELIPE]',
      content: 'Ativar delivery (mudar audiência/criativo/orçamento) OU arquivar. Status ACTIVE polui leitura da conta.',
      color: 'amber',
    },
  },
  {
    id: 'moai-acao-3',
    type: 'postit',
    position: { x: 600, y: 2490 },
    data: {
      label: '3. Avaliar CBO → ABO',
      content: 'Masterclass [13/05] ABO entregou CPL R$ 48. Nova [19/05] CBO entregou R$ 83. CBO em adsets pequenos mata learning cedo.',
      color: 'blue',
    },
  },
  {
    id: 'moai-acao-4',
    type: 'postit',
    position: { x: 880, y: 2490 },
    data: {
      label: '4. Escalar vertical Restaurante',
      content: 'AD001 Restaurante cheio é único com leitura confiável. Produzir 2-3 variações (novo, familiar, delivery) em adset dedicado R$ 80/d.',
      color: 'emerald',
    },
  },
  {
    id: 'moai-acao-5',
    type: 'postit',
    position: { x: 1160, y: 2490 },
    data: {
      label: '5. Setup retargeting',
      content: 'Não pode esperar. Custom audience pronta (15.605 alcance, 232 LPV, 33 leads em mai). Subir antes do próximo evento de jun.',
      color: 'violet',
    },
  },
]

const edges = [
  // Brand → Source
  { id: 'moai-e-brand-meta', source: 'moai-brand', target: 'moai-meta', type: 'smoothstep' },

  // Source → Campaigns
  { id: 'moai-e-meta-cp1', source: 'moai-meta', target: 'moai-cp-master19', type: 'smoothstep' },
  { id: 'moai-e-meta-cp2', source: 'moai-meta', target: 'moai-cp-felipe-sympla', type: 'smoothstep', style: { strokeDasharray: '5 5', stroke: '#94a3b8' } },
  { id: 'moai-e-meta-cp3', source: 'moai-meta', target: 'moai-cp-felipe-form', type: 'smoothstep', style: { strokeDasharray: '5 5', stroke: '#94a3b8' } },

  // Campaign ativa → Adsets
  { id: 'moai-e-cp1-as1', source: 'moai-cp-master19', target: 'moai-adset-aberto', type: 'smoothstep' },
  { id: 'moai-e-cp1-as2', source: 'moai-cp-master19', target: 'moai-adset-restaurantes', type: 'smoothstep' },
  { id: 'moai-e-cp1-as3', source: 'moai-cp-master19', target: 'moai-adset-empresarios', type: 'smoothstep', style: { stroke: '#c0392b', strokeWidth: 2 } },

  // Adsets → Ads
  { id: 'moai-e-as1-ad', source: 'moai-adset-aberto', target: 'moai-ad-vender-indicacao', type: 'smoothstep' },
  { id: 'moai-e-as2-ad', source: 'moai-adset-restaurantes', target: 'moai-ad-restaurante-winner', type: 'smoothstep' },
  { id: 'moai-e-as3-ad', source: 'moai-adset-empresarios', target: 'moai-ad-100k', type: 'smoothstep' },

  // Ads → LP
  { id: 'moai-e-ad1-lp', source: 'moai-ad-restaurante-winner', target: 'moai-lp', type: 'smoothstep' },
  { id: 'moai-e-ad2-lp', source: 'moai-ad-vender-indicacao', target: 'moai-lp', type: 'smoothstep' },
  { id: 'moai-e-ad3-lp', source: 'moai-ad-100k', target: 'moai-lp', type: 'smoothstep' },

  // LP → Actions
  { id: 'moai-e-lp-lead', source: 'moai-lp', target: 'moai-action-lead', type: 'smoothstep' },
  { id: 'moai-e-lp-wpp', source: 'moai-lp', target: 'moai-action-wpp', type: 'smoothstep' },

  // Actions → Result
  { id: 'moai-e-lead-result', source: 'moai-action-lead', target: 'moai-result', type: 'smoothstep' },
  { id: 'moai-e-wpp-result', source: 'moai-action-wpp', target: 'moai-result', type: 'smoothstep' },
]

export const moaiTemplate: PlannerTemplate = {
  id: 'moai-current',
  name: 'MOAI — Operação + Planner 90d',
  description:
    'Mapa real da conta MOAI (Meta Ads): 3 campanhas ACTIVE + adsets + ads de hoje, com diagnóstico, 5 ações imediatas e as 7 frentes do planner 90 dias.',
  long_description:
    'Snapshot da operação MOAI em 21/05/2026. Mostra a campanha PH [19/05] CBO Masterclass ativa com seus 3 adsets reais (Aberto, Restaurantes, Empresários) e os 3 ads top, mais as 2 campanhas zumbis [FELIPE]. Acompanha o diagnóstico de saturação geográfica (freq 5,60x, 93% DF), 5 ações imediatas (pausar adset sangrando, decidir zumbis, avaliar CBO→ABO, escalar vertical Restaurante, setup retargeting) e as 7 frentes do planner estratégico de 90 dias (jun-ago/2026).',
  category: 'strategy',
  vertical: 'b2b',
  icon: '🎯',
  color: 'amber',
  node_count: nodes.length,
  edge_count: edges.length,
  estimated_setup_minutes: 5,
  tags: ['moai', 'vinícius postai', 'mentoria', 'b2b', 'empresários', 'meta ads', 'masterclass', 'cliente real', 'planner 90d'],
  nodes,
  edges,
}
