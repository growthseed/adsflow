export type AlertMetric = 'cpl' | 'roas' | 'ctr' | 'leads' | 'spend' | 'cpm' | 'conversions' | 'freeze'
export type AlertOperator = 'gt' | 'lt' | 'change_gt' | 'change_lt'
export type AlertUnit = 'percent_of_goal' | 'absolute' | 'percent_change'
export type AlertChannel = 'inapp' | 'whatsapp' | 'email' | 'slack'
export type AlertWindow = '1d' | '3d' | '7d'
export type AlertScope = 'global' | 'client' | 'segment'

export interface AlertRule {
  id: string
  name: string
  scopeType: AlertScope
  targetIds: string[]
  metric: AlertMetric
  operator: AlertOperator
  value: number
  unit: AlertUnit
  window: AlertWindow
  channels: AlertChannel[]
  recipients: string[]
  cooldown: string
  active: boolean
}

export interface AlertEvent {
  id: string
  ruleId: string | null
  clientId: string | null
  clientName?: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  body: string | null
  observedValue: number | null
  deliveredTo: AlertChannel[]
  createdAt: string
  resolvedAt: string | null
}

export interface AgencyGoal {
  id: string
  clientId: string
  clientName: string
  metric: AlertMetric | 'appointments' | 'sales' | 'custom'
  label: string
  targetValue: number
  direction: 'maximize' | 'cap'
  unit: 'count' | 'currency' | 'percent' | 'ratio'
  horizon: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  periodStart: string
  periodEnd: string
  currentValue: number | null
  pct: number | null
  /** Dias que faltam até periodEnd */
  daysLeft: number
}
