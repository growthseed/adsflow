import { useCallback, useEffect, useMemo, useState } from 'react'

import { supabase } from '@/lib/supabase'
import { loadSnapshot } from '@/services/adapters/clickupAdapter'
import { loadPerformanceSnapshot } from '@/services/adapters/performanceAdapter'
import type { AgencyGoal, AlertEvent, AlertRule } from '../types'

interface RuleRow {
  id: string
  name: string
  scope_type: AlertRule['scopeType']
  target_ids: string[]
  metric: AlertRule['metric']
  operator: AlertRule['operator']
  value: number
  unit: AlertRule['unit']
  window: AlertRule['window']
  channels: AlertRule['channels']
  recipients: string[]
  cooldown: string
  active: boolean
}

interface EventRow {
  id: string
  rule_id: string | null
  client_id: string | null
  severity: AlertEvent['severity']
  title: string
  body: string | null
  observed_value: number | null
  delivered_to: AlertRule['channels']
  created_at: string
  resolved_at: string | null
}

interface GoalRow {
  id: string
  client_id: string
  metric: AgencyGoal['metric']
  label: string
  target_value: number
  direction: AgencyGoal['direction']
  unit: AgencyGoal['unit']
  horizon: AgencyGoal['horizon']
  period_start: string
  period_end: string
}

function toRule(r: RuleRow): AlertRule {
  return {
    id: r.id,
    name: r.name,
    scopeType: r.scope_type,
    targetIds: r.target_ids,
    metric: r.metric,
    operator: r.operator,
    value: r.value,
    unit: r.unit,
    window: r.window,
    channels: r.channels,
    recipients: r.recipients,
    cooldown: r.cooldown,
    active: r.active,
  }
}

function toEvent(r: EventRow, clientNameById: Map<string, string>): AlertEvent {
  return {
    id: r.id,
    ruleId: r.rule_id,
    clientId: r.client_id,
    clientName: r.client_id ? clientNameById.get(r.client_id) : undefined,
    severity: r.severity,
    title: r.title,
    body: r.body,
    observedValue: r.observed_value,
    deliveredTo: r.delivered_to,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
  }
}

function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)))
}

/**
 * Carrega regras + eventos + metas da agência e calcula o estado
 * atual de cada meta usando o performance snapshot.
 */
export function useAlertsData() {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [events, setEvents] = useState<AlertEvent[]>([])
  const [goals, setGoals] = useState<AgencyGoal[]>([])
  const [loading, setLoading] = useState(true)

  const agency = loadSnapshot()
  const perf = loadPerformanceSnapshot()

  const clientNameBySlug = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of agency.clients) m.set(c.slug, c.name)
    return m
  }, [agency])

  const [reloadTick, setReloadTick] = useState(0)
  const reload = useCallback(() => setReloadTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      supabase.from('alert_rules').select('*').order('created_at', { ascending: false }),
      supabase.from('alert_events').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('agency_goals').select('*').eq('active', true),
      supabase.from('clients').select('id, slug, name'),
    ]).then(([rulesRes, eventsRes, goalsRes, clientsRes]) => {
      if (cancelled) return

      const clientMapById = new Map<string, { slug: string; name: string }>()
      for (const c of (clientsRes.data ?? []) as { id: string; slug: string; name: string }[]) {
        clientMapById.set(c.id, { slug: c.slug, name: c.name })
      }
      const clientNameById = new Map<string, string>()
      clientMapById.forEach((v, k) => clientNameById.set(k, v.name))

      setRules(((rulesRes.data as RuleRow[]) ?? []).map(toRule))
      setEvents(((eventsRes.data as EventRow[]) ?? []).map((r) => toEvent(r, clientNameById)))

      const goalsWithCtx: AgencyGoal[] = ((goalsRes.data as GoalRow[]) ?? []).map((g) => {
        const client = clientMapById.get(g.client_id)
        const p = client ? perf.clients?.[client.slug] : undefined
        let currentValue: number | null = null
        if (p) {
          switch (g.metric) {
            case 'leads':
            case 'conversions':
              currentValue = p.blended.total_conversions
              break
            case 'roas':
              currentValue = p.blended.roas
              break
            case 'cpl':
              currentValue = p.blended.cost_per_conversion
              break
            case 'spend':
              currentValue = p.blended.total_spend
              break
          }
        }
        const pct =
          currentValue != null && g.target_value > 0
            ? g.direction === 'maximize'
              ? (currentValue / g.target_value) * 100
              : (g.target_value > 0 ? Math.min(200, (currentValue / g.target_value) * 100) : 0)
            : null
        return {
          id: g.id,
          clientId: g.client_id,
          clientName: client?.name ?? 'Cliente',
          metric: g.metric,
          label: g.label,
          targetValue: g.target_value,
          direction: g.direction,
          unit: g.unit,
          horizon: g.horizon,
          periodStart: g.period_start,
          periodEnd: g.period_end,
          currentValue,
          pct,
          daysLeft: daysBetween(new Date(), new Date(g.period_end)),
        }
      })
      setGoals(goalsWithCtx)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [perf, reloadTick])

  /* Agregados para fleet summary */
  const summary = useMemo(() => {
    let azul = 0, risco = 0, criticas = 0
    for (const g of goals) {
      if (g.pct == null) continue
      if (g.direction === 'cap') {
        if (g.pct > 100) criticas++
        else if (g.pct > 90) risco++
        else azul++
      } else {
        if (g.pct >= 90) azul++
        else if (g.pct >= 70) risco++
        else criticas++
      }
    }
    return {
      azul,
      risco,
      criticas,
      rulesActive: rules.filter((r) => r.active).length,
      totalClients: clientNameBySlug.size,
    }
  }, [goals, rules, clientNameBySlug])

  return { rules, setRules, events, goals, summary, loading, reload }
}
