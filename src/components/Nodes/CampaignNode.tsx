import { memo, useState } from "react"
import { Handle, Position, NodeResizer } from "reactflow"
import type { NodeProps } from "reactflow"
import { Target, TrendingUp, Zap, ShoppingCart, Users, Award, Power } from "lucide-react"

export interface CampaignData {
  label: string
  objective?: string
  status?: 'active' | 'paused' | 'draft'
  budgetType?: 'daily' | 'lifetime'
  budget?: number
  spent?: number
  impressions?: number
  reach?: number
  clicks?: number
  ctr?: number
  conversions?: number
  costPerResult?: number
  isActive?: boolean
  onEdit?: () => void
  onToggleActive?: (isActive: boolean) => void
}

const objectiveIcons: Record<string, any> = {
  'Tráfego': Zap,
  'Conversões': Target,
  'Vendas': ShoppingCart,
  'Engajamento': Users,
  'Reconhecimento': Award,
  'Leads': TrendingUp,
}

const objectiveColors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  'Tráfego': { 
    bg: 'bg-yellow-50', 
    border: 'border-yellow-500', 
    text: 'text-yellow-700',
    gradient: 'from-yellow-400 to-orange-400'
  },
  'Conversões': { 
    bg: 'bg-green-50', 
    border: 'border-green-500', 
    text: 'text-green-700',
    gradient: 'from-green-400 to-emerald-500'
  },
  'Vendas': { 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-500', 
    text: 'text-emerald-700',
    gradient: 'from-emerald-400 to-teal-500'
  },
  'Engajamento': { 
    bg: 'bg-purple-50', 
    border: 'border-purple-500', 
    text: 'text-purple-700',
    gradient: 'from-purple-400 to-pink-500'
  },
  'Reconhecimento': { 
    bg: 'bg-blue-50', 
    border: 'border-blue-500', 
    text: 'text-blue-700',
    gradient: 'from-blue-400 to-indigo-500'
  },
  'Leads': { 
    bg: 'bg-orange-50', 
    border: 'border-orange-500', 
    text: 'text-orange-700',
    gradient: 'from-orange-400 to-red-500'
  },
}

const statusColors = {
  active: { badge: 'bg-green-100 text-green-700 border-green-300', label: '✅ Ativo' },
  paused: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: '⏸️ Pausado' },
  draft: { badge: 'bg-gray-100 text-gray-700 border-gray-300', label: '📝 Rascunho' },
}

