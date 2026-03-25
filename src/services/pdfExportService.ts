/**
 * ============================================
 * PDF EXPORT SERVICE
 * ============================================
 * Generates multi-page PDF reports using jsPDF.
 * Supports white-label (client logo, colors, brand name).
 */

import jsPDF from 'jspdf';
import type { SavedReport } from './reportsService';
import { getMetricDefinition, formatMetricValue } from '@/types/reports';

// =====================================================
// TYPES
// =====================================================

export interface ReportBranding {
  clientName: string;
  clientLogo?: string;       // base64 or URL
  accentColor: string;       // hex
  agencyName: string;
  agencyLogo?: string;       // base64 or URL
  footerText?: string;
}

const DEFAULT_BRANDING: ReportBranding = {
  clientName: '',
  accentColor: '#1e40af',
  agencyName: 'Efeito Digital — Ads Flow',
  footerText: 'Relatório gerado automaticamente pelo Ads Flow',
};

// =====================================================
// COLOR HELPERS
// =====================================================

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [30, 64, 175]; // default blue
}

function lightenColor(hex: string, factor = 0.9): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [
    Math.round(r + (255 - r) * factor),
    Math.round(g + (255 - g) * factor),
    Math.round(b + (255 - b) * factor),
  ];
}

// =====================================================
// MAIN EXPORT FUNCTION
// =====================================================

export async function exportReportToPDF(
  report: SavedReport,
  branding: Partial<ReportBranding> = {},
): Promise<Blob> {
  const brand = { ...DEFAULT_BRANDING, ...branding };
  const accent = hexToRgb(brand.accentColor);
  const accentLight = lightenColor(brand.accentColor, 0.92);
  const data = report.data;
  const metrics = report.metrics;

  if (!data) throw new Error('Report has no data. Generate it first.');

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── PAGE 1: COVER ──────────────────────────────

  // Background accent bar
  doc.setFillColor(...accent);
  doc.rect(0, 0, pageW, 80, 'F');

  // Agency name (top-left)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(brand.agencyName, margin, 20);

  // Report title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(report.name, margin, 48);

  // Client name
  if (brand.clientName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(brand.clientName, margin, 60);
  }

  // Period
  doc.setFontSize(11);
  doc.text(`Período: ${data.period.start} a ${data.period.end}`, margin, 72);

  // Reset text color
  doc.setTextColor(30, 41, 59); // slate-800

  // Generated date
  y = 100;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}`, margin, y);
  y += 5;
  if (brand.footerText) {
    doc.text(brand.footerText, margin, y);
  }

  // ── PAGE 2: KPIs OVERVIEW ──────────────────────

  doc.addPage();
  y = margin;

  // Section header
  y = drawSectionHeader(doc, 'Visão Geral — KPIs', y, margin, contentW, accent);
  y += 8;

  // KPI cards (4 per row)
  const kpiMetrics = metrics.slice(0, 12); // max 12 KPIs
  const cardW = (contentW - 6) / 4;
  const cardH = 22;

  for (let i = 0; i < kpiMetrics.length; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);

    if (row > 0 && col === 0 && y + cardH > pageH - 20) {
      doc.addPage();
      y = margin;
    }

    const x = margin + col * (cardW + 2);
    const cardY = y + row * (cardH + 3);

    const key = kpiMetrics[i];
    const def = getMetricDefinition(key);
    const value = data.totals[key];

    // Card background
    doc.setFillColor(...accentLight);
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'F');

    // Label
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(def?.label || key, x + 3, cardY + 7);

    // Value
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(
      value !== undefined ? formatMetricValue(value, def?.format || 'number') : '-',
      x + 3,
      cardY + 17,
    );
  }

  y += Math.ceil(kpiMetrics.length / 4) * (cardH + 3) + 10;

  // ── PAGE 3: DATA TABLE ─────────────────────────

  if (y + 40 > pageH - 20) {
    doc.addPage();
    y = margin;
  }

  y = drawSectionHeader(doc, 'Detalhamento por Campanha', y, margin, contentW, accent);
  y += 5;

  // Table header
  const colCount = Math.min(metrics.length + 1, 8); // max 8 columns
  const colW = contentW / colCount;
  const tableMetrics = metrics.slice(0, colCount - 1);

  // Header row
  doc.setFillColor(...accent);
  doc.rect(margin, y, contentW, 8, 'F');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Campanha', margin + 2, y + 5.5);
  tableMetrics.forEach((key, i) => {
    const def = getMetricDefinition(key);
    doc.text(def?.label || key, margin + colW + i * colW + 2, y + 5.5);
  });
  y += 8;

  // Data rows
  doc.setFont('helvetica', 'normal');
  const maxRows = 25;
  const displayRows = data.rows.slice(0, maxRows);

  for (let i = 0; i < displayRows.length; i++) {
    if (y + 7 > pageH - 20) {
      doc.addPage();
      y = margin;
      // Re-draw header
      doc.setFillColor(...accent);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Campanha', margin + 2, y + 5.5);
      tableMetrics.forEach((key, j) => {
        const def = getMetricDefinition(key);
        doc.text(def?.label || key, margin + colW + j * colW + 2, y + 5.5);
      });
      y += 8;
      doc.setFont('helvetica', 'normal');
    }

    const row = displayRows[i];

    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin, y, contentW, 7, 'F');
    }

    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);

    // Campaign name (truncated)
    const name = (row.campaign_name || row.adset_name || row.ad_name || '-').slice(0, 30);
    doc.text(name, margin + 2, y + 5);

    // Metric values
    tableMetrics.forEach((key, j) => {
      const def = getMetricDefinition(key);
      const val = row.metrics[key];
      doc.text(
        val !== undefined ? formatMetricValue(val, def?.format || 'number') : '-',
        margin + colW + j * colW + 2,
        y + 5,
      );
    });

    y += 7;
  }

  // Totals row
  y += 2;
  doc.setFillColor(...accentLight);
  doc.rect(margin, y, contentW, 8, 'F');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', margin + 2, y + 5.5);
  tableMetrics.forEach((key, j) => {
    const def = getMetricDefinition(key);
    const val = data.totals[key];
    doc.text(
      val !== undefined ? formatMetricValue(val, def?.format || 'number') : '-',
      margin + colW + j * colW + 2,
      y + 5.5,
    );
  });

  // ── FOOTER ON ALL PAGES ────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);

    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'normal');
    doc.text(brand.agencyName, margin, pageH - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin - 20, pageH - 7);

    if (i > 1 && brand.clientName) {
      doc.text(brand.clientName, pageW / 2, pageH - 7, { align: 'center' });
    }
  }

  return doc.output('blob');
}

// =====================================================
// HELPERS
// =====================================================

function drawSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  margin: number,
  _contentW: number,
  accent: [number, number, number],
): number {
  // Accent left bar
  doc.setFillColor(...accent);
  doc.rect(margin, y, 3, 8, 'F');

  // Title
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin + 6, y + 6);

  return y + 10;
}

// =====================================================
// DOWNLOAD HELPER
// =====================================================

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
