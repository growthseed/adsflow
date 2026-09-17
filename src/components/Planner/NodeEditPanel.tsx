/**
 * ============================================
 * NODE EDIT PANEL — edit any node's data inline
 * ============================================
 * Opens as a slide-over panel on the right side of the Planner
 * when the user clicks on a node. Shows all editable fields for
 * the selected node type. Changes are applied to the React state
 * on Apply (and auto-saved via the 2s debounce).
 *
 * Supports ALL node types — uses a generic key/value editor for
 * fields not explicitly handled. The gestor can edit labels,
 * metrics, audience targeting, budgets, etc.
 * ============================================
 */

import { useState, useCallback } from 'react'
import type { Node } from '@xyflow/react'
import { X } from 'lucide-react'
import { PLANNER_STAGES } from './plannerModel'

interface NodeEditPanelProps {
  node: Node | null
  onClose: () => void
  onUpdate: (nodeId: string, newData: Record<string, unknown>) => void
}

export default function NodeEditPanel({ node, onClose, onUpdate }: NodeEditPanelProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => ({ ...node?.data }))

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
    <div className="planner-inspector absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-xl z-20 flex flex-col overflow-hidden" role="dialog" aria-label="Editar node">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Editar node</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{nodeType}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar propriedades"
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-md transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <label className="block text-xs">Etapa<select className="block w-full border rounded-md p-2 mt-1" value={String(formData.stage ?? '')} onChange={e => handleChange('stage', e.target.value)}><option value="">Sem etapa</option>{PLANNER_STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></label>
        {nodeType === 'clientLogo' && <>
          <label className="block text-xs">Tamanho<select className="block w-full border rounded-md p-2 mt-1" value={String(formData.size ?? 'M')} onChange={e => handleChange('size', e.target.value)}><option value="S">Compacto</option><option value="M">Médio</option><option value="L">Destaque</option></select></label>
          <label className="block text-xs">Enquadramento<select className="block w-full border rounded-md p-2 mt-1" value={String(formData.fit ?? 'contain')} onChange={e => handleChange('fit', e.target.value)}><option value="contain">Marca inteira</option><option value="cover">Preencher círculo</option></select></label>
          <label className="flex items-center justify-between text-xs">Fundo<input aria-label="Cor de fundo" type="color" value={String(formData.background ?? '#ffffff')} onChange={e => handleChange('background', e.target.value)} /></label>
          <label className="block text-xs">Margem interna<input className="w-full" aria-label="Margem interna" type="range" min="0" max="20" value={Number(formData.padding ?? 8)} onChange={e => handleChange('padding', Number(e.target.value))} /></label>
        </>}
        {fields.map((field) => (
          <div key={field.key}>
            <label htmlFor={`node-field-${field.key}`} className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={`node-field-${field.key}`}
                value={String(formData[field.key] ?? '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder={field.placeholder}
              />
            ) : field.type === 'number' ? (
              <input
                id={`node-field-${field.key}`}
                type="number"
                value={String(formData[field.key] ?? '')}
                onChange={(e) => handleChange(field.key, Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                placeholder={field.placeholder}
                step={field.step}
              />
            ) : field.type === 'select' ? (
              <select
                id={`node-field-${field.key}`}
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
                id={`node-field-${field.key}`}
                type="text"
                value={String(formData[field.key] ?? '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
        <label className="block text-xs">Anotações<textarea className="w-full border rounded-md p-2 mt-1" rows={3} value={String(formData.notes ?? '')} onChange={e => handleChange('notes', e.target.value)} /></label>
        <label className="block text-xs">Link da demanda<input type="url" className="w-full border rounded-md p-2 mt-1" value={String(formData.taskUrl ?? '')} onChange={e => handleChange('taskUrl', e.target.value)} /></label>
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
    case 'clientLogo':
      return [{ key: 'label', label: 'Nome', type: 'text' }]
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
        { key: 'url', label: 'URL (a miniatura real é capturada automaticamente)', type: 'text', placeholder: 'https://...' },
      ]

    case 'funnelPage':
      return [
        { key: 'label', label: 'Nome da página', type: 'text' },
        { key: 'pageType', label: 'Tipo', type: 'select', options: ['landing', 'home', 'product', 'category', 'blog', 'checkout', 'cart', 'thank_you', 'confirmation', 'form', 'webinar', 'video'] },
        { key: 'url', label: 'URL (a miniatura real é capturada automaticamente)', type: 'text', placeholder: 'https://...' },
        { key: 'visitors', label: 'Visitantes', type: 'number' },
        { key: 'bounceRate', label: 'Bounce (%)', type: 'number', step: '0.1' },
        { key: 'avgTimeOnPage', label: 'Tempo médio (s)', type: 'number' },
      ]

    case 'funnelSource':
      return [
        { key: 'label', label: 'Nome da fonte', type: 'text' },
        { key: 'sourceType', label: 'Tipo', type: 'select', options: ['google_ads', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'email', 'sms', 'organic', 'direct', 'referral', 'affiliate'] },
        { key: 'visitors', label: 'Visitantes', type: 'number' },
        { key: 'cost', label: 'Investimento (R$)', type: 'number', step: '0.01' },
      ]

    case 'funnelAction':
      return [
        { key: 'label', label: 'Nome da ação', type: 'text' },
        { key: 'actionType', label: 'Tipo', type: 'select', options: ['click', 'view', 'scroll', 'submit', 'download', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase', 'subscribe', 'unsubscribe'] },
        { key: 'count', label: 'Ocorrências', type: 'number' },
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

    case 'leadJourney':
      return [
        { key: 'label', label: 'Nome da jornada', type: 'text', placeholder: 'Funil Matrículas Q2' },
        { key: 'period_label', label: 'Período', type: 'text', placeholder: '2026-Q2' },
        { key: 'forecast_end_of_period', label: 'Projeção fim do período', type: 'number', step: '1' },
        { key: 'forecast_target', label: 'Meta final do período', type: 'number', step: '1' },
      ]

    case 'goal':
      return [
        { key: 'label', label: 'Nome da meta', type: 'text', placeholder: 'Leads qualificados' },
        { key: 'objective', label: 'Objetivo', type: 'select', options: ['awareness', 'reach', 'engagement', 'lead_gen', 'lead_qualification', 'sales_direct', 'sales_complex', 'retention', 'local_traffic'] },
        { key: 'metric_key', label: 'Métrica', type: 'text', placeholder: 'leads, cpl, roas, reach...' },
        { key: 'period', label: 'Período', type: 'select', options: ['daily', 'weekly', 'monthly', 'quarterly', 'custom'] },
        { key: 'active_range', label: 'Quarter/Range ativo', type: 'text', placeholder: '2026-Q2' },
        { key: 'data_source', label: 'Fonte de dados', type: 'select', options: ['manual', 'google_ads', 'meta_ads', 'ga4', 'kommo', 'blended'] },
        { key: 'account_ref', label: 'ID da conta (opcional)', type: 'text', placeholder: 'act_123 ou 4965532144' },
        { key: 'realized', label: 'Realizado', type: 'number', step: '0.01' },
      ]

    default:
      // Generic: show all string/number fields from data
      return Object.entries(data)
        .filter(([key, v]) => !['stage', 'notes', 'taskUrl'].includes(key) && !key.startsWith('thumbnail') && (typeof v === 'string' || typeof v === 'number'))
        .map(([key]) => ({
          key,
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
          type: typeof data[key] === 'number' ? 'number' as const : 'text' as const,
        }))
  }
}
