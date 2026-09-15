/**
 * POST /api/reports/generate?id=<report_document_id>
 *
 * Gera PDF server-side a partir de `public.report_documents.blocks`,
 * salva no bucket `reports`, grava `last_pdf_url` e devolve signed URL (30d).
 *
 * Auth: JWT Supabase do usuário OU Bearer CRON_SECRET (quando chamado
 * pelo cron /api/crons/reports-deliver).
 *
 * Sprint 8 · V2 Leva 3 Report Builder.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { allowMethods, applyCors, requireUserAuth } from '../_lib/security.js'
import { renderReportPdf, type ReportRenderContext } from '../../src/server/pdf/renderBlocks.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const CRON_SECRET = process.env.CRON_SECRET || ''

function serviceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function tryCronAuth(req: VercelRequest): boolean {
  if (!CRON_SECRET) return false
  return (req.headers.authorization || '') === `Bearer ${CRON_SECRET}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  const reportId = String(req.query.id || '')
  if (!reportId) {
    return res.status(400).json({ error: 'id query param required' })
  }

  // Autenticação: aceita JWT user OU CRON_SECRET
  const isCron = tryCronAuth(req)
  if (!isCron) {
    const auth = await requireUserAuth(req, res)
    if (!auth) return
  }

  const svc = serviceClient()

  // Lê o documento
  const { data: doc, error: docErr } = await svc
    .from('report_documents')
    .select('id, client_id, name, blocks')
    .eq('id', reportId)
    .maybeSingle()

  if (docErr || !doc) {
    return res.status(404).json({ error: 'Report not found' })
  }

  // Contexto: nome do cliente + agregados básicos se houver
  let clientName: string | null = null
  let clientIndustry: string | null = null
  if (doc.client_id) {
    const { data: client } = await svc
      .from('clients')
      .select('name, industry')
      .eq('id', doc.client_id)
      .maybeSingle()
    clientName = (client as { name?: string } | null)?.name ?? null
    clientIndustry = (client as { industry?: string } | null)?.industry ?? null
  }

  const ctx: ReportRenderContext = {
    clientName,
    clientIndustry,
    kpis: {},
    wins: [],
    periodLabel: periodLabelFor(new Date()),
    generatedAt: new Date(),
    aiFallbackText:
      'Este relatório é um esqueleto pronto — conecte o provedor de IA para habilitar o resumo automatizado do período.',
  }

  // Renderiza PDF
  const pdfBytes = renderReportPdf(
    (doc.blocks ?? []) as Array<{ id: string; type: string; props: Record<string, unknown> }>,
    ctx,
  )

  // Upload no bucket
  const path = `${reportId}/${Date.now()}.pdf`
  const { error: uploadErr } = await svc.storage
    .from('reports')
    .upload(path, pdfBytes, {
      contentType: 'application/pdf',
      upsert: false,
    })
  if (uploadErr) {
    return res.status(500).json({ error: 'storage upload failed', detail: uploadErr.message })
  }

  // Signed URL 30d
  const { data: signed, error: signErr } = await svc.storage
    .from('reports')
    .createSignedUrl(path, 60 * 60 * 24 * 30)
  if (signErr || !signed) {
    return res.status(500).json({ error: 'sign url failed', detail: signErr?.message })
  }

  const url = signed.signedUrl
  const now = new Date().toISOString()

  // Persiste last_pdf_*
  await svc
    .from('report_documents')
    .update({ last_pdf_url: url, last_pdf_at: now, status: 'final' })
    .eq('id', reportId)

  return res.status(200).json({
    url,
    path,
    reportId,
    generatedAt: now,
    sizeBytes: pdfBytes.length,
  })
}

function periodLabelFor(d: Date): string {
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
