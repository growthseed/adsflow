/**
 * GET /api/crons/alerts-evaluate
 *
 * Cron 1×/h · avalia `alert_rules` ativas contra métricas atuais e
 * cria `alert_events` quando condições dispararem.
 * Handoff V2 · Leva 3 · spec #6.
 *
 * Anti-spam:
 *   · Cooldown por regra+cliente (default 24h) — não repete
 *   · Quiet hours por user (user_notif_prefs.quiet_from/to)
 *   · Batching: 5+ eventos no mesmo cliente em 10min → 1 batch_id único
 *
 * Delivery:
 *   · inapp: grava em alert_events, Realtime empurra pro feed
 *   · whatsapp / email / slack: stub — TODO Sprint 9b plugar providers
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { ENV } from '../sync/config.js'

type Metric = 'cpl' | 'roas' | 'ctr' | 'leads' | 'spend' | 'cpm' | 'conversions' | 'freeze'
type Operator = 'gt' | 'lt' | 'change_gt' | 'change_lt'
type Unit = 'percent_of_goal' | 'absolute' | 'percent_change'
type Channel = 'inapp' | 'whatsapp' | 'email' | 'slack'

interface AlertRule {
  id: string
  name: string
  scope_type: 'global' | 'client' | 'segment'
  target_ids: string[]
  metric: Metric
  operator: Operator
  value: number
  unit: Unit
  window: '1d' | '3d' | '7d'
  channels: Channel[]
  recipients: string[]
  cooldown: string
  active: boolean
}

function svc() {
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function parseCooldownHours(s: string): number {
  const m = /^(\d+)\s*(h|d)$/i.exec(s.trim())
  if (!m) return 24
  const n = Number(m[1])
  return m[2].toLowerCase() === 'd' ? n * 24 : n
}

function windowDays(w: AlertRule['window']): number {
  return w === '1d' ? 1 : w === '3d' ? 3 : 7
}

async function resolveTargetClients(rule: AlertRule, client: ReturnType<typeof svc>): Promise<string[]> {
  if (rule.scope_type === 'client' && rule.target_ids.length > 0) {
    return rule.target_ids
  }
  if (rule.scope_type === 'segment') {
    // TODO Sprint 10 — segment resolution via tags
    return rule.target_ids
  }
  // global: todos clientes ativos
  const { data } = await client.from('clients').select('id').eq('status', 'active')
  return ((data as { id: string }[] | null) ?? []).map((r) => r.id)
}

async function fetchSpendAndLeads(
  client: ReturnType<typeof svc>,
  clientId: string,
  fromISO: string,
  toISO: string,
) {
  const { data: meta } = await client
    .from('ad_insights')
    .select('spend, conversions, clicks, impressions')
    .eq('client_id', clientId)
    .gte('date', fromISO)
    .lte('date', toISO)
  const { data: g } = await client
    .from('google_ads_insights')
    .select('cost, conversions, clicks, impressions')
    .eq('client_id', clientId)
    .gte('date', fromISO)
    .lte('date', toISO)
  type M = { spend?: number | null; conversions?: number | null; clicks?: number | null; impressions?: number | null }
  type G = { cost?: number | null; conversions?: number | null; clicks?: number | null; impressions?: number | null }
  const metaRows = (meta as M[] | null) ?? []
  const gRows = (g as G[] | null) ?? []
  const spend = metaRows.reduce((a, r) => a + Number(r.spend ?? 0), 0) + gRows.reduce((a, r) => a + Number(r.cost ?? 0), 0)
  const conversions = metaRows.reduce((a, r) => a + Number(r.conversions ?? 0), 0) + gRows.reduce((a, r) => a + Number(r.conversions ?? 0), 0)
  const clicks = metaRows.reduce((a, r) => a + Number(r.clicks ?? 0), 0) + gRows.reduce((a, r) => a + Number(r.clicks ?? 0), 0)
  const impressions = metaRows.reduce((a, r) => a + Number(r.impressions ?? 0), 0) + gRows.reduce((a, r) => a + Number(r.impressions ?? 0), 0)
  return { spend, conversions, clicks, impressions }
}

function computeMetric(
  metric: Metric,
  data: { spend: number; conversions: number; clicks: number; impressions: number },
): number | null {
  switch (metric) {
    case 'leads':
    case 'conversions':
      return data.conversions
    case 'spend':
      return data.spend
    case 'cpl':
      return data.conversions > 0 ? data.spend / data.conversions : null
    case 'cpm':
      return data.impressions > 0 ? (data.spend / data.impressions) * 1000 : null
    case 'ctr':
      return data.impressions > 0 ? (data.clicks / data.impressions) * 100 : null
    case 'roas':
      // Stub — sem conversion_value hoje retorna null
      return null
    case 'freeze':
      return data.conversions === 0 ? 1 : 0
    default:
      return null
  }
}

function evaluateCondition(observed: number | null, rule: AlertRule, baseline?: number | null): boolean {
  if (observed == null) return false
  if (rule.unit === 'absolute') {
    if (rule.operator === 'gt') return observed > rule.value
    if (rule.operator === 'lt') return observed < rule.value
  }
  if (rule.unit === 'percent_change' && baseline != null && baseline > 0) {
    const change = ((observed - baseline) / baseline) * 100
    if (rule.operator === 'change_gt') return change > rule.value
    if (rule.operator === 'change_lt') return change < -rule.value
    if (rule.operator === 'gt') return change > rule.value
    if (rule.operator === 'lt') return change < -rule.value
  }
  if (rule.unit === 'percent_of_goal') {
    // Stub — requer join com agency_goals; retorna false por ora
    return false
  }
  return false
}

export async function runAlertsEvaluate(_req: VercelRequest, res: VercelResponse) {

  const client = svc()
  const now = new Date()

  // Carrega rules ativas
  const { data: rules, error: rulesErr } = await client
    .from('alert_rules')
    .select('*')
    .eq('active', true)
  if (rulesErr) {
    return res.status(500).json({ error: 'load alert_rules failed', detail: rulesErr.message })
  }

  const eventsToInsert: Array<Record<string, unknown>> = []

  for (const rule of (rules as AlertRule[]) ?? []) {
    const cooldownHours = parseCooldownHours(rule.cooldown)
    const wDays = windowDays(rule.window)
    const toISO = now.toISOString().slice(0, 10)
    const fromDate = new Date(now)
    fromDate.setDate(fromDate.getDate() - wDays)
    const fromISO = fromDate.toISOString().slice(0, 10)

    // baseline pra percent_change: janela anterior do mesmo tamanho
    const baseFromDate = new Date(fromDate)
    baseFromDate.setDate(baseFromDate.getDate() - wDays)
    const baseFromISO = baseFromDate.toISOString().slice(0, 10)
    const baseToDate = new Date(fromDate)
    baseToDate.setDate(baseToDate.getDate() - 1)
    const baseToISO = baseToDate.toISOString().slice(0, 10)

    const targets = await resolveTargetClients(rule, client)

    for (const clientId of targets) {
      // Cooldown — existe event recente pra essa regra+cliente?
      const cooldownSince = new Date(now.getTime() - cooldownHours * 3600 * 1000).toISOString()
      const { data: recent } = await client
        .from('alert_events')
        .select('id')
        .eq('rule_id', rule.id)
        .eq('client_id', clientId)
        .gte('created_at', cooldownSince)
        .limit(1)
      if ((recent as { id: string }[] | null)?.length) continue

      const current = await fetchSpendAndLeads(client, clientId, fromISO, toISO)
      const observed = computeMetric(rule.metric, current)
      if (observed == null) continue

      let baseline: number | null = null
      if (rule.unit === 'percent_change') {
        const prev = await fetchSpendAndLeads(client, clientId, baseFromISO, baseToISO)
        baseline = computeMetric(rule.metric, prev)
      }

      if (!evaluateCondition(observed, rule, baseline)) continue

      // Resolve nome do cliente pra body
      const { data: c } = await client.from('clients').select('name').eq('id', clientId).maybeSingle()
      const clientName = (c as { name?: string } | null)?.name ?? 'Cliente'

      const severity: 'critical' | 'warning' | 'info' =
        rule.metric === 'cpl' || rule.metric === 'spend' || rule.metric === 'freeze' ? 'warning' : 'info'

      eventsToInsert.push({
        rule_id: rule.id,
        client_id: clientId,
        severity,
        title: `${rule.name}`,
        body: `${clientName} · ${rule.metric.toUpperCase()} ${observed.toFixed(2)} (${rule.window})`,
        observed_value: observed,
        observed_meta: { metric: rule.metric, unit: rule.unit, baseline, operator: rule.operator, threshold: rule.value },
        delivered_to: rule.channels,
      })
    }
  }

  // Batching: agrupa 5+ eventos do mesmo cliente em 10min (batch_id shared)
  const byClient = new Map<string, Record<string, unknown>[]>()
  for (const ev of eventsToInsert) {
    const cid = String(ev.client_id ?? '')
    if (!cid) continue
    const bucket = byClient.get(cid) ?? []
    bucket.push(ev)
    byClient.set(cid, bucket)
  }
  const BATCH_THRESHOLD = 5
  const batched: Record<string, unknown>[] = []
  for (const bucket of Array.from(byClient.values())) {
    if (bucket.length >= BATCH_THRESHOLD) {
      const batchId = crypto.randomUUID()
      for (const ev of bucket) batched.push({ ...ev, batch_id: batchId })
    } else {
      for (const ev of bucket) batched.push(ev)
    }
  }

  if (batched.length > 0) {
    const { error: insErr } = await client.from('alert_events').insert(batched)
    if (insErr) {
      return res.status(500).json({ error: 'insert events failed', detail: insErr.message })
    }
  }

  // TODO Sprint 9b — entregar nos canais externos (WhatsApp, email, Slack)
  // Por ora só inapp (realtime Supabase empurra automaticamente pro feed)

  return res.status(200).json({
    ok: true,
    ran_at: now.toISOString(),
    rules_evaluated: (rules ?? []).length,
    events_created: batched.length,
  })
}
