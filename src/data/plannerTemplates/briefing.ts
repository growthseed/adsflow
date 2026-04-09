/**
 * Briefing — mapa inicial de expectativas do cliente.
 * Usado no kickoff ou antes de qualquer campanha.
 */

import type { PlannerTemplate } from '@/types/plannerTemplates'

const nodes = [
  {
    id: 'b-title',
    type: 'advancedText',
    position: { x: 400, y: 40 },
    data: {
      text: '📋 Briefing do Projeto',
      fontSize: 32,
      fontWeight: 'bold',
      color: '#0f172a',
    },
  },
  {
    id: 'b-contexto',
    type: 'postit',
    position: { x: 60, y: 140 },
    data: {
      label: 'Contexto do negócio',
      content:
        'Qual é o negócio? Há quanto tempo opera? Quais produtos/serviços?\nQual é o diferencial competitivo?',
      color: 'yellow',
    },
  },
  {
    id: 'b-publico',
    type: 'postit',
    position: { x: 360, y: 140 },
    data: {
      label: 'Público-alvo',
      content:
        'Quem é o cliente ideal?\n• Demografia\n• Dores principais\n• Onde consome conteúdo',
      color: 'blue',
    },
  },
  {
    id: 'b-objetivo',
    type: 'postit',
    position: { x: 660, y: 140 },
    data: {
      label: 'Objetivo principal',
      content:
        'O que queremos alcançar?\n• Metas quantitativas\n• Prazo\n• Indicadores de sucesso',
      color: 'green',
    },
  },
  {
    id: 'b-concorrentes',
    type: 'postit',
    position: { x: 60, y: 420 },
    data: {
      label: 'Concorrentes',
      content:
        'Top 3 concorrentes diretos.\nO que eles fazem bem? Onde estão vulneráveis?',
      color: 'pink',
    },
  },
  {
    id: 'b-oferta',
    type: 'postit',
    position: { x: 360, y: 420 },
    data: {
      label: 'Oferta atual',
      content: 'Ticket médio, promoções, prova social, garantias.',
      color: 'purple',
    },
  },
  {
    id: 'b-canais',
    type: 'postit',
    position: { x: 660, y: 420 },
    data: {
      label: 'Canais disponíveis',
      content:
        'Meta Ads · Google Ads · SEO · Email · WhatsApp · Kommo CRM · ClickUp',
      color: 'orange',
    },
  },
  {
    id: 'b-restricoes',
    type: 'postit',
    position: { x: 360, y: 700 },
    data: {
      label: 'Restrições e cuidados',
      content:
        'Orçamento · Sazonalidade · Compliance · Tom de voz proibido',
      color: 'red',
    },
  },
]

const edges: PlannerTemplate['edges'] = []

export const briefingTemplate: PlannerTemplate = {
  id: 'briefing',
  name: 'Briefing do Projeto',
  description: 'Mapa inicial com as 7 perguntas que todo projeto começa respondendo.',
  long_description:
    'Template de kickoff pra alinhar expectativas com o cliente. Usa post-its coloridos porque é pra ser preenchido COM o cliente na reunião de descoberta, não depois.',
  category: 'briefing',
  vertical: 'any',
  icon: '📋',
  color: 'amber',
  node_count: nodes.length,
  edge_count: edges.length,
  estimated_setup_minutes: 30,
  tags: ['kickoff', 'descoberta', 'onboarding', 'briefing'],
  nodes,
  edges,
}
