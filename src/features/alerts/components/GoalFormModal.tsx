import { useEffect, useState } from 'react'
import { Loader2, Target, X } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import type { AgencyGoal } from '../types'

interface ClientOption {
  id: string
  name: string
}

interface Props {
  open: boolean
  initial?: AgencyGoal | null
  onClose: () => void
  onSaved: () => void
}

type GoalMetric = AgencyGoal['metric']
type GoalDir = AgencyGoal['direction']
type GoalUnit = AgencyGoal['unit']
type GoalHorizon = AgencyGoal['horizon']

const metricOptions: Array<{ value: GoalMetric; label: string; defaultUnit: GoalUnit; defaultDir: GoalDir }> = [
  { value: 'leads',        label: 'Leads (total)',        defaultUnit: 'count',    defaultDir: 'maximize' },
  { value: 'conversions',  label: 'Conversões',            defaultUnit: 'count',    defaultDir: 'maximize' },
  { value: 'roas',         label: 'ROAS',                  defaultUnit: 'ratio',    defaultDir: 'maximize' },
  { value: 'cpl',          label: 'CPL (teto)',            defaultUnit: 'currency', defaultDir: 'cap' },
  { value: 'cpm',          label: 'CPM (teto)',            defaultUnit: 'currency', defaultDir: 'cap' },
  { value: 'ctr',          label: 'CTR (mínimo)',          defaultUnit: 'percent',  defaultDir: 'maximize' },
  { value: 'spend',        label: 'Investido (teto)',      defaultUnit: 'currency', defaultDir: 'cap' },
  { value: 'sales',        label: 'Vendas atribuídas',     defaultUnit: 'count',    defaultDir: 'maximize' },
  { value: 'appointments', label: 'Agendamentos',          defaultUnit: 'count',    defaultDir: 'maximize' },
]

const horizonOptions: Array<{ value: GoalHorizon; label: string }> = [
  { value: 'weekly',    label: 'Semanal' },
  { value: 'monthly',   label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly',    label: 'Anual' },
]

function quarterEnd(now: Date) {
  const q = Math.floor(now.getMonth() / 3)
  return new Date(now.getFullYear(), q * 3 + 3, 0)
}
function monthEnd(now: Date) {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
}
function yearEnd(now: Date) {
  return new Date(now.getFullYear(), 11, 31)
}

function periodBounds(h: GoalHorizon, now: Date) {
  const start = now.toISOString().slice(0, 10)
  let end: Date
  switch (h) {
    case 'weekly': {
      const d = new Date(now)
      d.setDate(d.getDate() + 6)
      end = d
      break
    }
    case 'monthly':   end = monthEnd(now); break
    case 'quarterly': end = quarterEnd(now); break
    case 'yearly':    end = yearEnd(now); break
    default:          end = monthEnd(now)
  }
  return { start, end: end.toISOString().slice(0, 10) }
}

export function GoalFormModal({ open, initial, onClose, onSaved }: Props) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientId, setClientId] = useState(initial?.clientId ?? '')
  const [metric, setMetric] = useState<GoalMetric>(initial?.metric ?? 'leads')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [target, setTarget] = useState<number>(initial?.targetValue ?? 0)
  const [direction, setDirection] = useState<GoalDir>(initial?.direction ?? 'maximize')
  const [unit, setUnit] = useState<GoalUnit>(initial?.unit ?? 'count')
  const [horizon, setHorizon] = useState<GoalHorizon>(initial?.horizon ?? 'quarterly')
  const [periodStart, setPeriodStart] = useState(initial?.periodStart ?? periodBounds('quarterly', new Date()).start)
  const [periodEnd, setPeriodEnd] = useState(initial?.periodEnd ?? periodBounds('quarterly', new Date()).end)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    supabase
      .from('clients')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => setClients(((data as ClientOption[]) ?? [])))
  }, [open])

  // Auto-preenche unit/direction quando muda metric
  useEffect(() => {
    const def = metricOptions.find((m) => m.value === metric)
    if (def) {
      setUnit(def.defaultUnit)
      setDirection(def.defaultDir)
      if (!label) setLabel(def.label)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric])

  useEffect(() => {
    const { start, end } = periodBounds(horizon, new Date())
    setPeriodStart(start)
    setPeriodEnd(end)
  }, [horizon])

  if (!open) return null

  const submit = async () => {
    setError(null)
    if (!clientId) return setError('Selecione o cliente')
    if (!label.trim()) return setError('Informe um label')
    if (!target || target <= 0) return setError('Valor alvo precisa ser maior que zero')

    setSaving(true)
    const { data: session } = await supabase.auth.getUser()
    const userId = session.user?.id
    const payload = {
      client_id: clientId,
      metric,
      label: label.trim(),
      target_value: target,
      direction,
      unit,
      horizon,
      period_start: periodStart,
      period_end: periodEnd,
      active: true,
    }
    const { error: err } = initial?.id
      ? await supabase.from('agency_goals').update(payload).eq('id', initial.id)
      : await supabase.from('agency_goals').insert({ ...payload, created_by: userId })
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
              <Target size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-neutral-900">
                {initial?.id ? 'Editar meta' : 'Nova meta'}
              </h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Alimenta o pacing, os alertas e a visão "Metas" do portal do cliente.
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="fechar" className="w-8 h-8 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100">
            <X size={16} />
          </button>
        </header>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <Field label="Cliente">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
            >
              <option value="">Selecione…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Métrica">
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as GoalMetric)}
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
              >
                {metricOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Horizonte">
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value as GoalHorizon)}
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
              >
                {horizonOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Label (visível no portal)">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex.: Leads do trimestre"
              className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] focus:outline-none focus:border-brand-500"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Valor alvo${direction === 'cap' ? ' (teto)' : ''}`}>
              <input
                type="number"
                min={0}
                step={unit === 'ratio' ? 0.1 : 1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] tabular focus:outline-none focus:border-brand-500"
              />
            </Field>
            <Field label="Direção">
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as GoalDir)}
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
              >
                <option value="maximize">Bater pra cima (maximize)</option>
                <option value="cap">Teto (cap — não passar)</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Início do período">
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] focus:outline-none focus:border-brand-500"
              />
            </Field>
            <Field label="Fim do período">
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] focus:outline-none focus:border-brand-500"
              />
            </Field>
          </div>

          {error && (
            <div className="text-[12px] text-error-600 bg-error-50 border border-error-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 bg-neutral-50 border-t border-neutral-100 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            {initial?.id ? 'Salvar' : 'Criar meta'}
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
