import { useMemo } from 'react'

import { getClientPortalBundle } from '@/services/clientPortalService'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import { getClientPerformance } from '@/services/adapters/performanceAdapter'
import type {
  ClickUpTask,
  ClickUpTaskStatus,
} from '@/services/adapters/clickupTypes'
import type {
  Campaign,
  PlatformAccount,
} from '@/services/adapters/performanceTypes'

import {
  DEFAULT_PORTAL_CONFIG,
  type PortalCampaignRow,
  type PortalChannelRow,
  type PortalConfig,
  type PortalGoalRing,
  type PortalMonthlyRow,
  type PortalNextCall,
  type PortalTaskRow,
  type PortalTimelineItem,
  type PortalV2Data,
} from '../types'

function summarize(
  clientName: string,
  leads: number,
  cpl: number | null,
  spend: number | null,
): string {
  const parts: string[] = []
  if (leads > 0) {
    parts.push(`${leads.toLocaleString('pt-BR')} ${leads === 1 ? 'lead' : 'leads'} no período`)
  }
  if (cpl != null) parts.push(`CPL R$ ${cpl.toFixed(0)}`)
  if (spend != null && spend > 0) parts.push(`R$ ${spend.toFixed(0)} investidos`)
  if (parts.length === 0) {
    return `${clientName} — sem campanhas rodando no período. Próximos passos em andamento.`
  }
  return `${clientName} · ${parts.join(' · ')}.`
}

const STATUS_MAP: Record<ClickUpTaskStatus, PortalTaskRow['status']> = {
  urgent: 'blocked',
  in_progress: 'in_progress',
  review: 'review',
  upcoming: 'todo',
  backlog: 'todo',
  done: 'done',
}

const STATUS_LABEL: Record<PortalTaskRow['status'], string> = {
  todo: 'A fazer',
  in_progress: 'Em andamento',
  review: 'Em revisão',
  done: 'Concluído',
  blocked: 'Bloqueado',
}

const STATUS_COLOR: Record<PortalTaskRow['status'], string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  done: '#10b981',
  blocked: '#ef4444',
}

const CHANNEL_COLOR: Record<string, string> = {
  google_ads: '#4285f4',
  meta_ads: '#0866ff',
}

const CHANNEL_LABEL: Record<string, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
}

function buildCampaignRows(platforms: Record<string, PlatformAccount | undefined>): PortalCampaignRow[] {
  const rows: PortalCampaignRow[] = []
  for (const [key, account] of Object.entries(platforms)) {
    if (!account) continue
    for (const c of account.campaigns as Campaign[]) {
      const m = c.metrics
      rows.push({
        name: c.name,
        channel: CHANNEL_LABEL[key] ?? key,
        status: c.status_raw || c.status,
        spend: m.spend,
        clicks: m.clicks,
        impressions: m.impressions,
        conversions: m.conversions,
        cpl: m.conversions > 0 ? m.spend / m.conversions : null,
        ctr: m.impressions > 0 ? m.clicks / m.impressions : null,
      })
    }
  }
  // Ordena ativas com gasto primeiro, depois por spend desc
  return rows.sort((a, b) => {
    const aActive = a.status === 'enabled' || a.status === 'ENABLED'
    const bActive = b.status === 'enabled' || b.status === 'ENABLED'
    if (aActive !== bActive) return aActive ? -1 : 1
    return b.spend - a.spend
  })
}

function buildChannelRows(platforms: Record<string, PlatformAccount | undefined>): PortalChannelRow[] {
  const rows: PortalChannelRow[] = []
  for (const [key, account] of Object.entries(platforms)) {
    if (!account || account.summary.spend <= 0) continue
    rows.push({
      label: CHANNEL_LABEL[key] ?? key,
      spend: account.summary.spend,
      conversions: account.summary.conversions,
      color: CHANNEL_COLOR[key] ?? '#64748b',
    })
  }
  return rows
}

