/**
 * GET /api/integrations?op=clint-funnel&client_slug=<slug>
 *
 * Pagina TODOS os deals da Clint (OPEN/WON/LOST) e agrega tudo que as
 * páginas BI (Funil/Tempo/Perdas) inspiradas no Power BI precisam:
 *   - counts: open/won/lost/total
 *   - byStage: { name, total, open, won, lost }[]
 *   - byMonth: { ym, leads, won, lost, open }[]
 *   - byUser:  { id, name, total, won, lost, open, avg_days_to_win }[]
 *   - byOrigin: { id, total, won, lost }[]
 *   - byLossReason: { id, count }[]
 *   - cohort: { entry_ym, close_ym, won, leads, rate }[] (mês entrada × mês fechamento)
 *   - value: { won_total, won_avg, currency }
 *   - timing: { avg/median days to win }
 *
 * Cache in-memory por slug × 5 min — evita repaginar a cada navegação.
 * Token vem hoje de env CLINT_API_TOKEN_<SLUG_UPPER>.
 *
 * Concurrency: pool de 5 paralelas. ~95 páginas × 200ms ≈ 4s no pior caso.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { allowMethods, applyCors, requireUserAuth } from '../../../api/_lib/security.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const CLINT_BASE = 'https://api.clint.digital/v1'
const PAGE_SIZE = 100
const CACHE_TTL_MS = 5 * 60 * 1000
const CONCURRENCY = 5

interface ClintContact {
  id: string
  name?: string
  email?: string
  phone?: string
}

interface ClintDeal {
  id: string
  status: 'OPEN' | 'WON' | 'LOST'
  value: number
  currency: string
  created_at: string
  updated_stage_at?: string | null
  won_at: string | null
  lost_at: string | null
  stage?: string
  stage_id?: string
  origin_id?: string | null
  user?: { id: string; name?: string } | null
  lost_status_id?: string | null
  contact?: ClintContact
}

interface ClintListResponse {
  status: number
  totalCount: number
  page: number
  totalPages: number
  hasNext: boolean
  data: ClintDeal[]
}

interface CohortMaturityRow {
  entry_ym: string
  age_month: number
  cohort_size: number
  won_cumulative: number
  lost_cumulative: number
  open_remaining: number
  revenue_cumulative: number
  won_rate_pct: number
  closed_rate_pct: number
  opportunity_win_rate_pct: number
  avg_days_to_win: number | null
}

interface AggResult {
  counts: { open: number; won: number; lost: number; total: number }
  conversion: { won_rate: number; won_rate_opportunities: number }
  value: { won_total: number; won_avg: number; currency: string }
  timing: { avg_days_to_win: number; median_days_to_win: number | null }
  byStage: Array<{ stage: string; stage_id: string | null; total: number; open: number; won: number; lost: number }>
  byMonth: Array<{ ym: string; leads: number; won: number; lost: number; open: number; revenue_won: number }>
  byUser: Array<{ id: string; name: string; total: number; won: number; lost: number; open: number; avg_days_to_win: number | null }>
  byOrigin: Array<{ id: string; total: number; won: number; lost: number }>
  byLossReason: Array<{ id: string; count: number }>
  cohort: Array<{ entry_ym: string; close_ym: string; leads: number; won: number; rate: number }>
  cohort_maturity: CohortMaturityRow[]
  fetched_at: string
}

// ---- Cache em memória (process-level) ----
const cache = new Map<string, { ts: number; payload: AggResult }>()

function resolveClintToken(slug: string): string | null {
  const slugKey = slug.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase()
  return (
    process.env[`CLINT_API_TOKEN_${slugKey}`] ||
    process.env.CLINT_API_TOKEN ||
    null
  )
}

async function clintFetch<T>(path: string, token: string): Promise<T> {
  const r = await fetch(`${CLINT_BASE}${path}`, {
    headers: { 'api-token': token, accept: 'application/json' },
  })
  if (!r.ok) throw new Error(`Clint ${path} → ${r.status}`)
  return (await r.json()) as T
}

async function fetchPageRange(
  pages: number[],
  token: string,
  status?: 'OPEN' | 'WON' | 'LOST',
): Promise<ClintDeal[]> {
  const results: ClintDeal[] = []
  // Pool simples: chunk de CONCURRENCY paralelas
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const slice = pages.slice(i, i + CONCURRENCY)
    const responses = await Promise.all(
      slice.map((p) => {
        const q = `?limit=${PAGE_SIZE}&page=${p}${status ? `&status=${status}` : ''}`
        return clintFetch<ClintListResponse>(`/deals${q}`, token)
      }),
    )
    for (const r of responses) results.push(...r.data)
  }
  return results
}

async function fetchAllByStatus(
  status: 'OPEN' | 'WON' | 'LOST',
  token: string,
  pageCap?: number,
): Promise<{ deals: ClintDeal[]; totalCount: number }> {
  const first = await clintFetch<ClintListResponse>(
    `/deals?limit=${PAGE_SIZE}&page=1&status=${status}`,
    token,
  )
  const totalPages = Math.ceil(first.totalCount / PAGE_SIZE)
  const cap = pageCap ? Math.min(totalPages, pageCap) : totalPages
  const remaining = Array.from({ length: cap - 1 }, (_, i) => i + 2)
  const rest = await fetchPageRange(remaining, token, status)
  return { deals: [...first.data, ...rest], totalCount: first.totalCount }
}

function ym(iso: string | null | undefined): string | null {
  if (!iso) return null
  return iso.slice(0, 7) // YYYY-MM
}

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000
}

function isValidDate(value: string | null | undefined): value is string {
  return Boolean(value && Number.isFinite(new Date(value).getTime()))
}

function monthDiff(fromYm: string, toYm: string): number {
  const [fromYear, fromMonth] = fromYm.split('-').map(Number)
  const [toYear, toMonth] = toYm.split('-').map(Number)
  return (toYear - fromYear) * 12 + (toMonth - fromMonth)
}

function cohortBoundary(entryYm: string, age: number): Date {
  const [year, month] = entryYm.split('-').map(Number)
  return new Date(Date.UTC(year, month + age, 0, 23, 59, 59, 999))
}

function aggregate(open: ClintDeal[], won: ClintDeal[], lost: ClintDeal[], openTotal: number): AggResult {
  const total = openTotal + won.length + lost.length
  const opportunities = won.length + lost.length

  // ---- Value (WON) ----
  const wonTotal = won.reduce((s, d) => s + (Number(d.value) || 0), 0)
  const wonAvg = won.length > 0 ? wonTotal / won.length : 0

  // ---- Timing (WON) ----
  const days = won
    .filter((d) => d.won_at && d.created_at)
    .map((d) => daysBetween(d.created_at, d.won_at as string))
    .filter((n) => Number.isFinite(n) && n >= 0)
  const avgDays = days.length > 0 ? days.reduce((s, n) => s + n, 0) / days.length : 0
  const sorted = [...days].sort((a, b) => a - b)
  const medianDays =
    sorted.length === 0
      ? null
      : sorted.length % 2 === 1
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2

  // ---- byStage ----
  const stageMap = new Map<string, { stage: string; stage_id: string | null; open: number; won: number; lost: number }>()
  const bumpStage = (d: ClintDeal, kind: 'open' | 'won' | 'lost') => {
    const key = d.stage_id || d.stage || 'sem-estagio'
    const row = stageMap.get(key) ?? {
      stage: d.stage || '(sem estágio)',
      stage_id: d.stage_id ?? null,
      open: 0,
      won: 0,
      lost: 0,
    }
    row[kind] += 1
    stageMap.set(key, row)
  }
  for (const d of open) bumpStage(d, 'open')
  for (const d of won) bumpStage(d, 'won')
  for (const d of lost) bumpStage(d, 'lost')
  const byStage = Array.from(stageMap.values())
    .map((s) => ({ ...s, total: s.open + s.won + s.lost }))
    .sort((a, b) => b.total - a.total)

  // ---- byMonth (created_at = leads, won_at = won, lost_at = lost) ----
  const monthMap = new Map<string, { ym: string; leads: number; won: number; lost: number; open: number; revenue_won: number }>()
  const ensureMonth = (key: string) => {
    let row = monthMap.get(key)
    if (!row) {
      row = { ym: key, leads: 0, won: 0, lost: 0, open: 0, revenue_won: 0 }
      monthMap.set(key, row)
    }
    return row
  }
  for (const d of [...open, ...won, ...lost]) {
    const e = ym(d.created_at)
    if (e) ensureMonth(e).leads += 1
  }
  for (const d of won) {
    const w = ym(d.won_at)
    if (w) {
      const row = ensureMonth(w)
      row.won += 1
      row.revenue_won += Number(d.value) || 0
    }
  }
  for (const d of lost) {
    const l = ym(d.lost_at)
    if (l) ensureMonth(l).lost += 1
  }
  for (const d of open) {
    const c = ym(d.created_at)
    if (c) ensureMonth(c).open += 1
  }
  const byMonth = Array.from(monthMap.values()).sort((a, b) => a.ym.localeCompare(b.ym))

  // ---- byUser (responsável) ----
  const userMap = new Map<string, { id: string; name: string; open: number; won: number; lost: number; daysSum: number; daysCount: number }>()
  const bumpUser = (d: ClintDeal, kind: 'open' | 'won' | 'lost') => {
    const id = d.user?.id ?? '__sem_responsavel__'
    const name = d.user?.name ?? '(Sem responsável)'
    const row = userMap.get(id) ?? { id, name, open: 0, won: 0, lost: 0, daysSum: 0, daysCount: 0 }
    row[kind] += 1
    if (kind === 'won' && d.won_at && d.created_at) {
      const dd = daysBetween(d.created_at, d.won_at)
      if (Number.isFinite(dd) && dd >= 0) {
        row.daysSum += dd
        row.daysCount += 1
      }
    }
    userMap.set(id, row)
  }
  for (const d of open) bumpUser(d, 'open')
  for (const d of won) bumpUser(d, 'won')
  for (const d of lost) bumpUser(d, 'lost')
  const byUser = Array.from(userMap.values())
    .map((u) => ({
      id: u.id,
      name: u.name,
      total: u.open + u.won + u.lost,
      open: u.open,
      won: u.won,
      lost: u.lost,
      avg_days_to_win: u.daysCount > 0 ? Number((u.daysSum / u.daysCount).toFixed(1)) : null,
    }))
    .sort((a, b) => b.total - a.total)

  // ---- byOrigin ----
  const originMap = new Map<string, { id: string; open: number; won: number; lost: number }>()
  const bumpOrigin = (d: ClintDeal, kind: 'open' | 'won' | 'lost') => {
    const id = d.origin_id ?? '__sem_origem__'
    const row = originMap.get(id) ?? { id, open: 0, won: 0, lost: 0 }
    row[kind] += 1
    originMap.set(id, row)
  }
  for (const d of open) bumpOrigin(d, 'open')
  for (const d of won) bumpOrigin(d, 'won')
  for (const d of lost) bumpOrigin(d, 'lost')
  const byOrigin = Array.from(originMap.values())
    .map((o) => ({ id: o.id, total: o.open + o.won + o.lost, won: o.won, lost: o.lost }))
    .sort((a, b) => b.lost - a.lost)

  // ---- byLossReason (apenas LOST) ----
  const lossMap = new Map<string, number>()
  for (const d of lost) {
    const k = d.lost_status_id ?? '__sem_motivo__'
    lossMap.set(k, (lossMap.get(k) ?? 0) + 1)
  }
  const byLossReason = Array.from(lossMap.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)

  // ---- Cohort clássico (entrada × fechamento), mantido por compatibilidade ----
  const allDeals = [...open, ...won, ...lost]
  const cohortMap = new Map<string, { entry_ym: string; close_ym: string; leads: number; won: number }>()
  const entriesByMonth = new Map<string, number>()
  for (const d of allDeals) {
    const entry = ym(d.created_at)
    if (entry) entriesByMonth.set(entry, (entriesByMonth.get(entry) ?? 0) + 1)
  }
  for (const d of won) {
    const entry = ym(d.created_at)
    const close = ym(d.won_at)
    if (!entry || !close) continue
    const key = `${entry}|${close}`
    const row = cohortMap.get(key) ?? { entry_ym: entry, close_ym: close, leads: entriesByMonth.get(entry) ?? 0, won: 0 }
    row.won += 1
    cohortMap.set(key, row)
  }
  const cohort = Array.from(cohortMap.values())
    .map((row) => ({ ...row, rate: row.leads > 0 ? Number((row.won / row.leads).toFixed(4)) : 0 }))
    .sort((a, b) => a.entry_ym.localeCompare(b.entry_ym) || a.close_ym.localeCompare(b.close_ym))

  // ---- Cohort de maturação (safra × idade M+0...M+12) ----
  // Cada célula é cumulativa e usa a safra inteira como denominador.
  const now = new Date()
  const cohorts = new Map<string, ClintDeal[]>()
  for (const deal of allDeals) {
    const entry = ym(deal.created_at)
    if (!entry || !isValidDate(deal.created_at)) continue
    const list = cohorts.get(entry) ?? []
    list.push(deal)
    cohorts.set(entry, list)
  }
  const cohortMaturity: CohortMaturityRow[] = []
  for (const [entry, deals] of [...cohorts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const availableAge = Math.max(0, Math.min(12, monthDiff(entry, ym(now.toISOString()) as string)))
    for (let age = 0; age <= availableAge; age += 1) {
      const boundary = cohortBoundary(entry, age)
      const wonDeals = deals.filter((deal) => deal.won_at && new Date(deal.won_at) <= boundary)
      const lostDeals = deals.filter((deal) => deal.lost_at && new Date(deal.lost_at) <= boundary)
      const closed = wonDeals.length + lostDeals.length
      const revenue = wonDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0)
      const winDays = wonDeals
        .filter((deal) => deal.won_at)
        .map((deal) => daysBetween(deal.created_at, deal.won_at as string))
        .filter((value) => Number.isFinite(value) && value >= 0)
      cohortMaturity.push({
        entry_ym: entry,
        age_month: age,
        cohort_size: deals.length,
        won_cumulative: wonDeals.length,
        lost_cumulative: lostDeals.length,
        open_remaining: Math.max(0, deals.length - closed),
        revenue_cumulative: Number(revenue.toFixed(2)),
        won_rate_pct: deals.length ? Number(((wonDeals.length / deals.length) * 100).toFixed(2)) : 0,
        closed_rate_pct: deals.length ? Number(((closed / deals.length) * 100).toFixed(2)) : 0,
        opportunity_win_rate_pct: closed ? Number(((wonDeals.length / closed) * 100).toFixed(2)) : 0,
        avg_days_to_win: winDays.length ? Number((winDays.reduce((sum, value) => sum + value, 0) / winDays.length).toFixed(1)) : null,
      })
    }
  }

  return {
    counts: {
      open: openTotal,
      won: won.length,
      lost: lost.length,
      total,
    },
    conversion: {
      won_rate: total > 0 ? Number((won.length / total).toFixed(4)) : 0,
      won_rate_opportunities: opportunities > 0 ? Number((won.length / opportunities).toFixed(4)) : 0,
    },
    value: {
      won_total: Number(wonTotal.toFixed(2)),
      won_avg: Number(wonAvg.toFixed(2)),
      currency: 'BRL',
    },
    timing: {
      avg_days_to_win: Number(avgDays.toFixed(1)),
      median_days_to_win: medianDays !== null ? Number(medianDays.toFixed(1)) : null,
    },
    byStage,
    byMonth,
    byUser,
    byOrigin,
    byLossReason,
    cohort,
    cohort_maturity: cohortMaturity,
    fetched_at: new Date().toISOString(),
  }
}

export async function runClintFunnel(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['GET'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const slug = String(req.query.client_slug || '').trim()
  if (!slug) return res.status(400).json({ error: 'client_slug required' })

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: client } = await svc
    .from('clients')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle()
  if (!client) return res.status(404).json({ error: 'client not found' })

  const clientId = (client as { id: string }).id
  const { data: member } = await svc
    .from('client_members')
    .select('user_id')
    .eq('client_id', clientId)
    .eq('user_id', auth.user.id)
    .maybeSingle()
  const isSuperAdmin = auth.globalRole === 'super_admin' || auth.globalRole === 'admin'
  if (!member && !isSuperAdmin) return res.status(403).json({ error: 'forbidden' })

  const token = resolveClintToken(slug)
  if (!token) {
    return res.status(501).json({
      note: `Token Clint não configurado para ${slug}. Defina CLINT_API_TOKEN_${slug.toUpperCase()} no .env.local.`,
    })
  }

  // Cache hit?
  const cached = cache.get(slug)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return res.status(200).json({ client_slug: slug, provider: 'clint', cached: true, ...cached.payload })
  }

  try {
    // Todos os status completos: cohort e taxas não podem usar amostra no denominador
    // WON/LOST: completos pra valor/tempo/responsável
    const [openRes, wonRes, lostRes] = await Promise.all([
      fetchAllByStatus('OPEN', token),
      fetchAllByStatus('WON', token),
      fetchAllByStatus('LOST', token),
    ])

    const payload = aggregate(openRes.deals, wonRes.deals, lostRes.deals, openRes.totalCount)
    cache.set(slug, { ts: Date.now(), payload })

    return res.status(200).json({ client_slug: slug, provider: 'clint', cached: false, ...payload })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(502).json({ error: 'clint fetch failed', detail: msg })
  }
}
