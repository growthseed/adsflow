/**
 * Funil de Vendas B2C — template clássico ToFu → MoFu → BoFu.
 * Genérico o suficiente pra adaptar em qualquer vertical de captação.
 */

import type { PlannerTemplate } from '@/types/plannerTemplates'

const nodes = [
  {
    id: 'f-title',
    type: 'advancedText',
    position: { x: 380, y: 30 },
    data: {
      text: '🎯 Funil de Vendas',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#0f172a',
    },
  },
  // ToFu — Awareness
  {
    id: 'f-tofu-label',
    type: 'postit',
    position: { x: 40, y: 120 },
    data: {
      label: 'ToFu — Descoberta',
      content: 'Pessoas que ainda não conhecem a marca. Foco em alcance.',
      color: 'blue',
    },
  },
  {
    id: 'f-meta-tofu',
    type: 'funnelSource',
    position: { x: 280, y: 180 },
    data: { label: 'Meta Ads — Vídeo', channel: 'meta' },
  },
  {
    id: 'f-google-tofu',
    type: 'funnelSource',
    position: { x: 480, y: 180 },
    data: { label: 'Google Ads — Display', channel: 'google' },
  },
  {
    id: 'f-organico',
    type: 'funnelSource',
    position: { x: 680, y: 180 },
    data: { label: 'Orgânico / Blog', channel: 'organic' },
  },
  // Landing
  {
    id: 'f-lp',
    type: 'landingPage',
    position: { x: 380, y: 340 },
    data: { label: 'Landing Page', url: '/oferta' },
  },
  // MoFu — Consideration
  {
    id: 'f-mofu-label',
    type: 'postit',
    position: { x: 40, y: 500 },
    data: {
      label: 'MoFu — Consideração',
      content: 'Leads captados. Nutrir com conteúdo de valor + prova social.',
      color: 'purple',
    },
  },
  {
    id: 'f-form',
    type: 'funnelAction',
    position: { x: 260, y: 560 },
    data: { label: 'Formulário de Lead', actionType: 'form_submit' },
  },
  {
    id: 'f-email',
    type: 'funnelAction',
    position: { x: 460, y: 560 },
    data: { label: 'Sequência Email', actionType: 'email_open' },
  },
  {
    id: 'f-remarketing',
    type: 'funnelAction',
    position: { x: 660, y: 560 },
    data: { label: 'Remarketing', actionType: 'page_view' },
  },
  // BoFu — Conversion
  {
    id: 'f-bofu-label',
    type: 'postit',
    position: { x: 40, y: 720 },
    data: {
      label: 'BoFu — Decisão',
      content: 'Lead qualificado. WhatsApp, ligação, reunião, proposta.',
      color: 'green',
    },
  },
  {
    id: 'f-wpp',
    type: 'funnelAction',
    position: { x: 280, y: 780 },
    data: { label: 'WhatsApp', actionType: 'whatsapp_click' },
  },
  {
    id: 'f-proposta',
    type: 'funnelAction',
    position: { x: 480, y: 780 },
    data: { label: 'Proposta enviada', actionType: 'purchase' },
  },
  {
    id: 'f-venda',
    type: 'result',
    position: { x: 680, y: 780 },
    data: { label: 'Venda fechada', value: 0 },
  },
]

const edges = [
  { id: 'e-meta-lp', source: 'f-meta-tofu', target: 'f-lp', type: 'smoothstep' },
  { id: 'e-google-lp', source: 'f-google-tofu', target: 'f-lp', type: 'smoothstep' },
  { id: 'e-org-lp', source: 'f-organico', target: 'f-lp', type: 'smoothstep' },
  { id: 'e-lp-form', source: 'f-lp', target: 'f-form', type: 'smoothstep' },
  { id: 'e-form-email', source: 'f-form', target: 'f-email', type: 'smoothstep' },
  { id: 'e-email-rema', source: 'f-email', target: 'f-remarketing', type: 'smoothstep' },
  { id: 'e-rema-wpp', source: 'f-remarketing', target: 'f-wpp', type: 'smoothstep' },
  { id: 'e-wpp-prop', source: 'f-wpp', target: 'f-proposta', type: 'smoothstep' },
  { id: 'e-prop-venda', source: 'f-proposta', target: 'f-venda', type: 'smoothstep' },
]

export const salesFunnelTemplate: PlannerTemplate = {
  id: 'sales-funnel',
  name: 'Funil de Vendas B2C',
  description: 'ToFu → MoFu → BoFu completo com 3 fontes de tráfego e CTA no WhatsApp.',
  long_description:
    'Template clássico pra operações de lead gen. Use como ponto de partida e adapte as fontes, CTAs e etapas de acordo com o vertical do cliente.',
  category: 'funnel',
  vertical: 'any',
  icon: '🎯',
  color: 'blue',
  node_count: nodes.length,
  edge_count: edges.length,
  estimated_setup_minutes: 20,
  tags: ['funil', 'lead gen', 'whatsapp', 'remarketing', 'ToFu MoFu BoFu'],
  nodes,
  edges,
}
