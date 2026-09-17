/**
 * ============================================
 * exportFlowPdf — render ReactFlow canvas to PDF
 * ============================================
 * Captures the canvas via html-to-image, inserts it into a jspdf
 * A4 landscape page with a branded header/footer, and triggers a
 * download.
 *
 * Dependencies already in package.json:
 *   - html-to-image ^1.11.13
 *   - jspdf ^4.2.1
 * ============================================
 */

import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { getNodesBounds, getViewportForBounds } from '@xyflow/react'
import type { Node } from '@xyflow/react'

export interface ExportFlowPdfOptions {
  /** Flow name shown in the header */
  flowName: string
  /** Optional client name for the subtitle */
  clientName?: string
  /** Optional description shown under the title */
  description?: string
  /** Flow version for the footer */
  version?: number
  /** ReactFlow nodes — used to compute the visible bounds */
  nodes: Node[]
  /** Filename (without extension) — defaults to sanitized flow name */
  filename?: string
}

const PDF_PAGE = {
  width_mm: 297, // A4 landscape width
  height_mm: 210, // A4 landscape height
  margin_mm: 12,
  header_h_mm: 18,
  footer_h_mm: 10,
}

/**
 * Convert the current ReactFlow viewport to a PNG and embed in a PDF.
 * Must be called while the editor is mounted — fetches the
 * `.react-flow__viewport` DOM node directly.
 */
export async function exportFlowToPdf(options: ExportFlowPdfOptions): Promise<void> {
  const { flowName, clientName, description, version, nodes, filename } = options

  // Find the ReactFlow viewport element (the transformed inner layer)
  const viewport = document.querySelector<HTMLElement>('.react-flow__viewport')
  if (!viewport) {
    throw new Error('ReactFlow viewport not found — is the editor mounted?')
  }

  // Compute node bounds and generate a transform that fits them
  // at a fixed export resolution (1600x900 keeps A4 landscape ratio-ish).
  const EXPORT_W = 1600
  const EXPORT_H = 900

  if (nodes.length > 0) {
    const bounds = getNodesBounds(nodes)
    const { x, y, zoom } = getViewportForBounds(
      bounds,
      EXPORT_W,
      EXPORT_H,
      0.5,
      2,
      0.1,
    )

    // Apply the computed transform during the capture so all nodes fit
    const originalTransform = viewport.style.transform
    viewport.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`

    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: '#ffffff',
        width: EXPORT_W,
        height: EXPORT_H,
        pixelRatio: 2,
        filter: (node) => {
          // Skip controls, minimap, and attribution from the capture
          const cls = (node as HTMLElement).className?.toString?.() || ''
          return (
            !cls.includes('react-flow__controls') &&
            !cls.includes('react-flow__minimap') &&
            !cls.includes('react-flow__attribution')
          )
        },
      })

      // Restore original transform immediately
      viewport.style.transform = originalTransform

      await renderPdf(dataUrl, {
        flowName,
        clientName,
        description,
        version,
        filename,
      })
    } finally {
      viewport.style.transform = originalTransform
    }
  } else {
    // Empty flow — still export a blank PDF with header
    await renderPdf('', { flowName, clientName, description, version, filename })
  }
}

async function renderPdf(
  imageDataUrl: string,
  meta: Pick<ExportFlowPdfOptions, 'flowName' | 'clientName' | 'description' | 'version' | 'filename'>,
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const { width_mm, height_mm, margin_mm, header_h_mm, footer_h_mm } = PDF_PAGE
  const contentTop = margin_mm + header_h_mm
  const contentBottom = height_mm - margin_mm - footer_h_mm
  const contentHeight = contentBottom - contentTop
  const contentWidth = width_mm - margin_mm * 2

  // ---- Header ----
  pdf.setFillColor(15, 23, 42) // neutral-900
  pdf.rect(0, 0, width_mm, margin_mm + header_h_mm, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(meta.flowName, margin_mm, margin_mm + 8)

  if (meta.clientName) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(148, 163, 184) // slate-400
    pdf.text(meta.clientName, margin_mm, margin_mm + 14)
  }

  // Version badge on the right
  if (meta.version !== undefined) {
    pdf.setFontSize(9)
    pdf.setTextColor(148, 163, 184)
    pdf.text(`v${meta.version}`, width_mm - margin_mm, margin_mm + 8, { align: 'right' })
  }

  // Date
  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  pdf.setFontSize(9)
  pdf.setTextColor(148, 163, 184)
  pdf.text(now, width_mm - margin_mm, margin_mm + 14, { align: 'right' })

  // ---- Description ----
  let imageTopOffset = 0
  if (meta.description) {
    pdf.setTextColor(100, 116, 139) // slate-500
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'italic')
    const descLines = pdf.splitTextToSize(meta.description, contentWidth)
    pdf.text(descLines, margin_mm, contentTop + 4)
    imageTopOffset = Math.min(descLines.length, 2) * 4 + 3
  }

  // ---- Flow image ----
  if (imageDataUrl) {
    const imgTop = contentTop + imageTopOffset
    const imgHeight = contentHeight - imageTopOffset - 2

    try {
      pdf.addImage(
        imageDataUrl,
        'PNG',
        margin_mm,
        imgTop,
        contentWidth,
        imgHeight,
        undefined,
        'FAST',
      )
    } catch (err) {
      console.error('[exportFlowPdf] addImage failed:', err)
      pdf.setTextColor(239, 68, 68)
      pdf.text('Falha ao renderizar canvas.', margin_mm, imgTop + 20)
    }
  } else {
    pdf.setTextColor(148, 163, 184)
    pdf.setFontSize(11)
    pdf.text('Flow vazio — nenhum nó para exportar.', width_mm / 2, height_mm / 2, {
      align: 'center',
    })
  }

  // ---- Footer ----
  const footerY = height_mm - margin_mm - footer_h_mm / 2 + 2
  pdf.setDrawColor(226, 232, 240) // slate-200
  pdf.setLineWidth(0.2)
  pdf.line(margin_mm, footerY - 4, width_mm - margin_mm, footerY - 4)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Planejado pela Efeito Digital · AdFlow · Planner', margin_mm, footerY)
  pdf.text(`Página 1 de 1`, width_mm - margin_mm, footerY, { align: 'right' })

  // ---- Save ----
  const safeName =
    meta.filename ||
    meta.flowName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  pdf.save(`${safeName}.pdf`)
}
