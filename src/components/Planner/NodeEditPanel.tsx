/**
 * ============================================
 * NODE EDIT PANEL — edit any node's data inline
 * ============================================
 * Opens as a slide-over panel on the right side of the Planner
 * when the user clicks on a node. Shows all editable fields for
 * the selected node type. Changes are applied to the React state
 * immediately (and auto-saved via the 2s debounce).
 *
 * Supports ALL node types — uses a generic key/value editor for
 * fields not explicitly handled. The gestor can edit labels,
 * metrics, audience targeting, budgets, etc.
 * ============================================
 */

import { useState, useEffect, useCallback } from 'react'
import type { Node } from 'reactflow'

interface NodeEditPanelProps {
  node: Node | null
  onClose: () => void
  onUpdate: (nodeId: string, newData: Record<string, unknown>) => void
}

export default function NodeEditPanel({ node, onClose, onUpdate }: NodeEditPanelProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (node?.data) {
      setFormData({ ...node.data })
    }
  }, [node])

  const handleChange = useCallback(
    (key: string, value: string | number | boolean) => {
      setFormData((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleSave = useCallback(() => {
    if (!node) return
    onUpdate(node.id, formData)
    onClose()
  }, [node, formData, onUpdate, onClose])

  if (!node) return null

  const nodeType = node.type || 'unknown'

  // Define which fields to show based on node type
  const fields = getFieldsForType(nodeType, formData)

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-xl z-20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Editar node</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{nodeType}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-md transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={String(formData[field.key] ?? '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder={field.placeholder}
              />
            ) : field.type === 'number' ? (
              <input
                type="number"
                value={String(formData[field.key] ?? '')}
                onChange={(e) => handleChange(field.key, Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                placeholder={field.placeholder}
                step={field.step}
              />
            ) : field.type === 'select' ? (
              <select
                value={String(formData[field.key] ?? '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={String(formData[field.key] ?? '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}

// =============================================================
// FIELD DEFINITIONS PER NODE TYPE
// =============================================================

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'select'
  placeholder?: string
  step?: string
  options?: string[]
}

function getFieldsForType(nodeType: string, data: Record<string, unknown>): FieldDef[] {
  switch (nodeType) {
    case 'trafficSource':
    case 'traffic_source':
      return [
        { key: 'label', label: 'Nome', type: 'text', placeholder: 'Meta Ads' },
        { key: 'platform', label: 'Plataforma', type: 'select', options: ['Meta', 'Google', 'LinkedIn', 'TikTok', 'YouTube', 'Email'] },
        { key: 'budgetType', label: 'Tipo de orçamento', type: 'select', options: ['CBO', 'ABO', 'ABO (Automático)', 'Lifetime'] },
        { key: 'budget', label: 'Orçamento diário (centavos)', type: 'number', step: '100' },
        { key: 'spent', label: 'Investido (R$)', type: 'number', step: '0.01' },
        { key: 'impressions', label: 'Impressões', type: 'number' },
        { key: 'clicks', label: 'Cliques', type: 'number' },
        { key: 'ctr', label: 'CTR (%)', type: 'number', step: '0.01' },
      ]

    case 'campaign':
      return [
        { key: 'label', label: 'Nome da campanha', type: 'text', placeholder: 'CP01 - Nome' },
        { key: 'objective', label: 'Objetivo', type: 'select', options: ['Engajamento', 'Vendas', 'Tráfego', 'Alcance', 'Leads', 'Reconhecimento', 'Conversão'] },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'paused', 'draft'] },
        { key: 'budgetType', label: 'Tipo de orçamento', type: 'select', options: ['CBO', 'ABO', 'ABO (Automático)', 'Lifetime'] },
        { key: 'budget', label: 'Orçamento diário (centavos)', type: 'number', step: '100' },
        { key: 'spent', label: 'Investido (R$)', type: 'number', step: '0.01' },
        { key: 'impressions', label: 'Impressões', type: 'number' },
        { key: 'clicks', label: 'Cliques', type: 'number' },
        { key: 'ctr', label: 'CTR (%)', type: 'number', step: '0.01' },
        { key: 'conversions', label: 'Conversões', type: 'number' },
        { key: 'costPerResult', label: 'Custo por resultado (R$)', type: 'number', step: '0.01' },
      ]

    case 'adSet':
    case 'ad_set':
      return [
        { key: 'label', label: 'Nome do conjunto', type: 'text' },
        { key: 'budget', label: 'Orçamento diário', type: 'number', step: '100' },
        { key: 'spent', label: 'Investido', type: 'number', step: '0.01' },
        { key: 'optimization', label: 'Otimização', type: 'text', placeholder: 'Conversões, Cliques, etc' },
      ]

    case 'ad':
      return [
        { key: 'label', label: 'Nome do anúncio', type: 'text' },
        { key: 'format', label: 'Formato', type: 'select', options: ['Imagem Única', 'Carrossel', 'Vídeo', 'Stories'] },
        { key: 'headline', label: 'Headline', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'paused'] },
        { key: 'impressions', label: 'Impressões', type: 'number' },
        { key: 'clicks', label: 'Cliques', type: 'number' },
        { key: 'ctr', label: 'CTR (%)', type: 'number', step: '0.01' },
      ]

    case 'audience':
      return [
        { key: 'label', label: 'Nome do público', type: 'text' },
        { key: 'type', label: 'Tipo', type: 'select', options: ['Personalizada', 'Lookalike', 'Salva', 'Interesse', 'Remarketing'] },
        { key: 'size', label: 'Tamanho estimado', type: 'text', placeholder: '~50k' },
        { key: 'demographics', label: 'Detalhamento (idade, gênero, local, interesses)', type: 'textarea', placeholder: 'Mulheres 25-55, Macapá e região, interesse em dermatologia estética' },
        { key: 'source', label: 'Fonte do público', type: 'text', placeholder: 'Visitantes site 180d, Engajou IG 90d' },
      ]

    case 'result':
      return [
        { key: 'label', label: 'Nome do resultado', type: 'text' },
        { key: 'metric', label: 'Métrica', type: 'select', options: ['Leads', 'Vendas', 'Conversões', 'CTR', 'ROI', 'Visualizações', 'Seguidores'] },
        { key: 'value', label: 'Valor realizado', type: 'text' },
        { key: 'target', label: 'Meta', type: 'text' },
        { key: 'percentage', label: 'Percentual atingido', type: 'number' },
      ]

    case 'landingPage':
      return [
        { key: 'label', label: 'Nome da página', type: 'text' },
        { key: 'url', label: 'URL', type: 'text', placeholder: 'https://...' },
      ]

    case 'brand':
      return [
        { key: 'label', label: 'Nome', type: 'text' },
        { key: 'brand', label: 'Marca', type: 'select', options: ['whatsapp', 'meta', 'facebook', 'instagram', 'google', 'youtube', 'linkedin', 'tiktok', 'twitter', 'telegram', 'email', 'messenger', 'shopify', 'wordpress', 'hubspot', 'mailchimp', 'slack', 'stripe', 'zapier', 'spotify'] },
        { key: 'subtitle', label: 'Subtítulo', type: 'text' },
      ]

    case 'postit':
      return [
        { key: 'label', label: 'Texto', type: 'textarea' },
        { key: 'color', label: 'Cor', type: 'select', options: ['#fbbf24', '#fb923c', '#f87171', '#a78bfa', '#60a5fa', '#34d399'] },
      ]

    case 'advancedText':
      return [
        { key: 'text', label: 'Conteúdo', type: 'textarea' },
        { key: 'fontSize', label: 'Tamanho da fonte', type: 'number' },
        { key: 'fontFamily', label: 'Fonte', type: 'select', options: ['Inter', 'Roboto', 'Montserrat'] },
      ]

    default:
      // Generic: show all string/number fields from data
      return Object.entries(data)
        .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
        .map(([key]) => ({
          key,
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
          type: typeof data[key] === 'number' ? 'number' as const : 'text' as const,
        }))
  }
}
