/**
 * ============================================
 * Efeito Ads Playbook — in-app registry
 * ============================================
 * Imports the markdown files (via Vite `?raw`) that live under
 * `src/data/playbook/` so they can be rendered inside AdFlow without
 * a server round-trip. Content is sourced from the proprietary
 * `~/.claude/skills/efeito-ads-playbook` skill.
 * ============================================
 */

// Vite ?raw suffix returns the file contents as a string
import skillIndex from './SKILL.md?raw'
import philosophy from './philosophy.md?raw'
import adCopywriter from './checklists/ad-copywriter.md?raw'
import campaignsReadyToScale from './checklists/campaigns-ready-to-scale.md?raw'
import googleAdsAudit from './checklists/google-ads-audit.md?raw'
import keywordNgramAudit from './checklists/keyword-ngram-audit.md?raw'
import landingPageDeepAudit from './checklists/landing-page-deep-audit.md?raw'

export type PlaybookCategory = 'intro' | 'checklist'

export interface PlaybookDoc {
  slug: string
  title: string
  description: string
  category: PlaybookCategory
  content: string
}

/** Non-negotiable principles surfaced as quick badges across the app */
export const PLAYBOOK_PRINCIPLES = [
  'Search Campaign nunca roda sem Negative Keyword List compartilhada do vertical',
  'QS < 5 em keyword com gasto > R$100/mês = auditoria imediata',
  'Budget Lost IS > 20% = sinal de subscaling (escalar budget, não bid)',
  'Rank Lost IS > 30% = problema de bid OU ad rank (nunca os dois juntos)',
  'Search + Display: sempre em campanhas separadas',
  'PMAX: Asset Group separado por público/oferta',
  'Meta Advantage+: sempre A/B testar contra detailed targeting manual',
  'Cliente novo: mês 1 aprende, mês 2 otimiza, mês 3 escala',
  'Relatórios sempre com WoW e MoM — nunca só números absolutos',
  'Tracking first, ads depois — nunca criar campanha sem conversão definida no GA4/GTM',
] as const

export const PLAYBOOK_DOCS: PlaybookDoc[] = [
  {
    slug: 'overview',
    title: 'Visão Geral',
    description: 'Índice e princípios não-negociáveis da Efeito Digital',
    category: 'intro',
    content: skillIndex,
  },
  {
    slug: 'philosophy',
    title: 'Filosofia — Diagnostic Partner',
    description: 'Como pensar: parceiro de diagnóstico, não auto-executor',
    category: 'intro',
    content: philosophy,
  },
  {
    slug: 'keyword-ngram-audit',
    title: 'N-gram Audit + SWOT',
    description: 'Centerpiece — análise de palavras-chave com SWOT (Aaron Young)',
    category: 'checklist',
    content: keywordNgramAudit,
  },
  {
    slug: 'landing-page-deep-audit',
    title: 'Landing Page Deep Audit',
    description: 'Auditoria de LP com scraping real (Tendency Web)',
    category: 'checklist',
    content: landingPageDeepAudit,
  },
  {
    slug: 'campaigns-ready-to-scale',
    title: 'Campaigns Ready to Scale',
    description: 'Matriz de escala vertical (Aaron Young)',
    category: 'checklist',
    content: campaignsReadyToScale,
  },
  {
    slug: 'ad-copywriter',
    title: 'Ad Copywriter',
    description: 'Geração de RSA + Meta copy a partir de pesquisa de dor',
    category: 'checklist',
    content: adCopywriter,
  },
  {
    slug: 'google-ads-audit',
    title: 'Google Ads Audit — 30 dias',
    description: 'Auditoria genérica de conta Google Ads dos últimos 30 dias',
    category: 'checklist',
    content: googleAdsAudit,
  },
]

export function getPlaybookDoc(slug: string): PlaybookDoc | undefined {
  return PLAYBOOK_DOCS.find((d) => d.slug === slug)
}
