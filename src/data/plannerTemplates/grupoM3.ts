/**
 * Grupo M3 — Operação Atual (Google Search)
 *
 * Template com a operação real do Grupo M3 hoje (snapshot 2026-05-04):
 *   1 conta Google Ads (CID 4989960017)
 *   1 campanha Search ativa (CP1 - R$ 25/dia)
 *   3 ad groups: Terceirização, Facilities, Serviços Operacionais
 *   6 RSAs (2 por ad group)
 *   LP única em https://gpm3.com.br/diagnostico
 *   CTA: WhatsApp / formulário de diagnóstico
 *
 * Use como base pra discutir expansão (Meta Ads, Performance Max,
 * keywords negativas, novas LPs por ad group, etc).
 */

import type { PlannerTemplate } from '@/types/plannerTemplates'

const nodes = [
  // Header
  {
    id: 'm3-title',
    type: 'advancedText',
    position: { x: 360, y: 20 },
    data: {
      text: 'Grupo M3 — Operação Atual',
      fontSize: 26,
      fontWeight: 'bold',
      color: '#0f172a',
    },
  },
  {
    id: 'm3-subtitle',
    type: 'advancedText',
    position: { x: 360, y: 60 },
    data: {
      text: 'Google Search · CID 4989960017 · gpm3.com.br',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#64748b',
    },
  },

  // Brand
  {
    id: 'm3-brand',
    type: 'brand',
    position: { x: 60, y: 110 },
    data: {
      brand: 'google',
      label: 'Grupo M3',
      subtitle: 'Facilities · Terceirização · Brasília/DF',
      description: 'Desde 1982 · +300 contratos · 8 estados',
    },
  },

  // Goal — meta atual
  {
    id: 'm3-goal',
    type: 'goal',
    position: { x: 820, y: 110 },
    data: {
      label: 'Meta de Leads',
      objective: 'Leads B2B qualificados',
      period: 'Mensal',
      target: 30,
      current: 13,
      unit: 'number',
    },
  },

  // ToFu label
  {
    id: 'm3-tofu',
    type: 'postit',
    position: { x: 40, y: 280 },
    data: {
      label: 'ToFu — Captação',
      content:
        'Busca ativa (Google Search). Termos transacionais por linha de serviço. Budget R$ 25/dia.',
      color: 'blue',
    },
  },

  // Traffic source: Google Search
  {
    id: 'm3-google',
    type: 'trafficSource',
    position: { x: 400, y: 320 },
    data: {
      label: 'Google Ads — Search',
      channel: 'google',
      platform: 'Google Ads',
      account: 'CID 4989960017',
    },
  },

  // Campaign — CP1
  {
    id: 'm3-cp1',
    type: 'campaign',
    position: { x: 360, y: 480 },
    data: {
      label: 'CP1 - [SHCH] [LEAD] [WPP] [SITE M3]',
      objective: 'Leads',
      status: 'active',
      budgetType: 'daily',
      budget: 25,
      spent: 793.52,
      impressions: 3194,
      clicks: 531,
      ctr: 0.1662,
      conversions: 13,
      costPerResult: 61.04,
      isActive: true,
    },
  },

  // MoFu label
  {
    id: 'm3-mofu',
    type: 'postit',
    position: { x: 40, y: 700 },
    data: {
      label: 'MoFu — 3 frentes de oferta',
      content:
        'Cada ad group ataca uma linha de serviço com termos próprios. Mesma LP recebe todos.',
      color: 'purple',
    },
  },

  // Ad Groups — 3 lado a lado
  {
    id: 'm3-ag-tercerizacao',
    type: 'adSet',
    position: { x: 60, y: 760 },
    data: {
      label: 'GP11 — Terceirização',
      targeting: '"empresa terceirização DF", "mão de obra terceirizada"',
      budget: 'compartilhado (R$ 25/d)',
      location: 'Brasília/DF + 8 estados',
      spend: 302.42,
      results: 4,
      isActive: true,
    },
  },
  {
    id: 'm3-ag-facilities',
    type: 'adSet',
    position: { x: 420, y: 760 },
    data: {
      label: 'GP12 — Facilities',
      targeting: '"empresa de facilities", "manutenção predial"',
      budget: 'compartilhado (R$ 25/d)',
      location: 'Brasília/DF',
      spend: 130.94,
      results: 1,
      isActive: true,
    },
  },
  {
    id: 'm3-ag-operacionais',
    type: 'adSet',
    position: { x: 780, y: 760 },
    data: {
      label: 'GP13 — Serviços Operacionais',
      targeting: '"limpeza empresarial", "portaria terceirizada"',
      budget: 'compartilhado (R$ 25/d)',
      location: 'Brasília/DF',
      spend: 360.16,
      results: 8,
      isActive: true,
    },
  },

  // Ads (2 por ad group = 6 RSAs) — abaixo de cada ad group
  {
    id: 'm3-ad-tercerizacao-1',
    type: 'ad',
    position: { x: 60, y: 1040 },
    data: {
      label: 'RSA #1 — Empresa de Terceirização',
      format: 'Search Ad',
      headline: 'Grupo M3 | Soluções e Serviços',
      status: 'enabled',
      isActive: true,
    },
  },
  {
    id: 'm3-ad-tercerizacao-2',
    type: 'ad',
    position: { x: 60, y: 1200 },
    data: {
      label: 'RSA #2 — +40 anos / Desde 1982',
      format: 'Search Ad',
      headline: 'Empresa Terceirizada Brasília · Desde 1982',
      status: 'enabled',
      isActive: true,
    },
  },
  {
    id: 'm3-ad-facilities-1',
    type: 'ad',
    position: { x: 420, y: 1040 },
    data: {
      label: 'RSA #1 — Empresa de Facilities',
      format: 'Search Ad',
      headline: 'Grupo M3 | Facilities · Manutenção Predial',
      status: 'enabled',
      isActive: true,
    },
  },
  {
    id: 'm3-ad-facilities-2',
    type: 'ad',
    position: { x: 420, y: 1200 },
    data: {
      label: 'RSA #2 — Gestão de Facilities DF',
      format: 'Search Ad',
      headline: 'Facilities para Empresas DF · +40 anos',
      status: 'enabled',
      isActive: true,
    },
  },
  {
    id: 'm3-ad-operacionais-1',
    type: 'ad',
    position: { x: 780, y: 1040 },
    data: {
      label: 'RSA #1 — Limpeza/Portaria Empresarial',
      format: 'Search Ad',
      headline: 'Grupo M3 | Limpeza Empresarial · Portaria',
      status: 'enabled',
      isActive: true,
    },
  },
  {
    id: 'm3-ad-operacionais-2',
    type: 'ad',
    position: { x: 780, y: 1200 },
    data: {
      label: 'RSA #2 — +1000 colaboradores / órgãos públicos',
      format: 'Search Ad',
      headline: 'Limpeza Empresarial DF · +300 contratos',
      status: 'enabled',
      isActive: true,
    },
  },

  // Landing Page
  {
    id: 'm3-lp',
    type: 'landingPage',
    position: { x: 380, y: 1380 },
    data: {
      label: 'LP — gpm3.com.br/diagnostico',
      url: 'https://gpm3.com.br/diagnostico',
    },
  },

  // BoFu label
  {
    id: 'm3-bofu',
    type: 'postit',
    position: { x: 40, y: 1540 },
    data: {
      label: 'BoFu — Conversão',
      content:
        'Formulário de diagnóstico → WhatsApp do comercial. Sem CRM integrado hoje (oportunidade Kommo).',
      color: 'green',
    },
  },

  // Action: WhatsApp
  {
    id: 'm3-wpp',
    type: 'funnelAction',
    position: { x: 250, y: 1600 },
    data: { label: 'Clique no WhatsApp', actionType: 'whatsapp_click' },
  },
  // Action: Form
  {
    id: 'm3-form',
    type: 'funnelAction',
    position: { x: 510, y: 1600 },
    data: { label: 'Formulário de Diagnóstico', actionType: 'form_submit' },
  },

  // Result
  {
    id: 'm3-result',
    type: 'result',
    position: { x: 380, y: 1780 },
    data: {
      label: 'Lead qualificado → Comercial',
      value: 13,
      description: 'Meta atual: 30 leads/mês · Atual (30d): 13',
    },
  },

  // Notes — observações operacionais
  {
    id: 'm3-note-tracking',
    type: 'postit',
    position: { x: 1140, y: 760 },
    data: {
      label: '⚠️ Tracking',
      content:
        'Conv caíram de 156 (Mar) → 12 (Abr). Investigar conversion action no Google Ads.',
      color: 'pink',
    },
  },
  {
    id: 'm3-note-expansion',
    type: 'postit',
    position: { x: 1140, y: 1040 },
    data: {
      label: '🚀 Expansão sugerida',
      content:
        'Meta Ads (LinkedIn-like B2B), PMax, segmentar LP por linha de serviço, CRM Kommo.',
      color: 'amber',
    },
  },
]

