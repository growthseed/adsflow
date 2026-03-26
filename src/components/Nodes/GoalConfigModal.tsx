/**
 * GOAL CONFIG MODAL
 * Efeito Digital - Ads Flow
 *
 * Modal for setting/editing node goals (meta).
 * Shows metric selector, target value, period, and current actual value.
 */

import React, { useState, useEffect } from 'react'
import { X, Target, Trash2 } from 'lucide-react'
import type { NodeGoal, AggregatedNodeMetrics } from '@/services/flowAnalyticsService'
import {
  setNodeGoal,
  deleteNodeGoal,
  getNodeGoals,
} from '@/services/flowAnalyticsService'

// =====================================================
// TYPES
// =====================================================

export interface GoalConfigModalProps {
  flowId: string
  nodeId: string
  nodeLabel: string
  clientId?: string
  metrics: AggregatedNodeMetrics | null
  onClose: () => void
  onSaved: () => void
}

const METRIC_OPTIONS = [
  { value: 'visits', label: 'Visitas', unit: '' },
  { value: 'leads', label: 'Leads', unit: '' },
  { value: 'conversions', label: 'Conversoes', unit: '' },
  { value: 'revenue', label: 'Receita', unit: 'R$' },
] as const

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
] as const

function getActualValue(metrics: AggregatedNodeMetrics | null, metric: string): number {
  if (!metrics) return 0
  switch (metric) {
    case 'visits': return metrics.visits
    case 'leads': return metrics.leads
    case 'conversions': return metrics.conversions
    case 'revenue': return metrics.revenue
    default: return 0
  }
}

// =====================================================
// COMPONENT
// =====================================================

const GoalConfigModal: React.FC<GoalConfigModalProps> = ({
  flowId,
  nodeId,
  nodeLabel,
  clientId,
  metrics,
  onClose,
  onSaved,
}) => {
  const [existingGoals, setExistingGoals] = useState<NodeGoal[]>([])
  const [selectedMetric, setSelectedMetric] = useState('visits')
  const [targetValue, setTargetValue] = useState('')
  const [period, setPeriod] = useState('monthly')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Load existing goals
  useEffect(() => {
    async function load() {
      const goals = await getNodeGoals(flowId, nodeId)
      setExistingGoals(goals)
    }
    load()
  }, [flowId, nodeId])

  const handleSave = async () => {
    const value = parseFloat(targetValue)
    if (isNaN(value) || value <= 0) return

    setIsSaving(true)
    const result = await setNodeGoal(flowId, nodeId, selectedMetric, value, period, clientId)
    setIsSaving(false)

    if (result) {
      // Refresh goals list
      const goals = await getNodeGoals(flowId, nodeId)
      setExistingGoals(goals)
      setTargetValue('')
      onSaved()
    }
  }

  const handleDelete = async (goalId: string) => {
    setIsDeleting(goalId)
    const ok = await deleteNodeGoal(goalId)
    setIsDeleting(null)

    if (ok) {
      setExistingGoals((prev) => prev.filter((g) => g.id !== goalId))
      onSaved()
    }
  }

  const currentActual = getActualValue(metrics, selectedMetric)
  const metricInfo = METRIC_OPTIONS.find((m) => m.value === selectedMetric)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Target className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm">Definir Meta</h3>
              <p className="text-xs text-white/80 truncate max-w-[240px]">{nodeLabel || nodeId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Existing goals */}
          {existingGoals.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Metas Ativas
              </label>
              <div className="space-y-1.5">
                {existingGoals.map((goal) => {
                  const actual = getActualValue(metrics, goal.metric)
                  const pct = goal.target_value > 0 ? Math.round((actual / goal.target_value) * 100) : 0
                  const label = METRIC_OPTIONS.find((m) => m.value === goal.metric)?.label || goal.metric
                  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === goal.period)?.label || goal.period

                  return (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700">
                          {label} — Meta: {goal.target_value.toLocaleString('pt-BR')} ({periodLabel})
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Realizado: {actual.toLocaleString('pt-BR')} ({pct}%)
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        disabled={isDeleting === goal.id}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0 ml-2"
                        title="Remover meta"
                      >
                        {isDeleting === goal.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* New goal form */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Nova Meta
            </label>

            {/* Metric selector */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {METRIC_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedMetric(opt.value)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedMetric === opt.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Current actual value context */}
            <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Valor atual ({metricInfo?.label})
              </div>
              <div className="text-lg font-bold text-slate-800">
                {metricInfo?.unit && <span className="text-sm text-slate-400 mr-0.5">{metricInfo.unit}</span>}
                {currentActual.toLocaleString('pt-BR')}
              </div>
            </div>

            {/* Target value */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Valor da Meta
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 1000"
              />
            </div>

            {/* Period selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Periodo
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      period === opt.value
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !targetValue || parseFloat(targetValue) <= 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSaving ? 'Salvando...' : 'Salvar Meta'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoalConfigModal
