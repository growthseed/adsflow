/**
 * ============================================
 * Client Report Generator — Sprint C
 * ============================================
 * Generates a branded PDF report combining:
 *   1. Performance snapshot (Google Ads + Meta Ads)
 *   2. ClickUp tasks delivered in the period
 *   3. Goals attainment (GoalNode data)
 *
 * Uses jsPDF (already in project). Output = downloadable PDF.
 */

import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import type { ClientDashboardSnapshot, SnapshotKPI } from '@/types/clientDashboardSnapshot'
import type { ClickUpTask } from '@/services/adapters/clickupTypes'
import type { GoalNodeData } from '@/types/goalMetrics'
import { computeGoalStatus, GOAL_STATUS_CONFIG } from '@/types/goalMetrics'
import { getMetricByKey } from '@/data/metricRegistry'

// ── Brand colors ──
const NAVY = '#0A245E'
const BLUE = '#0F3999'
const ACCENT = '#3E80F2'
const GRAY = '#7E7E82'
const LIGHT_BG = '#EDF1FB'

export interface ReportInput {
  clientName: string
  clientSlug: string
  periodLabel: string
  periodFrom: string
  periodTo: string
  snapshot?: ClientDashboardSnapshot | null
  tasks?: ClickUpTask[]
  goals?: GoalNodeData[]
  assessorName?: string
}

export function generateClientReport(input: ReportInput): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const M = 15
  const CW = W - M * 2

  let y = 0

  // ── HELPER: new page ──
  function newPage() {
    doc.addPage()
    y = M
    addFooter()
  }

  function addFooter() {
    doc.setFontSize(7)
    doc.setTextColor(GRAY)
    doc.text(
      `Efeito Digital · AdsFlow · ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
      W / 2, H - 8, { align: 'center' },
    )
    doc.text(`${doc.getNumberOfPages()}`, W - M, H - 8, { align: 'right' })
  }

  function checkSpace(needed: number) {
    if (y + needed > H - 20) newPage()
  }

  // ── PAGE 1: COVER ──
  doc.setFillColor(NAVY)
  doc.rect(0, 0, W, H, 'F')

  doc.setFontSize(28)
  doc.setTextColor('#FFFFFF')
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO DE', W / 2, 90, { align: 'center' })
  doc.text('PERFORMANCE', W / 2, 105, { align: 'center' })

  doc.setFontSize(14)
  doc.setTextColor(ACCENT)
  doc.text('Google Ads + Meta Ads', W / 2, 122, { align: 'center' })

  doc.setFontSize(20)
  doc.setTextColor('#FFFFFF')
  doc.text(input.clientName.toUpperCase(), W / 2, 145, { align: 'center' })

  doc.setFontSize(11)
  doc.setTextColor('#AABBDD')
  doc.text(`Período: ${input.periodLabel}`, W / 2, 162, { align: 'center' })

  doc.setFontSize(9)
  doc.setTextColor('#667799')
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} | Efeito Digital`, W / 2, 250, { align: 'center' })
  if (input.assessorName) {
    doc.text(`Assessor: ${input.assessorName}`, W / 2, 258, { align: 'center' })
  }

  // ── PAGE 2: KPIs ──
  newPage()
  y = M + 5

  doc.setFontSize(16)
  doc.setTextColor(NAVY)
  doc.setFont('helvetica', 'bold')
  doc.text('1. Resumo de KPIs', M, y)
  y += 10

  if (input.snapshot?.kpis) {
    const kpis = Object.values(input.snapshot.kpis)
    renderKpiGrid(doc, kpis, M, y, CW)
    y += Math.ceil(kpis.length / 3) * 28 + 5
  } else {
    doc.setFontSize(10)
    doc.setTextColor(GRAY)
    doc.text('Dados de performance não disponíveis neste período.', M, y)
    y += 10
  }

  // ── Blended metrics ──
  if (input.snapshot?.blended) {
    checkSpace(40)
    doc.setFontSize(14)
    doc.setTextColor(NAVY)
    doc.setFont('helvetica', 'bold')
    doc.text('Investimento Consolidado', M, y)
    y += 8

    const b = input.snapshot.blended
    const rows = [
      ['Investimento Total', b.spend_formatted ?? `R$ ${b.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Conversões', String(b.conversions)],
    ]
    if (b.revenue != null) rows.push(['Receita', `R$ ${b.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`])
    if (b.roas != null) rows.push(['ROAS', `${b.roas.toFixed(1)}x`])

    renderTable(doc, rows, M, y, CW)
    y += rows.length * 8 + 10
  }

  // ── Campaigns table ──
  if (input.snapshot?.campaigns?.top?.length) {
    checkSpace(60)
    doc.setFontSize(14)
    doc.setTextColor(NAVY)
    doc.setFont('helvetica', 'bold')
    doc.text('Top Campanhas', M, y)
    y += 8

    const campRows = input.snapshot.campaigns.top.slice(0, 10).map((c) => [
      c.name.slice(0, 35),
      c.channel,
      `R$ ${c.spend.toFixed(0)}`,
      String(c.clicks),
      c.leads != null ? String(c.leads) : '—',
      c.cpl != null ? `R$ ${c.cpl.toFixed(0)}` : '—',
    ])
    const campHeaders = ['Campanha', 'Canal', 'Invest.', 'Cliques', 'Leads', 'CPL']

    renderTableWithHeaders(doc, campHeaders, campRows, M, y, CW)
    y += (campRows.length + 1) * 7 + 10
  }

  // ── PAGE 3: GOALS ──
  if (input.goals?.length) {
    checkSpace(50)
    doc.setFontSize(16)
    doc.setTextColor(NAVY)
    doc.setFont('helvetica', 'bold')
    doc.text('2. Atingimento de Metas', M, y)
    y += 10

    for (const goal of input.goals) {
      checkSpace(25)
      const metric = goal.metric ?? getMetricByKey(goal.metric_key)
      const target = goal.targets?.[0]?.target
      const pct = goal.attainment_pct ?? (target && goal.realized != null && target > 0 ? (goal.realized / target) * 100 : undefined)
      const status = goal.status ?? computeGoalStatus(pct)
      const cfg = GOAL_STATUS_CONFIG[status]

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(NAVY)
      doc.text(goal.label || metric?.label || goal.metric_key, M, y)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(GRAY)
      const valStr = `Realizado: ${goal.realized ?? '—'} | Meta: ${target ?? '—'} | ${pct != null ? `${pct.toFixed(0)}%` : '—'} (${cfg.label})`
      doc.text(valStr, M, y + 5)

      // progress bar
      const barW = CW * 0.6
      const barH = 3
      const barX = M
      const barY = y + 8
      doc.setFillColor('#E2E8F0')
      doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, 'F')
      const fillW = barW * Math.min((pct ?? 0) / 100, 1)
      if (fillW > 0) {
        const fillColor = status === 'exceeded' ? '#10B981' : status === 'on_track' ? '#3B82F6' : status === 'at_risk' ? '#F59E0B' : '#EF4444'
        doc.setFillColor(fillColor)
        doc.roundedRect(barX, barY, fillW, barH, 1.5, 1.5, 'F')
      }

      y += 18
    }
  }

  // ── PAGE 4: CLICKUP TASKS ──
  if (input.tasks?.length) {
    checkSpace(50)
    doc.setFontSize(16)
    doc.setTextColor(NAVY)
    doc.setFont('helvetica', 'bold')
    doc.text('3. Entregas do Período (ClickUp)', M, y)
    y += 10

    const done = input.tasks.filter((t) => t.status === 'done')
    const inProgress = input.tasks.filter((t) => t.status === 'in_progress' || t.status === 'review')
    const overdue = input.tasks.filter((t) => (t.days_late ?? 0) > 0 && t.status !== 'done')

    // Summary
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(NAVY)
    doc.text(`Concluídas: ${done.length} | Em andamento: ${inProgress.length} | Atrasadas: ${overdue.length}`, M, y)
    y += 8

    // Done list
    if (done.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(BLUE)
      doc.text('Entregas concluídas:', M, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      doc.setTextColor('#1E293B')
      for (const task of done.slice(0, 20)) {
        checkSpace(6)
        doc.setFontSize(8)
        doc.text(`✓ ${task.title.slice(0, 70)}`, M + 2, y)
        y += 5
      }
      if (done.length > 20) {
        doc.setTextColor(GRAY)
        doc.text(`... e mais ${done.length - 20} entregas`, M + 2, y)
        y += 5
      }
      y += 5
    }

    // Overdue list
    if (overdue.length > 0) {
      checkSpace(20)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor('#DC2626')
      doc.text('Tasks atrasadas:', M, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      for (const task of overdue.slice(0, 10)) {
        checkSpace(6)
        doc.setFontSize(8)
        doc.setTextColor('#DC2626')
        doc.text(`⚠ ${task.title.slice(0, 60)} — ${task.days_late}d atraso`, M + 2, y)
        y += 5
      }
    }
  }

  // ── Add footer to all pages ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(GRAY)
    doc.text(
      `Efeito Digital · AdsFlow · ${format(new Date(), "dd/MM/yyyy")}`,
      W / 2, H - 8, { align: 'center' },
    )
    doc.text(`${i} / ${totalPages}`, W - M, H - 8, { align: 'right' })
  }

  return doc
}

export function downloadClientReport(input: ReportInput) {
  const doc = generateClientReport(input)
  const slug = input.clientSlug.replace(/[^a-z0-9-]/g, '')
  const dateStr = format(new Date(), 'yyyy-MM')
  doc.save(`relatorio-${slug}-${dateStr}.pdf`)
}

// ── RENDERING HELPERS ──

function renderKpiGrid(doc: jsPDF, kpis: SnapshotKPI[], x: number, y: number, totalW: number) {
  const cols = 3
  const cellW = totalW / cols
  const cellH = 25

  kpis.forEach((kpi, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = x + col * cellW
    const cy = y + row * cellH

    doc.setFillColor(LIGHT_BG)
    doc.roundedRect(cx, cy, cellW - 3, cellH - 3, 2, 2, 'F')

    doc.setFontSize(7)
    doc.setTextColor(GRAY)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label, cx + 3, cy + 6)

    doc.setFontSize(14)
    doc.setTextColor(NAVY)
    doc.setFont('helvetica', 'bold')
    const valStr = formatKpiValue(kpi)
    doc.text(valStr, cx + 3, cy + 15)

    if (kpi.delta_percent != null) {
      const delta = kpi.delta_percent
      const sign = delta >= 0 ? '↑' : '↓'
      const color = (kpi.improvement_direction === 'lower_better' ? delta <= 0 : delta >= 0) ? '#10B981' : '#EF4444'
      doc.setFontSize(7)
      doc.setTextColor(color)
      doc.text(`${sign} ${Math.abs(delta).toFixed(1)}%`, cx + 3, cy + 20)
    }
  })
}

function formatKpiValue(kpi: SnapshotKPI): string {
  if (kpi.unit === 'currency') return `R$ ${kpi.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
  if (kpi.unit === 'percent') return `${kpi.value.toFixed(1)}%`
  if (kpi.unit === 'ratio') return `${kpi.value.toFixed(1)}x`
  return kpi.value.toLocaleString('pt-BR')
}

function renderTable(doc: jsPDF, rows: string[][], x: number, y: number, totalW: number) {
  const colW = totalW / 2
  rows.forEach(([label, value], i) => {
    const ry = y + i * 8
    doc.setFillColor(i % 2 === 0 ? LIGHT_BG : '#FFFFFF')
    doc.rect(x, ry - 4, totalW, 8, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(NAVY)
    doc.text(label, x + 3, ry)
    doc.setFont('helvetica', 'normal')
    doc.text(value, x + colW, ry)
  })
}

function renderTableWithHeaders(doc: jsPDF, headers: string[], rows: string[][], x: number, y: number, totalW: number) {
  const colW = totalW / headers.length

  // Header
  doc.setFillColor(NAVY)
  doc.rect(x, y - 4, totalW, 7, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor('#FFFFFF')
  headers.forEach((h, i) => doc.text(h, x + i * colW + 2, y))
  y += 5

  // Data rows
  doc.setFont('helvetica', 'normal')
  rows.forEach((row, ri) => {
    doc.setFillColor(ri % 2 === 0 ? '#F8FAFC' : '#FFFFFF')
    doc.rect(x, y - 3, totalW, 7, 'F')
    doc.setFontSize(7)
    doc.setTextColor('#1E293B')
    row.forEach((cell, ci) => doc.text(cell, x + ci * colW + 2, y + 1))
    y += 7
  })
}
