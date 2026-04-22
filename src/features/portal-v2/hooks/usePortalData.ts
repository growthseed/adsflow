import { useMemo } from 'react'

import { getClientPortalBundle } from '@/services/clientPortalService'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import { getClientPerformance } from '@/services/adapters/performanceAdapter'
import type { ClickUpTask } from '@/services/adapters/clickupTypes'

import {
  DEFAULT_PORTAL_CONFIG,
  type PortalConfig,
  type PortalGoalRing,
  type PortalNextCall,
  type PortalTimelineItem,
  type PortalV2Data,
} from '../types'

function summarize(clientName: string, leads: number, cpl: number | null, roas: number | null): string {
  const parts: string[] = []
  if (leads > 0) parts.push(`${leads.toLocaleString('pt-BR')} leads no período`)
  if (cpl != null) parts.push(`CPL de R$ ${cpl.toFixed(0)}`)
  if (roas != null) parts.push(`ROAS ${roas.toFixed(1)}×`)
  if (parts.length === 0) {
    return `Começamos a preparar a presença digital de ${clientName}. Próximos passos em andamento.`
  }
  return `${clientName} · ${parts.join(' · ')}.`
}

/**
 * Compõe os dados do Portal V2 a partir dos snapshots existentes.
 * config é opcional — se não vier, usa DEFAULT (tudo ligado exceto
 * files). Somado à própria UI respeitar os toggles.
 */
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
      config ?? ({ clientId: agency?.slug ?? clientSlug, ...DEFAULT_PORTAL_CONFIG } as PortalConfig)

    /* Resumo em 1 frase — derivado até IA plugar */
    const summary =
      bundle.kpis != null
        ? summarize(clientName, bundle.kpis.leads, bundle.kpis.cpa, perf?.blended.roas ?? null)
        : null

    /* Metas — rings compactos. Sem metas configuradas, lista vazia */
    const goals: PortalGoalRing[] = []
    if (bundle.kpis && bundle.kpis.leads > 0) {
      goals.push({
        key: 'leads',
        label: 'Leads do mês',
        current: bundle.kpis.leads,
        target: Math.max(bundle.kpis.leads, Math.round(bundle.kpis.leads * 1.2)),
        unit: 'count',
        tone:
          bundle.kpis.leads >= Math.round(bundle.kpis.leads * 1.2) * 0.8 ? 'success' : 'warning',
        subtitle: `${bundle.kpis.leads.toLocaleString('pt-BR')} atuais`,
      })
    }
    if (perf?.blended.roas != null) {
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
      .slice(0, 2)
      .map((t: ClickUpTask) => ({
        id: t.id,
        tone: (t.status === 'done' ? 'success' : t.priority === 'urgent' ? 'warning' : 'brand') as
          | 'success'
          | 'warning'
          | 'brand',
        title: t.title,
        subtitle: t.list_name,
      }))

    /* Próxima call — primeira upcoming task com due hoje/amanhã */
    const nextCall: PortalNextCall | null = (() => {
      const t = agency?.upcoming_tasks?.[0]
      if (!t || !t.due_date) return null
      return {
        title: t.title,
        when: new Date(`${t.due_date}T14:00:00`),
      }
    })()

    return {
      bundle,
      config: activeConfig,
      summary,
      goals,
      timeline,
      nextCall,
    }
  }, [bundle, clientSlug, config])
}
