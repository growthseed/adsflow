/* eslint-disable @typescript-eslint/no-explicit-any -- snapshots are untyped JSON from Supabase. */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { allowMethods, applyCors, requireUserAuth } from '../../../api/_lib/security.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

type PortalTask = {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
  list_name: string
  url: string
}

const statusMap: Record<string, PortalTask['status']> = {
  urgent: 'blocked',
  in_progress: 'in_progress',
  review: 'review',
  upcoming: 'todo',
  backlog: 'todo',
  done: 'done',
}

const channelLabels: Record<string, string> = { google_ads: 'Google Ads', meta_ads: 'Meta Ads' }
const channelColors: Record<string, string> = { google_ads: '#4285f4', meta_ads: '#0866ff' }

function snapshotValue(value: unknown): Record<string, any> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, any>) || null
  return value && typeof value === 'object' ? value as Record<string, any> : null
}

function dateLabel(iso: string) {
  const [, month, day] = iso.split('-')
  return `${day}/${month}`
}

function buildPortalData(clickup: Record<string, any> | null, performance: Record<string, any> | null) {
  const tasks: PortalTask[] = (clickup?.all_tasks ?? []).map((task: Record<string, any>) => ({
    id: String(task.id),
    title: String(task.title || 'Demanda'),
    status: statusMap[task.status] ?? 'todo',
    list_name: String(task.list_name || 'Sem lista'),
    url: typeof task.url === 'string' ? task.url : '',
  }))
  const platforms = performance?.platforms ?? {}
  const spend = Number(performance?.blended?.total_spend ?? 0)
  const leads = Number(performance?.blended?.total_conversions ?? 0)

  const daily: Array<{ date: string; dateLabel: string; spend: number; leads: number }> = []
  for (const account of Object.values(platforms) as Array<Record<string, any>>) {
    for (const item of account?.daily ?? []) {
      daily.push({ date: item.date, dateLabel: dateLabel(item.date), spend: Number(item.spend || 0), leads: 0 })
    }
  }

  const channels = Object.entries(platforms).flatMap(([key, account]) => {
    const value = account as Record<string, any>
    const channelSpend = Number(value?.summary?.spend || 0)
    return channelSpend > 0 ? [{ label: channelLabels[key] ?? key, spend: channelSpend, conversions: Number(value.summary.conversions || 0), color: channelColors[key] ?? '#64748b' }] : []
  })

  const campaigns = Object.entries(platforms).flatMap(([key, account]) => ((account as Record<string, any>)?.campaigns ?? []).map((campaign: Record<string, any>) => {
    const metrics = campaign.metrics ?? {}
    return {
      name: String(campaign.name || 'Campanha'), channel: channelLabels[key] ?? key,
      spend: Number(metrics.spend || 0), impressions: Number(metrics.impressions || 0), clicks: Number(metrics.clicks || 0),
      conversions: Number(metrics.conversions || 0), cpl: Number(metrics.conversions || 0) > 0 ? Number(metrics.spend || 0) / Number(metrics.conversions) : null,
      isActive: campaign.status === 'enabled' || campaign.status_raw === 'ENABLED' || campaign.status_raw === 'ACTIVE',
    }
  })).sort((a, b) => Number(b.isActive) - Number(a.isActive) || b.spend - a.spend)

  const stats = clickup?.stats ?? {}
  return {
    periodLabel: performance?.period?.label ?? null,
    spend: performance ? spend : null,
    leads,
    clicks: Number(performance?.blended?.total_clicks ?? 0),
    impressions: Number(performance?.blended?.total_impressions ?? 0),
    cpl: leads > 0 ? spend / leads : null,
    daily,
    channels,
    campaigns,
    monthly: performance?.monthly_history ?? [],
    notes: Array.isArray(performance?.notes) ? performance.notes : [],
    tasks,
    taskStats: {
      total: Number(clickup?.task_count ?? tasks.length),
      done: Number(stats.done ?? tasks.filter(task => task.status === 'done').length),
      in_progress: Number(stats.in_progress ?? tasks.filter(task => task.status === 'in_progress').length),
      review: Number(stats.review ?? tasks.filter(task => task.status === 'review').length),
      todo: Number((stats.upcoming ?? 0) + (stats.backlog ?? 0)),
      blocked: Number(stats.urgent ?? tasks.filter(task => task.status === 'blocked').length),
    },
    lastSyncedAt: clickup?.last_synced_at ?? performance?.last_synced_at ?? null,
  }
}

