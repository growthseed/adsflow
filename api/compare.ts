/**
 * GET /api/compare — Comparador multi-cliente (Handoff V2 spec #1)
 *
 * Query:
 *   clients  = comma-separated client IDs ou slugs (se omitido, usa
 *              todos os clientes que o usuário tem acesso)
 *   metrics  = comma-separated de {leads,spend,cpl,roas,ctr,cpm}
 *              (default: leads,spend,cpl,roas)
 *   period   = last_30d | current_month | last_quarter | last_year
 *              (default: last_30d)
 *   currency = BRL (default)
 *
 * Resposta:
 *   {
 *     clients: [{ id, slug, name, avatarUrl, industry }],
 *     metrics: [{
 *       key, label, betterIs: 'higher'|'lower', unit, values: [
 *         { clientId, value, delta, rank }
 *       ]
 *     }],
 *     meta: { period, currency, generatedAt }
 *   }
 *
 * Segurança: requer JWT válido. Cada cliente é filtrado por tenant_id
 * via RLS do Supabase (service role faz a query, mas escopa ao user).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  allowMethods,
  applyCors,
  requireUserAuth,
} from './_lib/security.js'

type BetterIs = 'higher' | 'lower'
type MetricUnit = 'currency' | 'count' | 'percent' | 'ratio'

interface CompareMetricDef {
  key: string
  label: string
  betterIs: BetterIs
  unit: MetricUnit
}

const AVAILABLE: Record<string, CompareMetricDef> = {
  leads: { key: 'leads', label: 'Leads', betterIs: 'higher', unit: 'count' },
  spend: { key: 'spend', label: 'Investido', betterIs: 'lower', unit: 'currency' },
  cpl:   { key: 'cpl',   label: 'CPL',      betterIs: 'lower', unit: 'currency' },
  roas:  { key: 'roas',  label: 'ROAS',     betterIs: 'higher', unit: 'ratio' },
  ctr:   { key: 'ctr',   label: 'CTR',      betterIs: 'higher', unit: 'percent' },
  cpm:   { key: 'cpm',   label: 'CPM',      betterIs: 'lower', unit: 'currency' },
}

function parseMetrics(raw: string | undefined): CompareMetricDef[] {
  const keys = (raw ?? 'leads,spend,cpl,roas').split(',').map((s) => s.trim()).filter(Boolean)
  return keys.map((k) => AVAILABLE[k]).filter((m): m is CompareMetricDef => !!m)
}

function rankValues(values: Array<{ clientId: string; value: number | null }>, betterIs: BetterIs) {
  const present = values.filter((v) => v.value != null) as Array<{
    clientId: string
    value: number
  }>
  present.sort((a, b) => (betterIs === 'higher' ? b.value - a.value : a.value - b.value))
  const rankMap = new Map<string, number>()
  present.forEach((v, i) => rankMap.set(v.clientId, i + 1))
  return values.map((v) => ({ ...v, rank: rankMap.get(v.clientId) ?? null }))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['GET'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const { clients: rawClients, metrics: rawMetrics, period = 'last_30d', currency = 'BRL' } =
    req.query as Record<string, string | undefined>

  const metricDefs = parseMetrics(rawMetrics)
  if (metricDefs.length === 0) {
    return res.status(400).json({ error: 'No valid metrics requested' })
  }

  const wantedIds = rawClients
    ? rawClients.split(',').map((s) => s.trim()).filter(Boolean)
    : null

  // TODO Sprint 5: substituir por query RLS-scoped no Supabase
  // (agency_snapshots + performance_snapshots) assim que o schema
  // consolidado estiver pronto. Por ora retornamos um envelope vazio
  // tipado corretamente — o frontend já consome os dados locais via
  // useComparadorData() e esse endpoint serve como contrato estável.
  const clients: Array<{
    id: string
    slug: string
    name: string
    avatarUrl: string | null
    industry: string | null
    isNew: boolean
  }> = []

  const metrics = metricDefs.map((m) => {
    const values = clients.map((c) => ({ clientId: c.id, value: null as number | null, delta: null as number | null }))
    return { ...m, values: rankValues(values, m.betterIs) }
  })

  return res.status(200).json({
    clients,
    metrics,
    meta: {
      period,
      currency,
      generatedAt: new Date().toISOString(),
      requestedClientIds: wantedIds,
      userId: auth.user.id,
    },
  })
}
