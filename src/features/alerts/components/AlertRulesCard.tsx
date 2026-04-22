import { MessageCircle, Bell, Mail, MoreHorizontal, Plus } from 'lucide-react'

import { Card, CardBody, CardHead } from '@/components/primitives'
import type { AlertChannel, AlertRule } from '../types'

interface Props {
  rules: AlertRule[]
  onToggle?: (ruleId: string, active: boolean) => void
  onNew?: () => void
  onEdit?: (rule: AlertRule) => void
}

const channelMeta: Record<AlertChannel, { label: string; Icon: React.ElementType; bg: string; fg: string }> = {
  inapp:    { label: 'in-app',    Icon: Bell,           bg: 'bg-brand-100',   fg: 'text-brand-700' },
  whatsapp: { label: 'WhatsApp',  Icon: MessageCircle,  bg: 'bg-success-100', fg: 'text-success-700' },
  email:    { label: 'E-mail',    Icon: Mail,           bg: 'bg-info-100',    fg: 'text-info-600' },
  slack:    { label: 'Slack',     Icon: MessageCircle,  bg: 'bg-warning-100', fg: 'text-warning-600' },
}

export function AlertRulesCard({ rules, onToggle, onNew, onEdit }: Props) {
  return (
    <Card className="col-span-12 lg:col-span-8">
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <Bell size={16} className="text-brand-600" /> Regras de alerta
          </span>
        }
        subtitle="Quando disparar · para onde · para quem"
        actions={
          onNew ? (
            <button
              onClick={onNew}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-700"
            >
              <Plus size={12} /> regra
            </button>
          ) : undefined
        }
      />
      <CardBody className="p-0">
        {rules.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">
            Nenhuma regra configurada. Crie a primeira regra para receber alertas quando métricas saírem do ritmo.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {rules.map((r) => (
              <RuleRow key={r.id} rule={r} onToggle={onToggle} onEdit={onEdit} />
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}

function RuleRow({
  rule,
  onToggle,
  onEdit,
}: {
  rule: AlertRule
  onToggle?: (ruleId: string, active: boolean) => void
  onEdit?: (rule: AlertRule) => void
}) {
  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${rule.active ? '' : 'opacity-55'}`}>
      <button
        role="switch"
        aria-checked={rule.active}
        onClick={() => onToggle?.(rule.id, !rule.active)}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
          rule.active ? 'bg-brand-600' : 'bg-neutral-200'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            rule.active ? 'translate-x-5' : ''
          }`}
        />
      </button>
      <div className="flex-1 min-w-0 text-[13px] text-neutral-800">
        <RuleSentence rule={rule} />
      </div>
      <div className="flex items-center gap-1.5">
        {rule.channels.map((ch) => {
          const m = channelMeta[ch]
          const Icon = m.Icon
          return (
            <span
              key={ch}
              title={m.label}
              className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${m.bg} ${m.fg}`}
            >
              <Icon size={12} />
            </span>
          )
        })}
      </div>
      <button
        onClick={() => onEdit?.(rule)}
        aria-label="editar regra"
        className="w-7 h-7 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
      >
        <MoreHorizontal size={14} />
      </button>
    </li>
  )
}

function RuleSentence({ rule }: { rule: AlertRule }) {
  const metric = rule.metric.toUpperCase()
  const op =
    rule.operator === 'gt'
      ? '>'
      : rule.operator === 'lt'
      ? '<'
      : rule.operator === 'change_gt'
      ? 'subiu mais de'
      : 'caiu mais de'
  const unitSuffix =
    rule.unit === 'percent_of_goal'
      ? '% da meta'
      : rule.unit === 'percent_change'
      ? '%'
      : ''
  const windowLabel = rule.window === '1d' ? '1 dia' : rule.window === '3d' ? '3 dias' : '7 dias'
  return (
    <>
      Se <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">{metric}</code>{' '}
      {op}{' '}
      <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">
        {rule.value}
        {unitSuffix}
      </code>{' '}
      por {windowLabel}
    </>
  )
}