export function usePortalData(
  clientSlug: string | null | undefined,
  config: PortalConfig | null,
): PortalV2Data | null {
  const bundle = useMemo(
    () => (clientSlug ? getClientPortalBundle(clientSlug) : null),
    [clientSlug],
  )

  return useMemo(() => {
    if (!clientSlug || !bundle) return null
    const agency = getClientBySlug(clientSlug)
    const perf = getClientPerformance(clientSlug)
    const clientName = bundle.roadmap?.client_name || agency?.name || 'Cliente'
    const activeConfig: PortalConfig =
      config ??
      ({ clientId: agency?.slug ?? clientSlug, ...DEFAULT_PORTAL_CONFIG } as PortalConfig)

    const spend = perf?.blended.total_spend ?? null
    const periodLabel = perf?.period.label ?? null
    const cpl = bundle.kpis?.cpa ?? null

    /* Resumo em 1 frase — derivado até IA plugar */
    const summary =
      bundle.kpis != null ? summarize(clientName, bundle.kpis.leads, cpl, spend) : null

    /* Metas — só inclui se houver dados reais. Sem auto-inflar target. */
    const goals: PortalGoalRing[] = []
    if (perf && perf.blended.roas > 0) {
      const target = 3.5
      goals.push({
        key: 'roas',
        label: 'Meta ROAS',
        current: perf.blended.roas,
        target,
        unit: 'ratio',
        tone:
          perf.blended.roas >= target
            ? 'success'
            : perf.blended.roas >= target * 0.75
            ? 'warning'
            : 'error',
        subtitle: `${perf.blended.roas.toFixed(1)}× / ${target}×`,
      })
    }

    /* Timeline 48h — derivada das últimas tasks do ClickUp */
    const timeline: PortalTimelineItem[] = (agency?.all_tasks ?? [])
      .slice(0, 3)
      .map((t: ClickUpTask) => ({
        id: t.id,
        tone: (t.status === 'done' ? 'success' : t.priority === 'urgent' ? 'warning' : 'brand') as
          | 'success'
          | 'warning'
          | 'brand',
        title: t.title,
        subtitle: t.list_name,
      }))

    const nextCall: PortalNextCall | null = (() => {
      const t = agency?.upcoming_tasks?.[0]
      if (!t || !t.due_date) return null
      return {
        title: t.title,
        when: new Date(`${t.due_date}T14:00:00`),
      }
    })()

    /* Campanhas — extraídas do performance snapshot */
    const campaigns = perf ? buildCampaignRows(perf.platforms) : []

    /* Histórico mensal — vem direto do snapshot estendido */
    const monthlyHistory: PortalMonthlyRow[] = perf?.monthly_history
      ? perf.monthly_history.map((m) => ({
          month: m.month,
          label: m.label,
          spend: m.spend,
          clicks: m.clicks,
          impressions: m.impressions,
          conversions: m.conversions,
          partial: m.partial,
        }))
      : []

    /* Distribuição por canal */
    const channels = perf ? buildChannelRows(perf.platforms) : []

    /* Notas operacionais (já vêm do snapshot) */
    const notes = perf?.notes ?? []

    /* Tasks pro painel "Tarefas" */
    const allTasks = agency?.all_tasks ?? []
    const tasks: PortalTaskRow[] = allTasks.map((t: ClickUpTask) => {
      const status = STATUS_MAP[t.status] ?? 'todo'
      return {
        id: t.id,
        title: t.title,
        status,
        status_label: STATUS_LABEL[status],
        status_color: STATUS_COLOR[status],
        list_name: t.list_name,
        due_date_label: t.due_date_label,
        url: t.url,
        assignees: t.assignees.map((a) => ({
          username: a.username,
          initial: a.initial,
          color: a.color,
        })),
      }
    })

    const taskStats = {
      total: tasks.length,
      done: tasks.filter((t) => t.status === 'done').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      review: tasks.filter((t) => t.status === 'review').length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      blocked: tasks.filter((t) => t.status === 'blocked').length,
    }

    return {
      bundle,
      config: activeConfig,
      summary,
      goals,
      timeline,
      nextCall,
      spend,
      periodLabel,
      campaigns,
      monthlyHistory,
      channels,
      notes,
      tasks,
      taskStats,
    }
  }, [bundle, clientSlug, config])
}
