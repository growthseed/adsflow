import { useState } from "react"
import type { CampaignData } from "@/components/Nodes/CampaignNode"

interface CampaignFormProps {
  data: CampaignData
  onUpdate: (data: CampaignData) => void
  onClose: () => void
}

const CampaignForm = ({ data, onUpdate, onClose }: CampaignFormProps) => {
  const [formData, setFormData] = useState<CampaignData>(data)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
    onClose()
  }

  const isActive = formData.status === 'active'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Editar Campanha</h2>
          
          {/* Toggle ON/OFF Elegante */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
              {isActive ? 'Ativa' : 'Inativa'}
            </span>
            <button
              type="button"
              onClick={() => setFormData({ 
                ...formData, 
                status: isActive ? 'paused' : 'active' 
              })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isActive 
                  ? 'bg-green-600 focus:ring-green-500' 
                  : 'bg-gray-300 focus:ring-gray-400'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                  isActive ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome/Label */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Nome da Campanha <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ex: Campanha Verão 2025"
              required
            />
          </div>

          {/* Objetivo */}
          <div>
            <label className="block text-sm font-medium mb-1">Objetivo</label>
            <select
              value={formData.objective || ''}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione...</option>
              <option value="Reconhecimento">🎯 Reconhecimento de Marca</option>
              <option value="Tráfego">🚀 Tráfego</option>
              <option value="Engajamento">💬 Engajamento</option>
              <option value="Leads">📋 Geração de Leads</option>
              <option value="Conversões">💰 Conversões</option>
              <option value="Vendas">🛒 Vendas de Catálogo</option>
              <option value="Visualizações de Vídeo">🎬 Visualizações de Vídeo</option>
            </select>
          </div>

          {/* Status Secundário (Rascunho) */}
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: formData.status === 'draft' ? 'paused' : 'draft' })}
                className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${
                  formData.status === 'draft'
                    ? 'border-gray-500 bg-gray-50 text-gray-700 font-semibold'
                    : 'border-gray-300 hover:border-gray-400 text-gray-600'
                }`}
              >
                {formData.status === 'draft' ? '✓ ' : ''}📝 Rascunho
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'paused' })}
                className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${
                  formData.status === 'paused'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700 font-semibold'
                    : 'border-gray-300 hover:border-gray-400 text-gray-600'
                }`}
              >
                {formData.status === 'paused' ? '✓ ' : ''}⏸️ Pausada
              </button>
            </div>
          </div>

          {/* Divisor */}
          <hr className="my-6" />
          <h3 className="font-semibold text-gray-700 mb-3">💰 Orçamento e Investimento</h3>

          {/* Tipo de Orçamento */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Orçamento</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, budgetType: 'daily' })}
                className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${
                  formData.budgetType === 'daily'
                    ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                💵 Diário
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, budgetType: 'lifetime' })}
                className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${
                  formData.budgetType === 'lifetime'
                    ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                📅 Total (Lifetime)
              </button>
            </div>
          </div>

          {/* Orçamento e Gasto em Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Orçamento {formData.budgetType === 'daily' ? 'Diário' : 'Total'}
              </label>
              <input
                type="number"
                value={formData.budget ?? ''}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Gasto Atual</label>
              <input
                type="number"
                value={formData.spent ?? ''}
                onChange={(e) => setFormData({ ...formData, spent: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Divisor */}
          <hr className="my-6" />
          <h3 className="font-semibold text-gray-700 mb-3">📊 Métricas de Performance</h3>

          {/* Impressões e Alcance em Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Impressões</label>
              <input
                type="number"
                value={formData.impressions ?? ''}
                onChange={(e) => setFormData({ ...formData, impressions: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Alcance 🎯
              </label>
              <input
                type="number"
                value={formData.reach ?? ''}
                onChange={(e) => setFormData({ ...formData, reach: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Cliques e CTR em Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cliques</label>
              <input
                type="number"
                value={formData.clicks ?? ''}
                onChange={(e) => setFormData({ ...formData, clicks: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">CTR (%)</label>
              <input
                type="number"
                value={formData.ctr ?? ''}
                onChange={(e) => setFormData({ ...formData, ctr: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>

          {/* Conversões e Custo por Resultado em Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Conversões</label>
              <input
                type="number"
                value={formData.conversions ?? ''}
                onChange={(e) => setFormData({ ...formData, conversions: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Custo por Resultado</label>
              <input
                type="number"
                value={formData.costPerResult ?? ''}
                onChange={(e) => setFormData({ ...formData, costPerResult: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CampaignForm
