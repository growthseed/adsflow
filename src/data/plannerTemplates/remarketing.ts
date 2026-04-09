/**
 * Remarketing — retomar leads perdidos em 3 etapas.
 */

import type { PlannerTemplate } from '@/types/plannerTemplates'

const nodes = [
  {
    id: 'r-title',
    type: 'advancedText',
    position: { x: 340, y: 30 },
    data: {
      text: '🔁 Estratégia de Remarketing',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#0f172a',
    },
  },
  {
    id: 'r-audiencias',
    type: 'postit',
    position: { x: 40, y: 130 },
    data: {
      label: 'Audiências (Custom)',
      content:
        'Visitantes 30d · Visitantes 90d\nFormulário abandonado 7d\nCheckout abandonado 14d\nCompradores passados (LAL 1%)',
      color: 'purple',
    },
  },
  // Stage 1 — Reengagement
  {
    id: 'r-stage1',
    type: 'advancedText',
    position: { x: 100, y: 320 },
    data: { text: 'Etapa 1 — Reengajamento', fontSize: 18, fontWeight: 'bold' },
  },
  {
    id: 'r-visitantes',
    type: 'audience',
    position: { x: 80, y: 380 },
    data: { label: 'Visitantes 30d' },
  },
  {
    id: 'r-ad-1',
    type: 'campaign',
    position: { x: 300, y: 380 },
    data: { label: 'Meta — Social Proof + Vídeo' },
  },
  {
    id: 'r-lp-depoimentos',
    type: 'landingPage',
    position: { x: 520, y: 380 },
    data: { label: 'LP com depoimentos', url: '/depoimentos' },
  },
  // Stage 2 — Objection
  {
    id: 'r-stage2',
    type: 'advancedText',
    position: { x: 100, y: 540 },
    data: { text: 'Etapa 2 — Quebra de objeções', fontSize: 18, fontWeight: 'bold' },
  },
  {
    id: 'r-form-abandonou',
    type: 'audience',
    position: { x: 80, y: 600 },
    data: { label: 'Form abandonado 7d' },
  },
  {
    id: 'r-ad-2',
    type: 'campaign',
    position: { x: 300, y: 600 },
    data: { label: 'Meta — FAQ carrossel' },
  },
  {
    id: 'r-lp-faq',
    type: 'landingPage',
    position: { x: 520, y: 600 },
    data: { label: 'LP com FAQ', url: '/faq' },
  },
  // Stage 3 — Offer
  {
    id: 'r-stage3',
    type: 'advancedText',
    position: { x: 100, y: 760 },
    data: { text: 'Etapa 3 — Oferta com urgência', fontSize: 18, fontWeight: 'bold' },
  },
  {
    id: 'r-checkout-abandonou',
    type: 'audience',
    position: { x: 80, y: 820 },
    data: { label: 'Checkout abandonado 14d' },
  },
  {
    id: 'r-ad-3',
    type: 'campaign',
    position: { x: 300, y: 820 },
    data: { label: 'Meta — Desconto escassez' },
  },
  {
    id: 'r-whats',
    type: 'funnelAction',
    position: { x: 520, y: 820 },
    data: { label: 'WhatsApp direto', actionType: 'whatsapp_click' },
  },
  {
    id: 'r-convert',
    type: 'result',
    position: { x: 740, y: 820 },
    data: { label: 'Reconversão', value: 0 },
  },
]

const edges = [
  { id: 'r-e1', source: 'r-visitantes', target: 'r-ad-1', type: 'smoothstep' },
  { id: 'r-e2', source: 'r-ad-1', target: 'r-lp-depoimentos', type: 'smoothstep' },
  { id: 'r-e3', source: 'r-form-abandonou', target: 'r-ad-2', type: 'smoothstep' },
  { id: 'r-e4', source: 'r-ad-2', target: 'r-lp-faq', type: 'smoothstep' },
  { id: 'r-e5', source: 'r-checkout-abandonou', target: 'r-ad-3', type: 'smoothstep' },
  { id: 'r-e6', source: 'r-ad-3', target: 'r-whats', type: 'smoothstep' },
  { id: 'r-e7', source: 'r-whats', target: 'r-convert', type: 'smoothstep' },
]

export const remarketingTemplate: PlannerTemplate = {
  id: 'remarketing',
  name: 'Estratégia de Remarketing',
  description: '3 etapas pra recuperar quem clicou mas não converteu.',
  long_description:
    'Framework pra montar campanhas de recuperação: reengajamento → objeções → oferta com urgência. Usa audiências customizadas por comportamento e janela temporal.',
  category: 'remarketing',
  vertical: 'any',
  icon: '🔁',
  color: 'pink',
  node_count: nodes.length,
  edge_count: edges.length,
  estimated_setup_minutes: 15,
  tags: ['remarketing', 'retargeting', 'audiências customizadas', 'recuperação'],
  nodes,
  edges,
}
