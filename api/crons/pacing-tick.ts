/**
 * GET /api/crons/pacing-tick
 *
 * Cron 1×/h · avalia `pacing_rules` ativas, projeta gasto até fim do
 * mês e decide entre notificar (grace window) ou pausar (após grace).
 * Handoff V2 · Leva 3 · spec #4.
 *
 * Regras (conforme specs-interacao):
 *   · Só age no dia corrente — nunca pausa retroativo
 *   · Critério: projeção linear supera teto em > threshold_pct
 *   · Flow: primeiro emite `notified` → grace window (default 15min) →
 *     se gestor não reverter, emite `paused` no próximo tick
 *   · Respeita suspended_ranges (cliente em férias)
 *   · Registra TODA ação em pacing_audit_log (append-only)
 *
 * TODO: após pausar, chamar API real do Meta/Google para pausar
 * campaigns. Sprint 7d trata disso no integrations/delivery layer.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { ENV, requireCronAuth } from '../../src/server/sync/config.js'

interface PacingRule {
  id: string
  client_id: string
  active: boolean
  threshold_pct: number
  grace_window_minutes: number
  resume_policy: 'next_cycle' | 'manual'
  suspended_ranges: string[] | null
  notify_whatsapp: boolean
  notify_email: boolean
  notify_inapp: boolean
}

interface ClientLite {
  id: string
  name: string
  monthly_budget: number | null
}

interface PacingAuditRow {
  id: string
  action: 'paused' | 'resumed' | 'skipped' | 'notified'
  created_at: string
}

function svc() {
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function isInSuspendedRange(rangesRaw: string[] | null, now: Date): boolean {
  if (!rangesRaw || rangesRaw.length === 0) return false
  // Postgres tstzrange text: `["2026-05-01 00:00:00+00","2026-05-10 00:00:00+00")`
  for (const raw of rangesRaw) {
    const m = /^\[?"?([^",)]+)"?,\s*"?([^")]+)"?\)?/.exec(raw)
    if (!m) continue
    const from = new Date(m[1])
    const to = new Date(m[2])
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      if (now >= from && now < to) return true
    }
  }
  return false
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireCronAuth(req, res)) return

  const client = svc()
  const now = new Date()
  const monthTotal = daysInMonth(now)
  const day = now.getDate()
  const monthStartISO = startOfMonth(now).toISOString().slice(0, 10)
  const todayISO = now.toISOString().slice(0, 10)

  // Carrega rules ativas
  const { data: rules, error: rulesErr } = await client
    .from('pacing_rules')
    .select('*')
    .eq('active', true)
  if (rulesErr) {
    return res.status(500).json({ error: 'load pacing_rules failed', detail: rulesErr.message })
  }

  const results: Array<{ client_id: string; action: string; reason?: string }> = []

  for (const rule of (rules as PacingRule[]) ?? []) {
    if (isInSuspendedRange(rule.suspended_ranges, now)) {
      results.push({ client_id: rule.client_id, action: 'skipped', reason: 'suspended_range' })
      continue
    }

    // Dados do cliente
    const { data: c } = await client
      .from('clients')
      .select('id, name, monthly_budget')
      .eq('id', rule.client_id)
      .maybeSingle()
    const cli = c as ClientLite | null
    if (!cli?.monthly_budget || cli.monthly_budget <= 0) {
      results.push({ client_id: rule.client_id, action: 'skipped', reason: 'no_budget' })
      continue
    }

    // Agrega spend do mês (Meta + Google via tabelas existentes)
    // Fallback robusto: soma de ad_insights + google_ads_insights do período
    const { data: adIns } = await client
      .from('ad_insights')
      .select('spend')
      .eq('client_id', rule.client_id)
      .gte('date', monthStartISO)
      .lte('date', todayISO)
    const { data: gAdIns } = await client
      .from('google_ads_insights')
      .select('cost')
      .eq('client_id', rule.client_id)
      .gte('date', monthStartISO)
      .lte('date', todayISO)

    const metaSpend = ((adIns as { spend: number | null }[] | null) ?? []).reduce(
      (a, r) => a + Number(r.spend ?? 0),
      0,
    )
    const googleSpend = ((gAdIns as { cost: number | null }[] | null) ?? []).reduce(
      (a, r) => a + Number(r.cost ?? 0),
      0,
    )
    const spend = metaSpend + googleSpend

    if (spend === 0) {
      results.push({ client_id: rule.client_id, action: 'skipped', reason: 'no_spend_yet' })
      continue
    }

    const projected = (spend / day) * monthTotal
    const overspendPct = ((projected - cli.monthly_budget) / cli.monthly_budget) * 100

    if (overspendPct <= rule.threshold_pct) {
      results.push({ client_id: rule.client_id, action: 'skipped', reason: 'within_threshold' })
      continue
    }

    // Última ação do log
    const { data: lastRows } = await client
      .from('pacing_audit_log')
      .select('id, action, created_at')
      .eq('client_id', rule.client_id)
      .order('created_at', { ascending: false })
      .limit(1)
    const last = ((lastRows as PacingAuditRow[] | null) ?? [])[0]

    const shouldPauseNow = (() => {
      if (!last) return false
      if (last.action !== 'notified') return false
      const elapsedMin = (now.getTime() - new Date(last.created_at).getTime()) / 60000
      return elapsedMin >= rule.grace_window_minutes
    })()

    const baseRow = {
      client_id: rule.client_id,
      platform: 'mixed' as const,
      budget_cents: Math.round(cli.monthly_budget * 100),
      spend_cents: Math.round(spend * 100),
      projected_cents: Math.round(projected * 100),
      projected_overspend_pct: Number(overspendPct.toFixed(2)),
      triggered_by: 'auto' as const,
    }

    if (shouldPauseNow) {
      await client.from('pacing_audit_log').insert({
        ...baseRow,
        action: 'paused',
        reason: `Auto-pause: projeção ${overspendPct.toFixed(1)}% acima do teto + grace window expirada`,
        reversible_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      await client.from('alert_events').insert({
        client_id: rule.client_id,
        severity: 'critical',
        title: `Campanhas pausadas · projeção ${overspendPct.toFixed(0)}% acima do teto`,
        body: `${cli.name} · gasto ${(spend / cli.monthly_budget * 100).toFixed(0)}% do teto até dia ${day}.`,
        delivered_to: ['inapp'],
      })
      results.push({ client_id: rule.client_id, action: 'paused' })
    } else if (!last || last.action !== 'notified') {
      await client.from('pacing_audit_log').insert({
        ...baseRow,
        action: 'notified',
        reason: `Alerta: projeção ${overspendPct.toFixed(1)}% acima do teto — grace de ${rule.grace_window_minutes}min antes de pausar`,
      })
      const channels: string[] = ['inapp']
      if (rule.notify_whatsapp) channels.push('whatsapp')
      if (rule.notify_email) channels.push('email')
      await client.from('alert_events').insert({
        client_id: rule.client_id,
        severity: 'warning',
        title: `Budget vai estourar em ${overspendPct.toFixed(0)}%`,
        body: `${cli.name} · auto-pause em ${rule.grace_window_minutes}min se não revertido.`,
        delivered_to: channels,
      })
      results.push({ client_id: rule.client_id, action: 'notified' })
    } else {
      results.push({ client_id: rule.client_id, action: 'skipped', reason: 'awaiting_grace' })
    }
  }

  return res.status(200).json({
    ok: true,
    ran_at: now.toISOString(),
    processed: (rules ?? []).length,
    results,
  })
}
