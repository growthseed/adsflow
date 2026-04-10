/**
 * ============================================
 * humanizeSnapshot.ts — turns dashboard data into friendly text
 * ============================================
 * Used at the top of the Client Overview page to greet the user
 * with a 2-3 sentence summary of the period. No LLM, no template
 * engine — just a small set of hand-tuned rules over the snapshot.
 *
 * If the snapshot is missing a field, the rule silently drops that
 * sentence instead of showing "R$ NaN".
 * ============================================
 */

import type { ClientDashboardSnapshot, SnapshotKPI } from '@/types/clientDashboardSnapshot'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v)

const nBR = (v: number) => v.toLocaleString('pt-BR')

function formatKpiValue(k: SnapshotKPI): string {
  switch (k.unit) {
    case 'currency':
      return BRL(k.value)
    case 'percent':
      return `${(k.value * 100).toFixed(1).replace('.', ',')}%`
    case 'ratio':
      return `${k.value.toFixed(2).replace('.', ',')}x`
    default:
      return nBR(k.value)
  }
}

function formatDelta(delta?: number): string {
  if (delta == null) return ''
  const pct = Math.abs(delta * 100)
  return `${pct.toFixed(0).replace('.', ',')}%`
}

function wasGood(kpi: SnapshotKPI): boolean | null {
  if (kpi.trend == null || kpi.trend === 'flat') return null
  if (kpi.improvement_direction === 'lower_better') {
    return kpi.trend === 'down'
  }
  return kpi.trend === 'up'
}

// =============================================================
// NICHO-SPECIFIC SUMMARIES
// =============================================================
// Each generator returns an array of sentences. The UI joins them
// with spaces. Return [] if the data isn't enough for a useful
// summary — the caller renders a neutral fallback.

function summarizeLeadsB2B(snap: ClientDashboardSnapshot): string[] {
  const { leads, spend, cpl, pipeline } = snap.kpis
  if (!leads || !spend) return []

  const sentences: string[] = []
  sentences.push(
    `Nos últimos ${snap.period.days} dias foram gerados ${nBR(leads.value)} leads com investimento de ${formatKpiValue(spend)}.`,
  )

  if (cpl) {
    const direction = wasGood(cpl)
    if (direction === true) {
      sentences.push(
        `O custo por lead caiu ${formatDelta(cpl.delta_percent)} em relação ao período anterior — uma evolução positiva.`,
      )
    } else if (direction === false) {
      sentences.push(
        `O custo por lead subiu ${formatDelta(cpl.delta_percent)}, algo que estamos monitorando de perto.`,
      )
    } else {
      sentences.push(`O custo médio por lead foi de ${formatKpiValue(cpl)}.`)
    }
  }

  if (pipeline && pipeline.value > 0) {
    sentences.push(
      `O pipeline ativo de vendas está em ${formatKpiValue(pipeline)}.`,
    )
  }

  return sentences
}

function summarizeEcommerce(snap: ClientDashboardSnapshot): string[] {
  const { revenue, roas, orders, aov } = snap.kpis
  if (!revenue || !roas) return []

  const sentences: string[] = []
  sentences.push(
    `A loja gerou ${formatKpiValue(revenue)} em receita no período, com ${orders ? nBR(orders.value) : '—'} pedidos${aov ? ` e ticket médio de ${formatKpiValue(aov)}` : ''}.`,
  )

  const roasDirection = wasGood(roas)
  if (roasDirection === true) {
    sentences.push(
      `O ROAS subiu para ${formatKpiValue(roas)}, ${formatDelta(roas.delta_percent)} acima do período anterior.`,
    )
  } else if (roasDirection === false) {
    sentences.push(
      `O ROAS caiu para ${formatKpiValue(roas)}; vamos ajustar as campanhas nos próximos dias.`,
    )
  } else {
    sentences.push(`O ROAS médio foi de ${formatKpiValue(roas)}.`)
  }

  return sentences
}

function summarizePdvLocal(snap: ClientDashboardSnapshot): string[] {
  const { reach, route_clicks, calls } = snap.kpis
  if (!reach) return []

  const sentences: string[] = []
  sentences.push(
    `O negócio alcançou ${nBR(reach.value)} pessoas na região no período.`,
  )

  if (route_clicks && calls) {
    sentences.push(
      `Foram ${nBR(route_clicks.value)} cliques pedindo rota e ${nBR(calls.value)} ligações geradas pelo perfil do Google.`,
    )
  }

  const reachDirection = wasGood(reach)
  if (reachDirection === true) {
    sentences.push(
      `O alcance subiu ${formatDelta(reach.delta_percent)} em relação ao período anterior.`,
    )
  }

  return sentences
}

function summarizeSalesInside(snap: ClientDashboardSnapshot): string[] {
  const { opportunities, won, pipeline_value } = snap.kpis
  if (!opportunities || !won) return []

  const sentences: string[] = []
  sentences.push(
    `Foram ${nBR(opportunities.value)} novas oportunidades e ${nBR(won.value)} vendas fechadas no período.`,
  )

  const wonDirection = wasGood(won)
  if (wonDirection === true) {
    sentences.push(
      `O volume de fechamento cresceu ${formatDelta(won.delta_percent)} vs o mês anterior.`,
    )
  }

  if (pipeline_value && pipeline_value.value > 0) {
    sentences.push(`O pipeline em aberto soma ${formatKpiValue(pipeline_value)}.`)
  }

  return sentences
}

// =============================================================
// PUBLIC API
// =============================================================

export interface HumanizedSummary {
  /** Greeting line: "Bom dia, Dr. Euvaldo." */
  greeting: string
  /** Main sentences (2-3) describing the period */
  body: string[]
  /** Optional call to action for the bottom of the block */
  cta?: string
}

function timeBasedGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function firstName(fullName: string): string {
  return fullName.split(/[ .]+/)[0] || fullName
}

export function humanizeSnapshot(snap: ClientDashboardSnapshot): HumanizedSummary {
  let body: string[] = []
  switch (snap.scope) {
    case 'leads_b2b':
      body = summarizeLeadsB2B(snap)
      break
    case 'ecommerce':
      body = summarizeEcommerce(snap)
      break
    case 'pdv_local':
      body = summarizePdvLocal(snap)
      break
    case 'sales_inside':
      body = summarizeSalesInside(snap)
      break
    default:
      body = summarizeLeadsB2B(snap)
  }

  return {
    greeting: `${timeBasedGreeting()}, ${firstName(snap.name)}`,
    body,
    cta: 'Ver detalhes da performance',
  }
}