const edges = [
  // Brand → Source
  { id: 'm3-e-brand-google', source: 'm3-brand', target: 'm3-google', type: 'smoothstep' },
  // Source → Campaign
  { id: 'm3-e-google-cp1', source: 'm3-google', target: 'm3-cp1', type: 'smoothstep' },
  // Campaign → Ad Groups
  { id: 'm3-e-cp1-ag1', source: 'm3-cp1', target: 'm3-ag-tercerizacao', type: 'smoothstep' },
  { id: 'm3-e-cp1-ag2', source: 'm3-cp1', target: 'm3-ag-facilities', type: 'smoothstep' },
  { id: 'm3-e-cp1-ag3', source: 'm3-cp1', target: 'm3-ag-operacionais', type: 'smoothstep' },
  // Ad Groups → Ads
  { id: 'm3-e-ag1-ad1', source: 'm3-ag-tercerizacao', target: 'm3-ad-tercerizacao-1', type: 'smoothstep' },
  { id: 'm3-e-ag1-ad2', source: 'm3-ag-tercerizacao', target: 'm3-ad-tercerizacao-2', type: 'smoothstep' },
  { id: 'm3-e-ag2-ad1', source: 'm3-ag-facilities', target: 'm3-ad-facilities-1', type: 'smoothstep' },
  { id: 'm3-e-ag2-ad2', source: 'm3-ag-facilities', target: 'm3-ad-facilities-2', type: 'smoothstep' },
  { id: 'm3-e-ag3-ad1', source: 'm3-ag-operacionais', target: 'm3-ad-operacionais-1', type: 'smoothstep' },
  { id: 'm3-e-ag3-ad2', source: 'm3-ag-operacionais', target: 'm3-ad-operacionais-2', type: 'smoothstep' },
  // Ads → LP
  { id: 'm3-e-ad-tt1-lp', source: 'm3-ad-tercerizacao-1', target: 'm3-lp', type: 'smoothstep' },
  { id: 'm3-e-ad-tt2-lp', source: 'm3-ad-tercerizacao-2', target: 'm3-lp', type: 'smoothstep' },
  { id: 'm3-e-ad-fc1-lp', source: 'm3-ad-facilities-1', target: 'm3-lp', type: 'smoothstep' },
  { id: 'm3-e-ad-fc2-lp', source: 'm3-ad-facilities-2', target: 'm3-lp', type: 'smoothstep' },
  { id: 'm3-e-ad-op1-lp', source: 'm3-ad-operacionais-1', target: 'm3-lp', type: 'smoothstep' },
  { id: 'm3-e-ad-op2-lp', source: 'm3-ad-operacionais-2', target: 'm3-lp', type: 'smoothstep' },
  // LP → Actions
  { id: 'm3-e-lp-wpp', source: 'm3-lp', target: 'm3-wpp', type: 'smoothstep' },
  { id: 'm3-e-lp-form', source: 'm3-lp', target: 'm3-form', type: 'smoothstep' },
  // Actions → Result
  { id: 'm3-e-wpp-result', source: 'm3-wpp', target: 'm3-result', type: 'smoothstep' },
  { id: 'm3-e-form-result', source: 'm3-form', target: 'm3-result', type: 'smoothstep' },
]

export const grupoM3Template: PlannerTemplate = {
  id: 'grupo-m3-current',
  name: 'Grupo M3 — Operação Atual',
  description:
    'Mapa real da operação Google Ads do Grupo M3: 1 campanha Search, 3 ad groups, 6 RSAs, LP única.',
  long_description:
    'Snapshot da operação Grupo M3 em 2026-05-04. Mostra a campanha CP1 ativa (R$ 25/dia) com os 3 ad groups (Terceirização, Facilities e Serviços Operacionais), os 6 anúncios responsivos de busca, a LP única (gpm3.com.br/diagnostico) e os pontos de conversão. Inclui notas de tracking e sugestões de expansão.',
  category: 'strategy',
  vertical: 'b2b',
  icon: '🏢',
  color: 'slate',
  node_count: nodes.length,
  edge_count: edges.length,
  estimated_setup_minutes: 5,
  tags: ['grupo m3', 'b2b', 'facilities', 'terceirização', 'google ads', 'search', 'cliente real'],
  nodes,
  edges,
}
