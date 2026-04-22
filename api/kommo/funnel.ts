/**
 * GET /api/kommo/funnel?client_slug=<slug>
 *
 * Resolve integração Kommo do cliente → puxa pipeline + leads via API
 * Kommo → agrupa por stage + classifica MQL/SQL via heurística de nome
 * (configurável via `client_integrations.metadata.crm_stage_map`).
 *
 * Resposta:
 *   { pipelineName, totalLeads, stages: [{name, count, kind}], mqlCount, sqlCount, wonCount, conversionRatePct, avgDaysToWin }
 *
 * Auth: JWT Supabase (valida membership do cliente).
 * Requer integração Kommo em client_integrations:
 *   provider='kommo', external_workspace_id=<subdomain>, access_token=<long-lived>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { allowMethods, applyCors, requireUserAuth } from '../_lib/security'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

interface KommoStage {
  id: number
  name: string
  color?: string
  sort?: number
  /** is_won / is_lost quando Kommo marca stages finais */
  is_won?: boolean
  is_lost?: boolean
}

interface KommoLead {
  id: number
  status_id: number
  pipeline_id: number
  created_at: number
  updated_at: number
  closed_at?: number | null
  price?: number
}

type StageKind = 'top' | 'mql' | 'sql' | 'won' | 'lost' | 'other'

function classifyStage(stage: KommoStage, mapHint?: Record<string, StageKind>): StageKind {
  if (stage.is_won) return 'won'
  if (stage.is_lost) return 'lost'
  if (mapHint && mapHint[String(stage.id)]) return mapHint[String(stage.id)]
  const n = stage.name.toLowerCase()
  if (/sql|sales qualified|qualificado comercial|oportunidade/.test(n)) return 'sql'
  if (/mql|marketing qualified|qualificado mkt|qualificado mark|nutri/.test(n)) return 'mql'
  if (/novo|entrada|lead|entrou/.test(n)) return 'top'
  if (/perd|lost/.test(n)) return 'lost'
  if (/fech|ganho|won|sold|venda/.test(n)) return 'won'
  return 'other'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['GET'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const slug = String(req.query.client_slug || '').trim()
  if (!slug) return res.status(400).json({ error: 'client_slug required' })

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Resolve client + membership check
  const { data: client } = await svc
    .from('clients')
    .select('id, name, kommo_pipeline_id')
    .eq('slug', slug)
    .maybeSingle()
  if (!client) return res.status(404).json({ error: 'client not found' })

  const { data: member } = await svc
    .from('client_members')
    .select('user_id')
    .eq('client_id', (client as { id: string }).id)
    .eq('user_id', auth.user.id)
    .maybeSingle()
  const isSuperAdmin = auth.globalRole === 'super_admin' || auth.globalRole === 'admin'
  if (!member && !isSuperAdmin) return res.status(403).json({ error: 'forbidden' })

  const clientId = (client as { id: string }).id
  const pipelineId = (client as { kommo_pipeline_id?: number | null }).kommo_pipeline_id

  // Integração Kommo do cliente
  const { data: integration } = await svc
    .from('client_integrations')
    .select('external_workspace_id, access_token, metadata')
    .eq('client_id', clientId)
    .eq('provider', 'kommo')
    .eq('status', 'active')
    .maybeSingle()

  if (!integration) {
    return res.status(501).json({
      note:
        'Integração Kommo não conectada. Configure em Integrações → Kommo para ver funil + MQL/SQL do cliente.',
    })
  }

  const subdomain = (integration as { external_workspace_id?: string | null }).external_workspace_id
  const token = (integration as { access_token?: string | null }).access_token
  if (!subdomain || !token) {
    return res.status(501).json({ note: 'Credenciais Kommo incompletas.' })
  }

  const mapHint =
    ((integration as { metadata?: { crm_stage_map?: Record<string, StageKind> } }).metadata
      ?.crm_stage_map as Record<string, StageKind> | undefined) ?? undefined

  try {
    const base = `https://${subdomain}.kommo.com/api/v4`
    const headers = { authorization: `Bearer ${token}` }

    // Pipeline + stages
    const pipelinePath = pipelineId
      ? `${base}/leads/pipelines/${pipelineId}`
      : `${base}/leads/pipelines`
    const pipeResp = await fetch(pipelinePath, { headers })
    if (!pipeResp.ok) {
      return res.status(502).json({ error: `Kommo pipelines ${pipeResp.status}` })
    }
    const pipeJson = (await pipeResp.json()) as {
      _embedded?: { pipelines?: Array<{ id: number; name: string; _embedded?: { statuses?: KommoStage[] } }> }
      id?: number
      name?: string
      _embedded_single?: { statuses?: KommoStage[] }
      [k: string]: unknown
    }
    let pipelineName = 'Pipeline'
    let stages: KommoStage[] = []
    if (pipelineId) {
      pipelineName = (pipeJson.name as string) || pipelineName
      stages = (pipeJson._embedded?.statuses as KommoStage[] | undefined) ?? []
    } else {
      const first = pipeJson._embedded?.pipelines?.[0]
      pipelineName = first?.name ?? pipelineName
      stages = first?._embedded?.statuses ?? []
    }

    // Leads (últimos 30d) — Kommo API limita 250 por página, iteramos até 500
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
    const leadsResp = await fetch(
      `${base}/leads?filter[created_at][from]=${thirtyDaysAgo}&limit=250${
        pipelineId ? `&filter[pipeline_id]=${pipelineId}` : ''
      }`,
      { headers },
    )
    if (!leadsResp.ok) {
      return res.status(502).json({ error: `Kommo leads ${leadsResp.status}` })
    }
    const leadsJson = (await leadsResp.json()) as { _embedded?: { leads?: KommoLead[] } }
    const leads: KommoLead[] = leadsJson._embedded?.leads ?? []

    // Agrupa por stage + classifica
    const countByStage = new Map<number, number>()
    for (const l of leads) {
      countByStage.set(l.status_id, (countByStage.get(l.status_id) ?? 0) + 1)
    }
    const enrichedStages = stages
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        kind: classifyStage(s, mapHint),
        count: countByStage.get(s.id) ?? 0,
      }))

    const wonLeads = leads.filter((l) => {
      const s = stages.find((st) => st.id === l.status_id)
      return s?.is_won
    })
    const mqlCount = enrichedStages
      .filter((s) => s.kind === 'mql' || s.kind === 'sql' || s.kind === 'won')
      .reduce((a, s) => a + s.count, 0)
    const sqlCount = enrichedStages
      .filter((s) => s.kind === 'sql' || s.kind === 'won')
      .reduce((a, s) => a + s.count, 0)
    const wonCount = wonLeads.length
    const totalLeads = leads.length

    const avgDaysToWin = (() => {
      const diffs = wonLeads
        .filter((l) => l.closed_at)
        .map((l) => (l.closed_at! - l.created_at) / 86400)
      if (diffs.length === 0) return null
      return diffs.reduce((a, b) => a + b, 0) / diffs.length
    })()

    return res.status(200).json({
      pipelineName,
      totalLeads,
      mqlCount,
      sqlCount,
      wonCount,
      conversionRatePct: totalLeads > 0 ? (wonCount / totalLeads) * 100 : null,
      avgDaysToWin,
      stages: enrichedStages,
      syncedAt: new Date().toISOString(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return res.status(500).json({ error: 'kommo fetch failed', detail: msg })
  }
}
