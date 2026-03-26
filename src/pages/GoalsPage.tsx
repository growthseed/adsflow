/**
 * ============================================
 * GOALS PAGE — Controle de Metas
 * ============================================
 * Sistema de metas por métrica/plataforma,
 * progresso visual, alertas e timeline de marketing.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Trash2,
  Edit3,
  X,
  Bell,
  BellOff,
  Calendar,
  Megaphone,
  DollarSign,
  Palette,
  StickyNote,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { goalsService } from '@/services/goalsService'
import type {
  MetricGoal,
  GoalWithProgress,
  TimelineEvent,
  CreateGoalData,
  CreateTimelineData,
} from '@/services/goalsService'

// =====================================================
// CONSTANTS
// =====================================================

const METRICS = [
  { value: 'leads', label: 'Leads', icon: Target, format: 'number' },
  { value: 'conversions', label: 'Conversões', icon: CheckCircle2, format: 'number' },
  { value: 'spend', label: 'Investimento', icon: DollarSign, format: 'currency' },
  { value: 'roas', label: 'ROAS', icon: TrendingUp, format: 'decimal' },
  { value: 'cpl', label: 'CPL', icon: DollarSign, format: 'currency' },
  { value: 'revenue', label: 'Receita', icon: DollarSign, format: 'currency' },
  { value: 'sessions', label: 'Sessões', icon: BarChart3, format: 'number' },
  { value: 'ctr', label: 'CTR', icon: TrendingUp, format: 'percent' },
]

const PLATFORMS = [
  { value: 'all', label: 'Todas' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'ga4', label: 'GA4' },
]

const PERIODS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
]

const TIMELINE_TYPES = [
  { value: 'milestone', label: 'Marco', icon: Target },
  { value: 'campaign_launch', label: 'Lançamento de Campanha', icon: Megaphone },
  { value: 'budget_change', label: 'Mudança de Orçamento', icon: DollarSign },
  { value: 'creative_change', label: 'Mudança de Criativo', icon: Palette },
  { value: 'note', label: 'Nota', icon: StickyNote },
]

const PERIOD_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

const PLATFORM_LABELS: Record<string, string> = {
  all: 'Todas',
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  ga4: 'GA4',
}

// =====================================================
// HELPERS
// =====================================================

function formatMetricValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    case 'percent':
      return `${value.toFixed(2)}%`
    case 'decimal':
      return `${value.toFixed(2)}x`
    default:
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString('pt-BR')
  }
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function getProgressBg(pct: number): string {
  if (pct >= 80) return 'bg-emerald-50'
  if (pct >= 50) return 'bg-amber-50'
  return 'bg-red-50'
}

function getProgressText(pct: number): string {
  if (pct >= 80) return 'text-emerald-700'
  if (pct >= 50) return 'text-amber-700'
  return 'text-red-700'
}

function getTimelineIcon(type: string) {
  const found = TIMELINE_TYPES.find((t) => t.value === type)
  return found?.icon || StickyNote
}

// =====================================================
// GOAL CARD
// =====================================================

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: GoalWithProgress
  onEdit: (g: GoalWithProgress) => void
  onDelete: (id: string) => void
}) {
  const metricDef = METRICS.find((m) => m.value === goal.metric)
  const Icon = metricDef?.icon || Target
  const format = metricDef?.format || 'number'
  const capped = Math.min(goal.progress_pct, 100)

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getProgressBg(goal.progress_pct)}`}>
            <Icon className={`w-4.5 h-4.5 ${getProgressText(goal.progress_pct)}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {metricDef?.label || goal.metric}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                {PLATFORM_LABELS[goal.platform || 'all']}
              </span>
              <span className="text-[10px] text-slate-300">|</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                {PERIOD_LABELS[goal.period]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(goal)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Values */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-slate-900">
            {formatMetricValue(goal.current_value, format)}
          </p>
          <p className="text-xs text-slate-400">
            de {formatMetricValue(goal.target_value, format)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {goal.trend > 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : goal.trend < 0 ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span
            className={`text-xs font-semibold ${
              goal.trend > 0
                ? 'text-emerald-600'
                : goal.trend < 0
                ? 'text-red-600'
                : 'text-slate-400'
            }`}
          >
            {goal.trend > 0 ? '+' : ''}
            {goal.trend.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(goal.progress_pct)}`}
          style={{ width: `${capped}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-xs font-semibold ${getProgressText(goal.progress_pct)}`}>
          {goal.progress_pct.toFixed(1)}%
        </span>
        {goal.alert_enabled ? (
          <Bell className="w-3 h-3 text-slate-300" />
        ) : (
          <BellOff className="w-3 h-3 text-slate-300" />
        )}
      </div>
    </div>
  )
}

// =====================================================
// GOAL MODAL
// =====================================================

function GoalModal({
  open,
  goal,
  clientId,
  userId,
  onClose,
  onSave,
}: {
  open: boolean
  goal: MetricGoal | null
  clientId: string
  userId: string
  onClose: () => void
  onSave: () => void
}) {
  const [metric, setMetric] = useState('leads')
  const [platform, setPlatform] = useState('all')
  const [targetValue, setTargetValue] = useState('')
  const [period, setPeriod] = useState('monthly')
  const [alertEnabled, setAlertEnabled] = useState(true)
  const [alertThreshold, setAlertThreshold] = useState('20')
  const [alertEmail, setAlertEmail] = useState(true)
  const [alertWhatsapp, setAlertWhatsapp] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (goal) {
      setMetric(goal.metric)
      setPlatform(goal.platform || 'all')
      setTargetValue(goal.target_value.toString())
      setPeriod(goal.period)
      setAlertEnabled(goal.alert_enabled)
      setAlertThreshold(goal.alert_threshold_pct.toString())
      setAlertEmail(goal.alert_email)
      setAlertWhatsapp(goal.alert_whatsapp)
    } else {
      setMetric('leads')
      setPlatform('all')
      setTargetValue('')
      setPeriod('monthly')
      setAlertEnabled(true)
      setAlertThreshold('20')
      setAlertEmail(true)
      setAlertWhatsapp(false)
    }
  }, [goal, open])

  const handleSubmit = async () => {
    if (!targetValue || Number(targetValue) <= 0) return
    setSaving(true)
    try {
      if (goal) {
        await goalsService.updateGoal(goal.id, {
          target_value: Number(targetValue),
          period,
          alert_threshold_pct: Number(alertThreshold),
          alert_enabled: alertEnabled,
          alert_email: alertEmail,
          alert_whatsapp: alertWhatsapp,
        })
      } else {
        const data: CreateGoalData = {
          client_id: clientId,
          metric,
          platform,
          target_value: Number(targetValue),
          period,
          alert_threshold_pct: Number(alertThreshold),
          alert_enabled: alertEnabled,
          alert_email: alertEmail,
          alert_whatsapp: alertWhatsapp,
          created_by: userId,
        }
        await goalsService.createGoal(data)
      }
      onSave()
      onClose()
    } catch (err) {
      console.error('Erro ao salvar meta:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {goal ? 'Editar Meta' : 'Nova Meta'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Metric */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Métrica</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              disabled={!!goal}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
            >
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Plataforma</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              disabled={!!goal}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Value */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Meta</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Ex: 500"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Período</label>
            <div className="flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    period === p.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Alertas</span>
              <button
                onClick={() => setAlertEnabled(!alertEnabled)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  alertEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    alertEnabled ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {alertEnabled && (
              <>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    Alertar quando abaixo de (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    E-mail
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertWhatsapp}
                      onChange={(e) => setAlertWhatsapp(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    WhatsApp
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !targetValue}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : goal ? 'Atualizar' : 'Criar Meta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// TIMELINE MODAL
// =====================================================

function TimelineModal({
  open,
  clientId,
  userId,
  onClose,
  onSave,
}: {
  open: boolean
  clientId: string
  userId: string
  onClose: () => void
  onSave: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('milestone')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const data: CreateTimelineData = {
        client_id: clientId,
        title: title.trim(),
        description: description.trim() || null,
        type,
        date: new Date(date).toISOString(),
        created_by: userId,
      }
      await goalsService.addTimelineEvent(data)
      onSave()
      onClose()
      setTitle('')
      setDescription('')
      setType('milestone')
    } catch (err) {
      console.error('Erro ao criar evento:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Adicionar Marco</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lançamento campanha Black Friday"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TIMELINE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Descrição <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalhes sobre este evento..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function GoalsPage() {
  const { user, activeClient } = useAuth()
  const clientId = activeClient?.client_id || ''

  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<MetricGoal | null>(null)
  const [timelineModalOpen, setTimelineModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!clientId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [goalsData, timelineData] = await Promise.all([
        goalsService.getGoalsSummary(clientId),
        goalsService.getTimeline(clientId),
      ])
      setGoals(goalsData)
      setTimeline(timelineData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleEditGoal = (goal: GoalWithProgress) => {
    setEditingGoal(goal)
    setGoalModalOpen(true)
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm('Excluir esta meta?')) return
    try {
      await goalsService.deleteGoal(goalId)
      loadData()
    } catch (err) {
      console.error('Erro ao excluir:', err)
    }
  }

  const handleDeleteTimeline = async (eventId: string) => {
    if (!window.confirm('Excluir este evento?')) return
    try {
      await goalsService.deleteTimelineEvent(eventId)
      loadData()
    } catch (err) {
      console.error('Erro ao excluir:', err)
    }
  }

  // Summary stats
  const onTrack = goals.filter((g) => g.progress_pct >= 80).length
  const attention = goals.filter((g) => g.progress_pct >= 50 && g.progress_pct < 80).length
  const offTrack = goals.filter((g) => g.progress_pct < 50).length

  if (!clientId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Selecione um cliente</h2>
          <p className="text-sm text-slate-500">Escolha um cliente na sidebar para gerenciar metas.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Controle de Metas</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeClient?.client.name} — Acompanhe o progresso das suas metas de marketing
          </p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null)
            setGoalModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {/* Summary Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{onTrack}</p>
            <p className="text-xs font-medium text-emerald-600 mt-1">No caminho</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{attention}</p>
            <p className="text-xs font-medium text-amber-600 mt-1">Atenção</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{offTrack}</p>
            <p className="text-xs font-medium text-red-600 mt-1">Fora da meta</p>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-slate-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-1" />
                  <div className="h-3 bg-slate-100 rounded w-16" />
                </div>
              </div>
              <div className="h-8 bg-slate-200 rounded w-32 mb-2" />
              <div className="h-2 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Nenhuma meta definida</h3>
          <p className="text-sm text-slate-500 mb-4">
            Crie metas para acompanhar o desempenho das suas campanhas.
          </p>
          <button
            onClick={() => {
              setEditingGoal(null)
              setGoalModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Criar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}

      {/* Timeline Section */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Timeline de Marketing</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Marcos, lançamentos e mudanças importantes
            </p>
          </div>
          <button
            onClick={() => setTimelineModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar marco
          </button>
        </div>

        <div className="p-5">
          {timeline.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhum evento na timeline</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-100" />

              <div className="space-y-4">
                {timeline.map((event) => {
                  const TypeIcon = getTimelineIcon(event.type)
                  return (
                    <div key={event.id} className="flex gap-4 relative group">
                      <div className="w-9 h-9 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center shrink-0 z-10">
                        <TypeIcon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteTimeline(event.id)}
                            className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px] text-slate-400">
                            {new Date(event.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
                            {TIMELINE_TYPES.find((t) => t.value === event.type)?.label || event.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <GoalModal
        open={goalModalOpen}
        goal={editingGoal}
        clientId={clientId}
        userId={user?.id || ''}
        onClose={() => {
          setGoalModalOpen(false)
          setEditingGoal(null)
        }}
        onSave={loadData}
      />

      <TimelineModal
        open={timelineModalOpen}
        clientId={clientId}
        userId={user?.id || ''}
        onClose={() => setTimelineModalOpen(false)}
        onSave={loadData}
      />
    </div>
  )
}
