/**
 * Renderer server-side de ReportBlocks → jsPDF.
 * Usado por /api/reports/[id]/generate (manual) e pelo cron
 * /api/crons/reports-deliver (scheduled).
 *
 * Suporta hoje: header, kpi-strip, paragraph-ai, highlight, wins-list,
 * page-break. Gráficos e blocos complexos viram placeholders textuais
 * ("gráfico: leads últimos 30d") — evolução natural depois com SVG embebido.
 */

import { jsPDF } from 'jspdf'

interface ReportBlock {
  id: string
  type: string
  props: Record<string, unknown>
}

export interface ReportRenderContext {
  clientName: string | null
  clientIndustry?: string | null
  /** Agregados do período pra injetar em KPI strip */
  kpis?: {
    leads?: number
    spend?: number
    cpl?: number | null
    roas?: number | null
    ctr?: number | null
    cpm?: number | null
    conversions?: number
  }
  /** Texto para blocos "paragraph-ai" quando IA indisponível */
  aiFallbackText?: string
  /** Wins derivados do período pra "wins-list" */
  wins?: string[]
  periodLabel: string
  generatedAt: Date
}

const BRAND_PRIMARY: [number, number, number] = [71, 99, 130] // #476382
const NEUTRAL_900: [number, number, number] = [31, 48, 68]
const NEUTRAL_500: [number, number, number] = [122, 138, 150]
const MARGIN = 18 // mm

function formatBRL(v: number, compact = false): string {
  if (compact && Math.abs(v) >= 1000) {
    return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`
  }
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatKPIValue(key: string, v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—'
  switch (key) {
    case 'leads':
    case 'conversions':
      return v.toLocaleString('pt-BR')
    case 'spend':
      return formatBRL(v, v >= 10000)
    case 'cpl':
    case 'cpm':
      return formatBRL(v)
    case 'roas':
      return `${v.toFixed(1)}×`
    case 'ctr':
      return `${v.toFixed(1)}%`
    default:
      return String(v)
  }
}

export function renderReportPdf(blocks: ReportBlock[], ctx: ReportRenderContext): Uint8Array {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = MARGIN

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  // Cabeçalho fixo — branding da agência
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...BRAND_PRIMARY)
  doc.text('Ads Flow · Efeito Digital', MARGIN, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...NEUTRAL_500)
  doc.text(ctx.periodLabel, pageWidth - MARGIN, y, { align: 'right' })
  y += 4
  doc.setDrawColor(...BRAND_PRIMARY)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, pageWidth - MARGIN, y)
  y += 8

  for (const block of blocks) {
    ensureSpace(30)
    switch (block.type) {
      case 'header': {
        const title = String(block.props.title ?? 'Relatório')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(...NEUTRAL_900)
        doc.text(title, MARGIN, y)
        y += 7
        if (ctx.clientName) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.setTextColor(...NEUTRAL_500)
          doc.text(
            `${ctx.clientName}${ctx.clientIndustry ? ` · ${ctx.clientIndustry}` : ''}`,
            MARGIN,
            y,
          )
          y += 5
        }
        y += 4
        break
      }

      case 'kpi-strip': {
        const keys = (block.props.kpis as string[] | undefined) ?? ['leads', 'cpl', 'roas', 'spend']
        const usable = Math.min(keys.length, 6)
        const cellW = (pageWidth - MARGIN * 2) / usable
        ensureSpace(22)
        for (let i = 0; i < usable; i++) {
          const k = keys[i]
          const v = ctx.kpis?.[k as keyof NonNullable<ReportRenderContext['kpis']>]
          const x = MARGIN + i * cellW
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          doc.setTextColor(...NEUTRAL_500)
          doc.text(k.toUpperCase(), x, y)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(16)
          doc.setTextColor(...NEUTRAL_900)
          doc.text(formatKPIValue(k, typeof v === 'number' ? v : null), x, y + 7)
        }
        y += 14
        break
      }

      case 'paragraph-ai': {
        const fallback = ctx.aiFallbackText ??
          'Resumo automático indisponível neste relatório. Configure o provedor de IA ou edite o texto manualmente.'
        const text = String(block.props.generatedText ?? fallback)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.setTextColor(...NEUTRAL_900)
        const lines = doc.splitTextToSize(text, pageWidth - MARGIN * 2)
        ensureSpace(lines.length * 5 + 4)
        doc.text(lines, MARGIN, y)
        y += lines.length * 5 + 4
        break
      }

      case 'highlight': {
        const text = String(block.props.text ?? '')
        if (!text) break
        ensureSpace(18)
        doc.setFillColor(239, 242, 249) // brand-50
        doc.rect(MARGIN, y - 3, pageWidth - MARGIN * 2, 14, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(...BRAND_PRIMARY)
        const lines = doc.splitTextToSize(`"${text}"`, pageWidth - MARGIN * 2 - 6)
        doc.text(lines, MARGIN + 3, y + 4)
        y += Math.max(14, lines.length * 5) + 6
        break
      }

      case 'wins-list': {
        const wins = ctx.wins ?? []
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(...NEUTRAL_900)
        doc.text('Wins do período', MARGIN, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...NEUTRAL_900)
        if (wins.length === 0) {
          doc.setTextColor(...NEUTRAL_500)
          doc.text('— nenhum win registrado neste período —', MARGIN, y)
          y += 6
        } else {
          for (const w of wins) {
            ensureSpace(6)
            doc.text(`· ${w}`, MARGIN, y)
            y += 5
          }
          y += 2
        }
        break
      }

      case 'page-break':
        doc.addPage()
        y = MARGIN
        break

      case 'line-chart':
      case 'bar-chart':
      case 'donut':
      case 'funnel':
      case 'heatmap':
      case 'yoy':
      case 'cohort':
      case 'ltv-cac':
      case 'pacing-chart': {
        // Placeholder textual — evolução: renderizar SVG e embeber como imagem
        const metric = (block.props.metric as string) ?? '-'
        const period = (block.props.period as string) ?? ctx.periodLabel
        ensureSpace(16)
        doc.setFillColor(239, 242, 249)
        doc.rect(MARGIN, y, pageWidth - MARGIN * 2, 12, 'F')
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(...NEUTRAL_500)
        doc.text(`[Gráfico · ${block.type} · métrica "${metric}" · período "${period}"]`, MARGIN + 3, y + 7)
        y += 16
        break
      }

      case 'kpi-single':
      case 'kpi-gauge':
      case 'image':
      default: {
        // Desconhecido/não implementado — desenha placeholder
        ensureSpace(10)
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(...NEUTRAL_500)
        doc.text(`[Bloco "${block.type}" não renderizado]`, MARGIN, y + 5)
        y += 10
        break
      }
    }
  }

  // Rodapé com timestamp
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...NEUTRAL_500)
    const stamp = `Gerado ${ctx.generatedAt.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })} · página ${i} de ${pageCount}`
    doc.text(stamp, pageWidth - MARGIN, pageHeight - 8, { align: 'right' })
  }

  return new Uint8Array(doc.output('arraybuffer'))
}
