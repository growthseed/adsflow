/**
 * ============================================
 * SCHEDULE MODAL — Report Scheduler
 * ============================================
 * Configura agendamento de envio automático
 * de relatórios por email/WhatsApp.
 */

import { useState, useEffect } from 'react'
import {
  X,
  Clock,
  Calendar,
  Mail,
  Plus,
  Trash2,
  Loader2,
  Send,
} from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  day_of_week?: number
  day_of_month?: number
  time_of_day: string
  recipients: Array<{ email: string; name: string }>
  include_ai_summary: boolean
  include_comparison: boolean
  format: 'pdf' | 'png' | 'link'
}

interface ScheduleModalProps {
  open: boolean
  onClose: () => void
  onSave: (config: ScheduleConfig) => Promise<void>
  initialConfig?: Partial<ScheduleConfig>
  reportName?: string
}

// =====================================================
// CONSTANTS
// =====================================================

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
] as const

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
]

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'png', label: 'PNG (Imagem)' },
  { value: 'link', label: 'Link compartilhável' },
] as const

// =====================================================
// COMPONENT
// =====================================================

export default function ScheduleModal({
  open,
  onClose,
  onSave,
  initialConfig,
  reportName,
}: ScheduleModalProps) {
  const [frequency, setFrequency] = useState<ScheduleConfig['frequency']>(
    initialConfig?.frequency || 'weekly'
  )
  const [dayOfWeek, setDayOfWeek] = useState(initialConfig?.day_of_week ?? 1)
  const [dayOfMonth, setDayOfMonth] = useState(initialConfig?.day_of_month ?? 1)
  const [timeOfDay, setTimeOfDay] = useState(initialConfig?.time_of_day || '08:00')
  const [recipients, setRecipients] = useState<Array<{ email: string; name: string }>>(
    initialConfig?.recipients || []
  )
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [includeAiSummary, setIncludeAiSummary] = useState(
    initialConfig?.include_ai_summary ?? true
  )
  const [includeComparison, setIncludeComparison] = useState(
    initialConfig?.include_comparison ?? true
  )
  const [format, setFormat] = useState<ScheduleConfig['format']>(
    initialConfig?.format || 'pdf'
  )
  const [saving, setSaving] = useState(false)

  // Escape to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleAddRecipient = () => {
    const email = newEmail.trim()
    if (!email || !email.includes('@')) return
    if (recipients.some((r) => r.email === email)) return
    setRecipients([...recipients, { email, name: newName.trim() || email.split('@')[0] }])
    setNewEmail('')
    setNewName('')
  }

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r.email !== email))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        frequency,
        day_of_week: frequency === 'weekly' || frequency === 'biweekly' ? dayOfWeek : undefined,
        day_of_month: frequency === 'monthly' ? dayOfMonth : undefined,
        time_of_day: timeOfDay,
        recipients,
        include_ai_summary: includeAiSummary,
        include_comparison: includeComparison,
        format,
      })
      onClose()
    } catch (err) {
      console.error('Error saving schedule:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Agendar Envio</h2>
              {reportName && (
                <p className="text-xs text-slate-500">{reportName}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1.5 text-slate-400" />
              Frequência
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
                    frequency === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Day of week (weekly/biweekly) */}
          {(frequency === 'weekly' || frequency === 'biweekly') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Dia da semana
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Day of month (monthly) */}
          {frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Dia do mês
              </label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Dia {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Clock className="w-4 h-4 inline mr-1.5 text-slate-400" />
              Horário de envio
            </label>
            <input
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Mail className="w-4 h-4 inline mr-1.5 text-slate-400" />
              Destinatários
            </label>

            {/* Add recipient */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome"
                className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@exemplo.com"
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleAddRecipient}
                disabled={!newEmail.includes('@')}
                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient list */}
            {recipients.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {recipients.map((r) => (
                  <div
                    key={r.email}
                    className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg"
                  >
                    <div>
                      <span className="text-sm text-slate-900">{r.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{r.email}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveRecipient(r.email)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {recipients.length === 0 && (
              <p className="text-xs text-slate-400 italic">Nenhum destinatário adicionado.</p>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-slate-700">Incluir resumo de IA</span>
              <button
                type="button"
                role="switch"
                aria-checked={includeAiSummary}
                onClick={() => setIncludeAiSummary(!includeAiSummary)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeAiSummary ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeAiSummary ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-slate-700">Incluir comparativo de período</span>
              <button
                type="button"
                role="switch"
                aria-checked={includeComparison}
                onClick={() => setIncludeComparison(!includeComparison)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeComparison ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeComparison ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Formato de envio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={`px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
                    format === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || recipients.length === 0}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Salvar Agendamento
          </button>
        </div>
      </div>
    </div>
  )
}
