/**
 * ============================================
 * Custom Metric Modal — Sprint B.2
 * ============================================
 * Admin-only modal to create custom metrics in the registry.
 * Includes formula validation + preview.
 */

import { useState, useCallback, useMemo } from 'react'
import { X, Plus, Beaker, AlertCircle, CheckCircle2 } from 'lucide-react'

import type { MetricDefinition, CampaignObjective, MetricCategory } from '@/types/goalMetrics'
import { OBJECTIVE_LABELS, METRIC_CATEGORY_LABELS } from '@/types/goalMetrics'
import { validateFormula, extractVariables } from '@/lib/formulaEngine'

interface CustomMetricModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (metric: Omit<MetricDefinition, 'is_system'>) => void
  existingKeys: string[]
}

const UNIT_OPTIONS = [
  { value: 'number', label: 'Número' },
  { value: 'currency', label: 'Moeda (R$)' },
  { value: 'percent', label: 'Percentual (%)' },
  { value: 'ratio', label: 'Razão (x)' },
  { value: 'duration', label: 'Duração' },
  { value: 'score', label: 'Score' },
] as const

const DIRECTION_OPTIONS = [
  { value: 'higher_better', label: 'Maior é melhor' },
  { value: 'lower_better', label: 'Menor é melhor' },
  { value: 'neutral', label: 'Neutro' },
] as const

const ALL_OBJECTIVES = Object.entries(OBJECTIVE_LABELS) as [CampaignObjective, string][]
const ALL_CATEGORIES = Object.entries(METRIC_CATEGORY_LABELS) as [MetricCategory, string][]

export default function CustomMetricModal({ isOpen, onClose, onSave, existingKeys }: CustomMetricModalProps) {
  const [key, setKey] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [unit, setUnit] = useState<string>('number')
  const [direction, setDirection] = useState<string>('higher_better')
  const [category, setCategory] = useState<string>('custom')
  const [formula, setFormula] = useState('')
  const [selectedObjectives, setSelectedObjectives] = useState<CampaignObjective[]>([])

  const autoKey = useMemo(
    () => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    [label],
  )

  const effectiveKey = key || autoKey

  const formulaValidation = useMemo(
    () => formula ? validateFormula(formula) : { valid: true },
    [formula],
  )

  const formulaVars = useMemo(
    () => formula ? extractVariables(formula) : [],
    [formula],
  )

  const keyConflict = existingKeys.includes(effectiveKey)

  const canSave = effectiveKey && label && selectedObjectives.length > 0 && !keyConflict && formulaValidation.valid

  const handleToggleObjective = useCallback((obj: CampaignObjective) => {
    setSelectedObjectives((prev) =>
      prev.includes(obj) ? prev.filter((o) => o !== obj) : [...prev, obj],
    )
  }, [])

  const handleSave = useCallback(() => {
    if (!canSave) return
    onSave({
      key: effectiveKey,
      label,
      description,
      unit: unit as MetricDefinition['unit'],
      format: unit === 'currency' ? 'R$ 0.00' : unit === 'percent' ? '0.0%' : unit === 'ratio' ? '0.0x' : '0',
      direction: direction as MetricDefinition['direction'],
      category: category as MetricDefinition['category'],
      objectives: selectedObjectives,
      auto_sources: [],
      formula: formula || undefined,
    })
    onClose()
  }, [canSave, effectiveKey, label, description, unit, direction, category, selectedObjectives, formula, onSave, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Nova Métrica Personalizada</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nome da Métrica *</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Taxa Visita → Matrícula"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Key */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Chave (identificador)
              {keyConflict && <span className="text-red-500 ml-1">— já existe</span>}
            </label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder={autoKey || 'chave_unica'}
              className={`w-full px-3 py-2 text-sm font-mono border rounded-lg ${keyConflict ? 'border-red-300 bg-red-50' : 'border-slate-300'} focus:ring-2 focus:ring-indigo-500`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Percentual de visitas que viraram matrícula"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Unit + Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Unidade</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg">
                {UNIT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Direção</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg">
                {DIRECTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg">
              {ALL_CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>

          {/* Objectives (multi-select chips) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Objetivos aplicáveis *</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_OBJECTIVES.map(([obj, lbl]) => (
                <button
                  key={obj}
                  type="button"
                  onClick={() => handleToggleObjective(obj)}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                    selectedObjectives.includes(obj)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Formula */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1">
              <Beaker className="w-3.5 h-3.5" />
              Fórmula (opcional)
            </label>
            <input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="matriculas / visitas_agendadas * 100"
              className={`w-full px-3 py-2 text-sm font-mono border rounded-lg ${
                formula && !formulaValidation.valid ? 'border-red-300 bg-red-50' : 'border-slate-300'
              } focus:ring-2 focus:ring-indigo-500`}
            />
            {formula && (
              <div className="mt-1.5 flex items-start gap-1.5">
                {formulaValidation.valid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-emerald-600">
                      Fórmula válida
                      {formulaVars.length > 0 && (
                        <> — variáveis: <code className="bg-emerald-50 px-1 rounded">{formulaVars.join(', ')}</code></>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-red-600">{formulaValidation.error}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Criar Métrica
          </button>
        </div>
      </div>
    </div>
  )
}
