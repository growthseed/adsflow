import { useState } from "react"
import type { TrafficSourceData } from "@/components/Nodes/TrafficSourceNode"

interface TrafficSourceFormProps {
  data: TrafficSourceData
  onUpdate: (data: TrafficSourceData) => void
  onClose: () => void
}

const TrafficSourceForm = ({ data, onUpdate, onClose }: TrafficSourceFormProps) => {
  const [formData, setFormData] = useState<TrafficSourceData>(data)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Editar Fonte de Tráfego</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome/Label */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Meta Ads - Campanha Verão"
              required
            />
          </div>

          {/* Plataforma */}
          <div>
            <label className="block text-sm font-medium mb-1">Plataforma</label>
            <select
              value={formData.platform || ''}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              <option value="Meta">Meta Ads</option>
              <option value="Facebook">Facebook Ads</option>
              <option value="Instagram">Instagram Ads</option>
              <option value="Google">Google Ads</option>
              <option value="LinkedIn">LinkedIn Ads</option>
              <option value="Email">Email Marketing</option>
            </select>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium mb-1">Ícone (emoji)</label>
            <input
              type="text"
              value={formData.icon ?? ''}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="📱"
              maxLength={2}
            />
          </div>

          {/* STATUS ATIVO/INATIVO */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: true })}
                className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${
                  formData.isActive !== false
                    ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                ✅ Ativo
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: false })}
                className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${
                  formData.isActive === false
                    ? 'border-gray-500 bg-gray-50 text-gray-700 font-semibold'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                ⏸️ Inativo
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
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
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
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
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
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Total de vezes que o anúncio foi exibido</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Alcance 🎯
              </label>
              <input
                type="number"
                value={formData.reach ?? ''}
                onChange={(e) => setFormData({ ...formData, reach: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Pessoas únicas alcançadas</p>
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
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">Click-through rate</p>
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
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
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
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TrafficSourceForm
