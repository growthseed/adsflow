/**
 * Captação Escolar / Matrículas — específico pro vertical educação.
 * Pensado pra escolas como a Escola Pequeno Aprendiz.
 */

import type { PlannerTemplate } from '@/types/plannerTemplates'

const nodes = [
  {
    id: 'e-title',
    type: 'advancedText',
    position: { x: 360, y: 30 },
    data: {
      text: '🎓 Campanha de Matrículas',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#0f172a',
    },
  },
  // Aquisição
  {
    id: 'e-section-aquisicao',
    type: 'postit',
    position: { x: 40, y: 120 },
    data: {
      label: 'Aquisição',
      content: 'Onde os pais descobrem a escola.',
      color: 'blue',
    },
  },
  {
    id: 'e-meta-leads',
    type: 'funnelSource',
    position: { x: 260, y: 180 },
    data: { label: 'Meta Ads — Lead Gen', channel: 'meta' },
  },
  {
    id: 'e-google-search',
    type: 'funnelSource',
    position: { x: 480, y: 180 },
    data: { label: 'Google Ads — Search', channel: 'google' },
  },
  {
    id: 'e-gmb',
    type: 'funnelSource',
    position: { x: 700, y: 180 },
    data: { label: 'Google Meu Negócio', channel: 'gmb' },
  },
  // Landing
  {
    id: 'e-lp',
    type: 'landingPage',
    position: { x: 370, y: 340 },
    data: { label: 'LP "Matrículas 2027"', url: '/matriculas' },
  },
  // Qualificação
  {
    id: 'e-section-qualif',
    type: 'postit',
    position: { x: 40, y: 500 },
    data: {
      label: 'Qualificação',
      content:
        '1. Formulário captura nome + filho(a) + série\n2. Automação envia PDF proposta pedagógica\n3. SDR agenda visita no Kommo',
      color: 'purple',
    },
  },
  {
    id: 'e-form',
    type: 'funnelAction',
    position: { x: 260, y: 580 },
    data: { label: 'Form captura', actionType: 'form_submit' },
  },
  {
    id: 'e-email-proposta',
    type: 'funnelAction',
    position: { x: 480, y: 580 },
    data: { label: 'Email auto (Brevo)', actionType: 'email_open' },
  },
  {
    id: 'e-sdr',
    type: 'funnelAction',
    position: { x: 700, y: 580 },
    data: { label: 'SDR ativa no Kommo', actionType: 'whatsapp_click' },
  },
  // Visita
  {
    id: 'e-visita',
    type: 'funnelAction',
    position: { x: 370, y: 740 },
    data: { label: 'Visita agendada', actionType: 'purchase' },
  },
  // Matrícula
  {
    id: 'e-matricula',
    type: 'result',
    position: { x: 370, y: 900 },
    data: { label: '✅ Matrícula efetivada', value: 0 },
  },
  // KPI aside
  {
    id: 'e-kpi-box',
    type: 'postit',
    position: { x: 820, y: 740 },
    data: {
      label: 'KPIs de sucesso',
      content:
        '• Custo por visita agendada: R$ 70\n• Taxa visita → matrícula: 40%\n• CPA matrícula: R$ 180\n• Meta mês: 25 matrículas',
      color: 'green',
    },
  },
]

const edges = [
  { id: 'e-meta-lp', source: 'e-meta-leads', target: 'e-lp', type: 'smoothstep' },
  { id: 'e-google-lp', source: 'e-google-search', target: 'e-lp', type: 'smoothstep' },
  { id: 'e-gmb-lp', source: 'e-gmb', target: 'e-lp', type: 'smoothstep' },
  { id: 'e-lp-form', source: 'e-lp', target: 'e-form', type: 'smoothstep' },
  { id: 'e-form-email', source: 'e-form', target: 'e-email-proposta', type: 'smoothstep' },
  { id: 'e-email-sdr', source: 'e-email-proposta', target: 'e-sdr', type: 'smoothstep' },
  { id: 'e-sdr-visita', source: 'e-sdr', target: 'e-visita', type: 'smoothstep' },
  { id: 'e-visita-mat', source: 'e-visita', target: 'e-matricula', type: 'smoothstep' },
]

export const enrollmentTemplate: PlannerTemplate = {
  id: 'enrollment',
  name: 'Captação de Matrículas',
  description: 'Funil específico pra escolas: 3 fontes → LP → Kommo SDR → visita → matrícula.',
  long_description:
    'Otimizado pro vertical educação. Inclui o padrão "visita agendada como conversão intermediária" que a Escola Pequeno Aprendiz já usa, com KPIs padrão do setor.',
  category: 'funnel',
  vertical: 'education',
  icon: '🎓',
  color: 'amber',
  node_count: nodes.length,
  edge_count: edges.length,
  estimated_setup_minutes: 25,
  tags: ['educação', 'escola', 'matrículas', 'kommo', 'open house'],
  nodes,
  edges,
}