const CampaignNode = ({ data, selected }: NodeProps<CampaignData>) => {
  const [isActive, setIsActive] = useState(data.isActive !== false)

  const Icon = objectiveIcons[data.objective || 'Tráfego'] || Target
  const colors = objectiveColors[data.objective || 'Tráfego'] || objectiveColors['Tráfego']
  const statusColor = statusColors[data.status || 'draft']

  const calculatedCTR = data.ctr ?? (
    data.clicks && data.impressions && data.impressions > 0
      ? ((data.clicks / data.impressions) * 100)
      : undefined
  )

  const spentPercentage = data.budget && data.spent 
    ? Math.min((data.spent / data.budget) * 100, 100) 
    : 0

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newState = !isActive
    setIsActive(newState)
    data.onToggleActive?.(newState)
  }

  // Cores quando inativo (cinza)
  const inactiveGradient = 'from-gray-400 to-gray-500'
  const inactiveBorder = 'border-gray-400'

  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={320}
        minHeight={220}
      />
      
      <div 
        className={`
          min-w-[320px] rounded-xl shadow-xl border-2 ${isActive ? colors.border : inactiveBorder}
          hover:shadow-2xl transition-all duration-200 cursor-pointer
          ${isActive ? 'bg-white' : 'bg-gray-50'}
          overflow-hidden
          ${!isActive && 'opacity-75'}
        `}
        onDoubleClick={data.onEdit}
      >
        {/* Handle de entrada */}
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3 h-3 border-2 border-white bg-gradient-to-r ${isActive ? colors.gradient : inactiveGradient}`}
          style={{ left: -6 }}
        />

        {/* Header com gradiente */}
        <div className={`px-4 py-3 bg-gradient-to-r ${isActive ? colors.gradient : inactiveGradient} relative`}>
          <div className="flex items-center gap-3">
            {/* Botão Ativar/Desativar */}
            <button
              onClick={handleToggleActive}
              className={`
                p-2 rounded-lg transition-all
                ${isActive 
                  ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                  : 'bg-white bg-opacity-40 hover:bg-opacity-50'
                }
              `}
              title={isActive ? 'Desativar' : 'Ativar'}
            >
              <Power className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
            </button>

            <div className="p-2.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg">
              <Icon className="w-6 h-6 text-white drop-shadow" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-white text-opacity-90 uppercase tracking-wide">
                Campanha · {data.objective || 'Não definido'}
              </div>
              <div className="text-base font-bold text-white mt-0.5 drop-shadow">
                {data.label}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {data.status && (
            <div className="absolute top-2 right-2">
              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColor.badge}`}>
                {statusColor.label}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className={`p-4 ${isActive ? 'bg-gradient-to-b from-white to-gray-50' : 'bg-gray-100'} space-y-3`}>
          {/* Orçamento e Gasto */}
          {(data.budget !== undefined || data.spent !== undefined) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-600">
                  {data.budgetType === 'lifetime' ? '📅 Orçamento Total' : '💵 Orçamento Diário'}
                </span>
                <span className="font-bold text-gray-900">
                  {data.budget ? `R$ ${data.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                </span>
              </div>

              {data.spent !== undefined && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-600">Investido</span>
                    <span className="font-semibold text-green-600">
                      R$ {data.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  {data.budget && data.budget > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            !isActive ? 'bg-gray-400' :
                            spentPercentage >= 90 ? 'bg-red-500' :
                            spentPercentage >= 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${spentPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {spentPercentage.toFixed(1)}% utilizado
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Impressões e Alcance */}
          {(data.impressions !== undefined || data.reach !== undefined) && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
              {data.impressions !== undefined && (
                <div className={`text-center p-2 rounded-lg border shadow-sm ${isActive ? 'bg-white border-gray-200' : 'bg-gray-200 border-gray-300'}`}>
                  <div className="text-xs text-gray-600 font-medium">Impressões</div>
                  <div className="text-base font-bold text-gray-900 mt-0.5">
                    {data.impressions.toLocaleString('pt-BR')}
                  </div>
                </div>
              )}
              {data.reach !== undefined && (
                <div className={`text-center p-2 rounded-lg border shadow-sm ${isActive ? 'bg-white border-indigo-200' : 'bg-gray-200 border-gray-300'}`}>
                  <div className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>🎯 Alcance</div>
                  <div className={`text-base font-bold mt-0.5 ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {data.reach.toLocaleString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cliques e CTR */}
          {(data.clicks !== undefined || calculatedCTR !== undefined) && (
            <div className="grid grid-cols-2 gap-2">
              {data.clicks !== undefined && (
                <div className={`text-center p-2 rounded-lg border ${isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-200 border-gray-300'}`}>
                  <div className={`text-xs font-medium ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>Cliques</div>
                  <div className={`text-base font-bold mt-0.5 ${isActive ? 'text-blue-900' : 'text-gray-700'}`}>
                    {data.clicks.toLocaleString('pt-BR')}
                  </div>
                </div>
              )}
              {calculatedCTR !== undefined && (
                <div className={`text-center p-2 rounded-lg border ${isActive ? 'bg-green-50 border-green-200' : 'bg-gray-200 border-gray-300'}`}>
                  <div className={`text-xs font-medium ${isActive ? 'text-green-700' : 'text-gray-600'}`}>CTR</div>
                  <div className={`text-base font-bold mt-0.5 ${isActive ? 'text-green-900' : 'text-gray-700'}`}>
                    {calculatedCTR.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conversões e Custo por Resultado */}
          {(data.conversions !== undefined || data.costPerResult !== undefined) && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
              {data.conversions !== undefined && (
                <div className={`text-center p-2 rounded-lg border ${isActive ? 'bg-purple-50 border-purple-200' : 'bg-gray-200 border-gray-300'}`}>
                  <div className={`text-xs font-medium ${isActive ? 'text-purple-700' : 'text-gray-600'}`}>Conversões</div>
                  <div className={`text-base font-bold mt-0.5 ${isActive ? 'text-purple-900' : 'text-gray-700'}`}>
                    {data.conversions.toLocaleString('pt-BR')}
                  </div>
                </div>
              )}
              {data.costPerResult !== undefined && (
                <div className={`text-center p-2 rounded-lg border ${isActive ? 'bg-orange-50 border-orange-200' : 'bg-gray-200 border-gray-300'}`}>
                  <div className={`text-xs font-medium ${isActive ? 'text-orange-700' : 'text-gray-600'}`}>Custo/Result.</div>
                  <div className={`text-sm font-bold mt-0.5 ${isActive ? 'text-orange-900' : 'text-gray-700'}`}>
                    R$ {data.costPerResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Handle de saída */}
        <Handle
          type="source"
          position={Position.Right}
          className={`w-3 h-3 border-2 border-white bg-gradient-to-r ${isActive ? colors.gradient : inactiveGradient}`}
          style={{ right: -6 }}
        />
      </div>
    </>
  )
}

export default memo(CampaignNode)
