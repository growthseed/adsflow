import { useEffect, useState } from 'react'
import { Bell, Loader2, X } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import type { AlertChannel, AlertMetric, AlertOperator, AlertRule, AlertScope, AlertUnit, AlertWindow } from '../types'

interface Props {
  open: boolean
  initial?: AlertRule | null
  onClose: () => void
  onSaved: () => void
}

const metricOptions: Array<{ value: AlertMetric; label: string }> = [
  { value: 'cpl', label: 'CPL' },
  { value: 'roas', label: 'ROAS' },
  { value: 'ctr', label: 'CTR' },
  { value: 'leads', label: 'Leads' },
  { value: 'spend', label: 'Investido' },
  { value: 'cpm', label: 'CPM' },
  { value: 'conversions', label: 'Conversões' },
  { value: 'freeze', label: 'Freeze (sem leads 24h)' },
]

const operatorOptions: Array<{ value: AlertOperator; label: string }> = [
  { value: 'gt',         label: 'maior que' },
  { value: 'lt',         label: 'menor que' },
  { value: 'change_gt',  label: 'subiu mais de' },
  { value: 'change_lt',  label: 'caiu mais de' },
]

const unitOptions: Array<{ value: AlertUnit; label: string }> = [
  { value: 'absolute',        label: 'absoluto' },
  { value: 'percent_of_goal', label: '% da meta' },
  { value: 'percent_change',  label: '% de variação' },
]

const windowOptions: Array<{ value: AlertWindow; label: string }> = [
  { value: '1d', label: '1 dia' },
  { value: '3d', label: '3 dias' },
  { value: '7d', label: '7 dias' },
]

const channels: Array<{ value: AlertChannel; label: string }> = [
  { value: 'inapp', label: 'In-app (feed)' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'slack', label: 'Slack' },
]

export function RuleFormModal({ open, initial, onClose, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [scopeType, setScopeType] = useState<AlertScope>(initial?.scopeType ?? 'global')
  const [targetIds, setTargetIds] = useState<string[]>(initial?.targetIds ?? [])
  const [metric, setMetric] = useState<AlertMetric>(initial?.metric ?? 'cpl')
  const [operator, setOperator] = useState<AlertOperator>(initial?.operator ?? 'change_gt')
  const [value, setValue] = useState<number>(initial?.value ?? 20)
  const [unit, setUnit] = useState<AlertUnit>(initial?.unit ?? 'percent_change')
  const [window, setWindow] = useState<AlertWindow>(initial?.window ?? '3d')
  const [cooldown, setCooldown] = useState(initial?.cooldown ?? '24h')
  const [channelsSel, setChannelsSel] = useState<AlertChannel[]>(initial?.channels ?? ['inapp', 'whatsapp'])
  const [active, setActive] = useState(initial?.active ?? true)
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    supabase
      .from('clients')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => setClients(((data as Array<{ id: string; name: string }>) ?? [])))
  }, [open])

  if (!open) return null

  const toggleChannel = (c: AlertChannel) => {
    setChannelsSel((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  const submit = async () => {
    setError(null)
    if (!name.trim()) return setError('Dê um nome à regra')
    if (channelsSel.length === 0) return setError('Escolha ao menos um canal')
    if (scopeType === 'client' && targetIds.length === 0)
      return setError('Escopo "cliente" exige escolher pelo menos um cliente')

    setSaving(true)
    const { data: session } = await supabase.auth.getUser()
    const userId = session.user?.id
    const payload = {
      name: name.trim(),
      scope_type: scopeType,
      target_ids: scopeType === 'client' ? targetIds : [],
      metric,
      operator,
      value,
      unit,
      window,
      channels: channelsSel,
      cooldown,
      active,
    }
    const { error: err } = initial?.id
      ? await supabase.from('alert_rules').update(payload).eq('id', initial.id)
      : await supabase.from('alert_rules').insert({ ...payload, created_by: userId })
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[var(--shadow-overlay)] w-full max-w-xl max-h-[90vh] flex flex-col">
        <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0">
              <Bell size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-neutral-900">
                {initial?.id ? 'Editar regra' : 'Nova regra de alerta'}
              </h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Dispara evento em <code className="bg-neutral-100 px-1 rounded text-[10px]">alert_events</code> quando a condição bater.
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="fechar" className="w-8 h-8 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100">
            <X size={16} />
          </button>
        </header>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <Field label="Nome">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex.: "CPL estourou teto por 3d"'
              className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] focus:outline-none focus:border-brand-500"
            />
          </Field>

          <Field label="Escopo">
            <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
              {(['global', 'client'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScopeType(s)}
                  className={`flex-1 py-1.5 rounded-md text-[12px] font-medium ${
                    scopeType === s ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-600'
                  }`}
                >
                  {s === 'global' ? 'Toda a carteira' : 'Clientes específicos'}
                </button>
              ))}
            </div>
          </Field>

          {scopeType === 'client' && (
            <Field label="Clientes afetados">
              <select
                multiple
                value={targetIds}
                onChange={(e) =>
                  setTargetIds(Array.from(e.target.selectedOptions).map((o) => o.value))
                }
                className="w-full min-h-[120px] px-3 py-2 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-neutral-500">Cmd/Ctrl+click para selecionar múltiplos</span>
            </Field>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Field label="Métrica">
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as AlertMetric)}
                className="w-full h-10 px-2 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
              >
                {metricOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </Field>
            <Field label="Operador">
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as AlertOperator)}
                className="w-full h-10 px-2 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
              >
                {operatorOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </Field>
            <Field label="Valor">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] tabular focus:outline-none focus:border-brand-500"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Unidade">
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as AlertUnit)}
                className="w-full h-10 px-2 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
              >
                {unitOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </Field>
            <Field label="Janela">
              <select
                value={window}
                onChange={(e) => setWindow(e.target.value as AlertWindow)}
                className="w-full h-10 px-2 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
              >
                {windowOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </Field>
            <Field label="Cooldown">
              <select
                value={cooldown}
                onChange={(e) => setCooldown(e.target.value)}
                className="w-full h-10 px-2 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
              >
                <option value="6h">6 horas</option>
                <option value="12h">12 horas</option>
                <option value="24h">24 horas</option>
                <option value="3d">3 dias</option>
              </select>
            </Field>
          </div>

          <Field label="Canais de notificação">
            <div className="flex flex-wrap gap-2">
              {channels.map((c) => {
                const on = channelsSel.includes(c.value)
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleChannel(c.value)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border ${
                      on
                        ? 'bg-brand-50 text-brand-700 border-brand-200'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <label className="flex items-center gap-2 text-[13px] text-neutral-700">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
            Regra ativa — dispara no próximo tick (cron `alerts-evaluate`)
          </label>

          {error && (
            <div className="text-[12px] text-error-600 bg-error-50 border border-error-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 bg-neutral-50 border-t border-neutral-100 rounded-b-2xl">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            {initial?.id ? 'Salvar' : 'Criar regra'}
          </button>
        </footer>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-neutral-700 eyebrow">{label}</span>
      {children}
    </label>
  )
}
