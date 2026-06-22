import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

type RawRecord = {
  id: string
  client_slug: string
  run_id: string
  source: string
  entity: string
  external_id: string | null
  occurred_at: string | null
  payload: Record<string, unknown>
}

function applyHeaders(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
}

function requireSyncAuth(req: VercelRequest, res: VercelResponse): boolean {
  const header = String(req.headers.authorization || '')
  const allowed = [process.env.MOAI_SYNC_SECRET, process.env.CRON_SECRET]
    .filter(Boolean)
    .map((secret) => `Bearer ${secret}`)

  if (allowed.length === 0) {
    res.status(500).json({ ok: false, error: 'MOAI_SYNC_SECRET or CRON_SECRET not configured' })
    return false
  }

  if (!allowed.includes(header)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return false
  }

  return true
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Supabase env missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberish(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return 0
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function dateish(value: unknown) {
  const raw = text(value)
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function normalizeContactKey(email: string | null, phone: string | null, fallback: string | null) {
  if (email) return `email:${email.toLowerCase()}`
  if (phone) return `phone:${phone.replace(/\D/g, '')}`
  return fallback ? `name:${fallback.toLowerCase()}` : null
}

function normalizeMaiaMember(record: RawRecord) {
  const payload = record.payload
  const email = text(payload.email ?? payload['E-mail'])
  const phone = text(payload.phone ?? payload.Telefone)
  const name = text(payload.name ?? payload.Nome)
  const externalId = text(payload.external_id) || email || phone || record.external_id || record.id

  return {
    client_slug: record.client_slug,
    source: 'maia',
    source_external_id: externalId,
    contact_key: normalizeContactKey(email, phone, name),
    name,
    journey: text(payload.journey ?? payload.Jornada),
    company: text(payload.company ?? payload.Empresa),
    sector: text(payload.sector ?? payload.Setor),
    category: text(payload.category ?? payload.Categoria),
    email,
    phone,
    checkins: Math.trunc(numberish(payload.checkins ?? payload['Check-ins'])),
    registrations: Math.trunc(numberish(payload.registrations ?? payload['Inscrições'] ?? payload.Inscricoes)),
    tags: text(payload.tags ?? payload.Tags),
    raw_payload: payload,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function getActionValue(payload: Record<string, unknown>, keys: string[]) {
  const actions = Array.isArray(payload.actions) ? payload.actions : []
  for (const action of actions) {
    if (!action || typeof action !== 'object') continue
    const typed = action as Record<string, unknown>
    const actionType = String(typed.action_type || typed.type || '').toLowerCase()
    if (keys.some((key) => actionType.includes(key))) return numberish(typed.value)
  }
  return 0
}

function normalizePaidMedia(record: RawRecord) {
  const payload = record.payload
  const metricDate = dateish(payload.date_start ?? payload.date ?? payload.segments_date ?? record.occurred_at)
  if (!metricDate) return null

  const campaignId = text(payload.campaign_id ?? payload.campaignId)
  const adsetId = text(payload.adset_id ?? payload.ad_group_id ?? payload.adsetId ?? payload.adGroupId)
  const adId = text(payload.ad_id ?? payload.adId)
  const dedupeKey = [campaignId || 'campaign', adsetId || 'adset', adId || 'ad'].join('|')
  const spend = payload.spend !== undefined ? numberish(payload.spend) : numberish(payload.cost_micros) / 1000000

  return {
    client_slug: record.client_slug,
    source: record.source,
    metric_date: metricDate,
    account_id: text(payload.account_id ?? payload.customer_id ?? payload.ad_account_id),
    campaign_id: campaignId,
    campaign_name: text(payload.campaign_name ?? payload.campaignName),
    adset_id: adsetId,
    adset_name: text(payload.adset_name ?? payload.ad_group_name ?? payload.adsetName ?? payload.adGroupName),
    ad_id: adId,
    ad_name: text(payload.ad_name ?? payload.adName),
    dedupe_key: dedupeKey,
    spend,
    impressions: Math.trunc(numberish(payload.impressions)),
    clicks: Math.trunc(numberish(payload.clicks ?? payload.inline_link_clicks)),
    leads: numberish(payload.leads ?? payload.conversions ?? getActionValue(payload, ['lead', 'complete_registration'])),
    purchases: numberish(payload.purchases ?? getActionValue(payload, ['purchase'])),
    revenue: numberish(payload.revenue ?? payload.purchase_roas ?? payload.conversions_value),
    raw_payload: payload,
    updated_at: new Date().toISOString(),
  }
}

async function chunkedUpsert<T extends Record<string, unknown>>(
  sb: ReturnType<typeof supabaseAdmin>,
  table: string,
  rows: T[],
  onConflict: string,
) {
  let written = 0
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const { error } = await sb.from(table).upsert(batch, { onConflict })
    if (error) throw error
    written += batch.length
  }
  return written
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyHeaders(res)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method not allowed' })
  if (!requireSyncAuth(req, res)) return

  const body = req.body as {
    run_id?: string
    client_slug?: string
    source?: string
    entity?: string
    limit?: number
  }

  const sb = supabaseAdmin()
  const clientSlug = body.client_slug || 'moai'
  const limit = Math.min(Math.max(Number(body.limit || 5000), 1), 20000)

  try {
    let query = sb
      .from('moai_raw_records')
      .select('id, client_slug, run_id, source, entity, external_id, occurred_at, payload')
      .eq('client_slug', clientSlug)
      .order('imported_at', { ascending: false })
      .limit(limit)

    if (body.run_id) query = query.eq('run_id', body.run_id)
    if (body.source) query = query.eq('source', body.source)
    if (body.entity) query = query.eq('entity', body.entity)

    const { data, error } = await query
    if (error) throw error

    const rawRecords = (data || []) as RawRecord[]
    const maiaRows = rawRecords
      .filter((record) => record.source === 'maia' && ['clients', 'members'].includes(record.entity))
      .map(normalizeMaiaMember)

    const mediaRows = rawRecords
      .filter((record) => ['meta_ads', 'google_ads'].includes(record.source))
      .map(normalizePaidMedia)
      .filter(Boolean) as Array<ReturnType<typeof normalizePaidMedia> & Record<string, unknown>>

    const membersWritten = maiaRows.length
      ? await chunkedUpsert(sb, 'moai_member_profiles', maiaRows, 'client_slug,source,source_external_id')
      : 0

    const mediaWritten = mediaRows.length
      ? await chunkedUpsert(sb, 'moai_paid_media_daily', mediaRows, 'client_slug,source,metric_date,dedupe_key')
      : 0

    const warnings = []
    if (!maiaRows.length) warnings.push('No Maia clients/members records found in selected raw scope')
    if (!mediaRows.length) warnings.push('No Meta/Google paid media records found in selected raw scope')

    await sb.from('moai_report_snapshots').upsert(
      {
        client_slug: clientSlug,
        snapshot_key: 'report_readiness',
        snapshot_date: new Date().toISOString().slice(0, 10),
        metrics: {
          raw_records: rawRecords.length,
          members_written: membersWritten,
          paid_media_written: mediaWritten,
          run_id: body.run_id || null,
          source: body.source || null,
        },
        warnings,
      },
      { onConflict: 'client_slug,snapshot_key,snapshot_date' },
    )

    return res.status(200).json({
      ok: true,
      raw_records: rawRecords.length,
      members_written: membersWritten,
      paid_media_written: mediaWritten,
      warnings,
    })
  } catch (error) {
    console.error('[moai-refresh-mart] error', error)
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
