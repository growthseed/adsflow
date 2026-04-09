/**
 * Lançamento — produto ou campanha sazonal com data fixa.
 */

import type { PlannerTemplate } from '@/types/plannerTemplates'

const nodes = [
  {
    id: 'l-title',
    type: 'advancedText',
    position: { x: 340, y: 30 },
    data: {
      text: '🚀 Plano de Lançamento',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#0f172a',
    },
  },
  // Fase 1 — Pré-lançamento (semana -4 a -2)
  {
    id: 'l-pre-label',
    type: 'postit',
    position: { x: 40, y: 130 },
    data: {
      label: 'Fase 1 — Pré-lançamento',
      content: 'Semanas -4 a -2\nGerar antecipação e lista de espera.',
      color: 'blue',
    },
  },
  {
    id: 'l-aquecimento',
    type: 'campaign',
    position: { x: 300, y: 190 },
    data: { label: 'Aquecimento — Vídeo teaser' },
  },
  {
    id: 'l-lista-espera',
    type: 'funnelAction',
    position: { x: 540, y: 190 },
    data: { label: 'Lista de espera', actionType: 'form_submit' },
  },
  // Fase 2 — Lançamento (semana -1 a +1)
  {
    id: 'l-lanc-label',
    type: 'postit',
    position: { x: 40, y: 330 },
    data: {
      label: 'Fase 2 — Lançamento',
      content: 'Semana -1 a +1\nAbertura oficial da oferta.',
      color: 'purple',
    },
  },
  {
    id: 'l-countdown',
    type: 'campaign',
    position: { x: 300, y: 390 },
    data: { label: 'Countdown — Meta + Google' },
  },
  {
    id: 'l-lp-oferta',
    type: 'landingPage',
    position: { x: 540, y: 390 },
    data: { label: 'LP da Oferta', url: '/lancamento' },
  },
  {
    id: 'l-email-blast',
    type: 'funnelAction',
    position: { x: 780, y: 390 },
    data: { label: 'Email blast (lista)', actionType: 'email_open' },
  },
  // Fase 3 — Pós (semana +2 a +4)
  {
    id: 'l-pos-label',
    type: 'postit',
    position: { x: 40, y: 530 },
    data: {
      label: 'Fase 3 — Pós-lançamento',
      content: 'Semanas +2 a +4\nRecuperação + prova social + upsell.',
      color: 'green',
    },
  },
  {
    id: 'l-retargeting',
    type: 'campaign',
    position: { x: 300, y: 590 },
    data: { label: 'Retargeting abandonos' },
  },
  {
    id: 'l-prova-social',
    type: 'campaign',
    position: { x: 540, y: 590 },
    data: { label: 'Depoimentos de compradores' },
  },
  {
    id: 'l-upsell',
    type: 'funnelAction',
    position: { x: 780, y: 590 },
    data: { label: 'Upsell compradores', actionType: 'purchase' },
  },
  // KPIs
  {
    id: 'l-kpi',
    type: 'postit',
    position: { x: 40, y: 730 },
    data: {
      label: 'Metas do lançamento',
      content:
        '• Leads na lista de espera: ____\n• Taxa conversão LP: ____%\n• ROAS mínimo: ___x\n• CPA máximo: R$ ____\n• Revenue total: R$ ____',
      color: 'yellow',
    },
  },
  // Result
  {
    id: 'l-result',
    type: 'result',
    position: { x: 780, y: 730 },
    data: { label: 'Resultado do lançamento', value: 0 },
  },
]

const edges = [
  { id: 'l-e1', source: 'l-aquecimento', target: 'l-lista-espera', type: 'smoothstep' },
  { id: 'l-e2', source: 'l-lista-espera', target: 'l-countdown', type: 'smoothstep' },
  { id: 'l-e3', source: 'l-countdown', target: 'l-lp-oferta', type: 'smoothstep' },
  { id: 'l-e4', source: 'l-lp-oferta', target: 'l-email-blast', type: 'smoothstep' },
  { id: 'l-e5', source: 'l-email-blast', target: 'l-retargeting', type: 'smoothstep' },
  { id: 'l-e6', source: 'l-retargeting', target: 'l-prova-social', type: 'smoothstep' },
  { id: 'l-e7', source: 'l-prova-social', target: 'l-upsell', type: 'smoothstep' },
  { id: 'l-e8', source: 'l-upsell', target: 'l-result', type: 'smoothstep' },
]

export const launchTemplate: PlannerTemplate = {
  id: 'launch',
  name: 'Lançamento de Produto',
  description: '3 fases: pré, lançamento e pós. Pra campanhas com data fixa.',
  long_description:
    'Use pra Open House, Black Friday, matrícula, lançamento de curso, etc. Estrutura em 3 fases com 12 semanas de duração total (pode comprimir). Inclui slot pra definir KPIs antes de iniciar.',
  category: 'launch',
  vertical: 'any',
  icon: '🚀',
  color: 'violet',
  node_count: nodes.length,
  edge_count: edges.length,
  estimated_setup_minutes: 35,
  tags: ['lançamento', 'sazonal', 'open house', 'black friday', 'produto'],
  nodes,
  edges,
}