export async function runPublicPortal(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Surrogate-Control', 'no-store')
  if (!applyCors(req, res) || !allowMethods(req, res, ['GET'])) return
  const token = req.query.token
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) return res.status(400).json({ error: 'Link invalido.' })
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Portal indisponivel.' })

  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: resolved, error: resolveError } = await service.rpc('resolve_portal_token', { p_token: token })
  if (resolveError) return res.status(500).json({ error: 'Nao foi possivel validar o link.' })
  const client = snapshotValue(resolved)
  if (!client?.slug) return res.status(404).json({ error: 'Link expirado ou desativado.' })

  const [clickupResult, performanceResult] = await Promise.all([
    service.rpc('latest_agency_snapshot', { snapshot_kind: 'clickup' }),
    service.rpc('latest_agency_snapshot', { snapshot_kind: 'performance' }),
  ])
  const clickupSnapshot = snapshotValue(clickupResult.data)
  const performanceSnapshot = snapshotValue(performanceResult.data)
  const clickup = (clickupSnapshot?.clients as Array<Record<string, any>> | undefined)?.find(item => item.slug === client.slug) ?? null
  const performance = (performanceSnapshot?.clients as Record<string, Record<string, any>> | undefined)?.[client.slug] ?? null

  return res.status(200).json({
    client: { slug: client.slug, name: client.name, logo_url: client.logo_url ?? null, industry: client.industry ?? null },
    data: buildPortalData(clickup, performance),
  })
}

/** Creates a stable public token on first use; existing links are never rotated. */
export async function runEnsurePortalToken(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (!applyCors(req, res) || !allowMethods(req, res, ['POST'])) return
  const auth = await requireUserAuth(req, res)
  if (!auth) return
  if (auth.globalRole !== 'admin' && auth.globalRole !== 'super_admin') return res.status(403).json({ error: 'Somente administradores podem compartilhar clientes.' })
  const slug = typeof req.query.client_slug === 'string' ? req.query.client_slug : req.body?.client_slug
  if (typeof slug !== 'string' || !slug) return res.status(400).json({ error: 'Cliente obrigatorio.' })
  const { data: profile } = await auth.serviceClient.from('users').select('is_active').eq('id', auth.user.id).maybeSingle()
  if (profile?.is_active !== true) return res.status(403).json({ error: 'Conta sem acesso ativo.' })
  const { data: client, error: clientError } = await auth.serviceClient.from('clients').select('id, slug, portal_token').eq('slug', slug).eq('status', 'active').maybeSingle()
  if (clientError || !client) return res.status(404).json({ error: 'Cliente nao encontrado.' })
  if (client.portal_token) return res.status(200).json({ url: `${req.headers.origin || 'https://adsflow.efeito.digital'}/portal/${client.portal_token}`, created: false })
  const token = randomUUID()
  const { data: updated, error: updateError } = await auth.serviceClient.from('clients').update({ portal_token: token }).eq('id', client.id).is('portal_token', null).select('portal_token').maybeSingle()
  if (updateError) return res.status(500).json({ error: 'Nao foi possivel criar o link publico.' })
  const finalToken = updated?.portal_token || token
  return res.status(201).json({ url: `${req.headers.origin || 'https://adsflow.efeito.digital'}/portal/${finalToken}`, created: true })
}
