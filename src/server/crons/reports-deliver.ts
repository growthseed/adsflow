/**
 * GET /api/crons/reports-deliver
 *
 * Cron 1×/h · acorda `report_document_schedules` cujo `next_run_at`
 * já passou, chama `/api/reports/generate?id=<reportId>` (Sprint 8)
 * e envia PDF aos destinatários.
 * Handoff V2 · Leva 3 · spec #3.
 *
 * Delivery por e-mail fica stub — Sprint 9b pluga SendGrid/Resend.
 * Por ora apenas grava `alert_events` (severity info) com o link pro
 * PDF, que o gestor vê no feed e pode encaminhar manualmente.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { ENV } from '../sync/config.js'

interface Schedule {
  id: string
  report_id: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  day_of_week: number | null
  day_of_month: number | null
  hour_local: number
  timezone: string
  recipients: string[]
  active: boolean
  last_run_at: string | null
  next_run_at: string | null
}

function svc() {
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function computeNextRun(sch: Schedule, from: Date): Date {
  const next = new Date(from)
  next.setSeconds(0, 0)
  const hour = sch.hour_local ?? 8
  switch (sch.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      next.setHours(hour, 0)
      return next
    case 'weekly': {
      next.setDate(next.getDate() + 1)
      const target = sch.day_of_week ?? 1
      while (next.getDay() !== target) next.setDate(next.getDate() + 1)
      next.setHours(hour, 0)
      return next
    }
    case 'monthly': {
      const day = sch.day_of_month ?? 1
      next.setMonth(next.getMonth() + 1, day)
      next.setHours(hour, 0)
      return next
    }
    case 'quarterly': {
      const day = sch.day_of_month ?? 1
      next.setMonth(next.getMonth() + 3, day)
      next.setHours(hour, 0)
      return next
    }
  }
}

function resolveBaseUrl(req: VercelRequest): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const host = req.headers.host
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https'
  return host ? `${proto}://${host}` : 'http://localhost:3000'
}

export async function runReportsDeliver(req: VercelRequest, res: VercelResponse) {

  const client = svc()
  const now = new Date()
  const baseUrl = resolveBaseUrl(req)

  // Pega schedules devidos
  const { data: due, error: dueErr } = await client
    .from('report_document_schedules')
    .select('*')
    .eq('active', true)
    .lte('next_run_at', now.toISOString())
  if (dueErr) {
    return res.status(500).json({ error: 'load schedules failed', detail: dueErr.message })
  }

  const delivered: Array<{ schedule_id: string; report_id: string; ok: boolean; detail?: string }> = []

  for (const sch of (due as Schedule[]) ?? []) {
    try {
      // Aciona geração do PDF via endpoint (Sprint 8)
      const genResp = await fetch(`${baseUrl}/api/reports/generate?id=${sch.report_id}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${ENV.CRON_SECRET}` },
      })
      if (!genResp.ok) throw new Error(`PDF generate HTTP ${genResp.status}`)
      const body = (await genResp.json()) as { url: string }

      // Busca client_id + nome pra alert feed
      const { data: doc } = await client
        .from('report_documents')
        .select('client_id, name')
        .eq('id', sch.report_id)
        .maybeSingle()

      // Delivery stub — registra no feed in-app
      await client.from('alert_events').insert({
        client_id: (doc as { client_id?: string | null } | null)?.client_id ?? null,
        severity: 'info',
        title: `Relatório "${(doc as { name?: string } | null)?.name ?? 'relatório'}" pronto`,
        body: `PDF gerado e pronto para envio aos ${sch.recipients.length} destinatário${sch.recipients.length === 1 ? '' : 's'}.`,
        observed_meta: { report_id: sch.report_id, pdf_url: body.url, recipients: sch.recipients },
        delivered_to: ['inapp'],
      })

      // TODO Sprint 9b — enviar de fato via SendGrid/Resend para sch.recipients

      // Atualiza schedule
      const next = computeNextRun(sch, now)
      await client
        .from('report_document_schedules')
        .update({
          last_run_at: now.toISOString(),
          next_run_at: next.toISOString(),
        })
        .eq('id', sch.id)

      delivered.push({ schedule_id: sch.id, report_id: sch.report_id, ok: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      delivered.push({ schedule_id: sch.id, report_id: sch.report_id, ok: false, detail: msg })
    }
  }

  return res.status(200).json({
    ok: true,
    ran_at: now.toISOString(),
    processed: (due ?? []).length,
    delivered,
  })
}
