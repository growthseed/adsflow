import { memo } from "react"
import { Handle, Position, NodeResizer } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Facebook, Instagram, Globe, Linkedin, Mail, TrendingUp, type LucideIcon } from "lucide-react"

export interface TrafficSourceData {
  label: string
  platform: string
  icon?: string
  isActive?: boolean
  budgetType?: 'daily' | 'lifetime'
  budget?: number
  spent?: number
  impressions?: number
  reach?: number
  clicks?: number
  ctr?: number
  conversions?: number
  costPerResult?: number
  onEdit?: () => void
}

const platformIcons: Record<string, LucideIcon> = {
  'Meta': Facebook,
  'Facebook': Facebook,
  'Instagram': Instagram,
  'Google': Globe,
  'LinkedIn': Linkedin,
  'Email': Mail,
}

const platformColors: Record<string, { bg: string; border: string; text: string }> = {
  'Meta': { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700' },
  'Facebook': { bg: 'bg-blue-50', border: 'border-blue-600', text: 'text-blue-700' },
  'Instagram': { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700' },
  'Google': { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' },
  'LinkedIn': { bg: 'bg-blue-50', border: 'border-blue-700', text: 'text-blue-800' },
  'Email': { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700' },
}

const TrafficSourceNode = ({ data, selected }: NodeProps & { data: TrafficSourceData }) => {
  const Icon = platformIcons[data.platform] || TrendingUp
  const colors = platformColors[data.platform] || { bg: 'bg-gray-50', border: 'border-gray-500', text: 'text-gray-700' }
  const isActive = data.isActive !== false // Default true
  
  // Calcular CTR automaticamente se não fornecido
  const calculatedCTR = data.ctr ?? (
    data.clicks && data.impressions && data.impressions > 0
      ? ((data.clicks / data.impressions) * 100)
      : undefined
  )

  // Calcular % de gasto
  const spentPercentage = data.budget && data.spent 
    ? Math.min((data.spent / data.budget) * 100, 100) 
    : 0

  // Verificar se tem métricas para exibir
  const hasMetrics = data.budget !== undefined || data.spent !== undefined || 
                     data.impressions !== undefined || data.reach !== undefined ||
                     data.clicks !== undefined || calculatedCTR !== undefined ||
                     data.conversions !== undefined || data.costPerResult !== undefined

  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={280}
        minHeight={150}
      />
      
      <div 
        className={`
          min-w-[280px] rounded-xl shadow-lg border-2
          ${isActive ? `${colors.border} ${colors.bg}` : 'border-gray-400 bg-gray-100'}
          hover:shadow-2xl transition-all duration-200 cursor-pointer
          backdrop-blur-sm bg-opacity-95
          ${!isActive && 'opacity-60'}
        `}
        onDoubleClick={data.onEdit}
      >
        {/* Header com ícone e plataforma */}
        <div className={`px-4 py-3 border-b-2 ${isActive ? colors.border : 'border-gray-400'} ${isActive ? 'bg-white bg-opacity-50' : 'bg-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? colors.bg : 'bg-gray-300'}`}>
              <Icon className={`w-6 h-6 ${isActive ? colors.text : 'text-gray-500'}`} />
            </div>
            <div className="flex-1">
              <div className={`text-xs font-semibold uppercase tracking-wide ${isActive ? colors.text : 'text-gray-500'}`}>
                Fonte de Tráfego
              </div>
              <div className={`text-sm font-bold mt-0.5 ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                {data.label}
              </div>
            </div>
            
            {/* Status Badge */}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              isActive ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-300 text-gray-600 border border-gray-400'
            }`}>
              {isActive ? '✅' : '⏸️'}
            </span>
          </div>
        </div>

        {/* Body com métricas - APENAS SE TIVER DADOS */}
        {hasMetrics && (
          <div className="p-4 space-y-3">
            {/* Orçamento e Gasto */}
            {(data.budget !== undefined || data.spent !== undefined) && (
              <div className="space-y-2">
                {data.budget !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-600">
                      {data.budgetType === 'lifetime' ? '📅 Orçamento Total' : '💵 Orçamento Diário'}
                    </span>
                    <span className="font-bold text-gray-900">
                      R$ {data.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {data.spent !== undefined && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-600">Investido</span>
                      <span className="font-semibold text-blue-600">
                        R$ {data.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Barra de progresso */}
                    {data.budget && data.budget > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
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
                  <div className="text-center p-2 bg-white bg-opacity-60 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium">Impressões</div>
                    <div className="text-base font-bold text-gray-900 mt-0.5">
                      {data.impressions.toLocaleString('pt-BR')}
                    </div>
                  </div>
                )}
                {data.reach !== undefined && (
                  <div className="text-center p-2 bg-white bg-opacity-60 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium">🎯 Alcance</div>
                    <div className="text-base font-bold text-indigo-600 mt-0.5">
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
                  <div className="text-center p-2 bg-blue-50 bg-opacity-80 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-700 font-medium">Cliques</div>
                    <div className="text-base font-bold text-blue-900 mt-0.5">
                      {data.clicks.toLocaleString('pt-BR')}
                    </div>
                  </div>
                )}
                {calculatedCTR !== undefined && (
                  <div className="text-center p-2 bg-green-50 bg-opacity-80 rounded-lg border border-green-200">
                    <div className="text-xs text-green-700 font-medium">CTR</div>
                    <div className="text-base font-bold text-green-900 mt-0.5">
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
                  <div className="text-center p-2 bg-purple-50 bg-opacity-80 rounded-lg border border-purple-200">
                    <div className="text-xs text-purple-700 font-medium">Conversões</div>
                    <div className="text-base font-bold text-purple-900 mt-0.5">
                      {data.conversions.toLocaleString('pt-BR')}
                    </div>
                  </div>
                )}
                {data.costPerResult !== undefined && (
                  <div className="text-center p-2 bg-orange-50 bg-opacity-80 rounded-lg border border-orange-200">
                    <div className="text-xs text-orange-700 font-medium">Custo/Result.</div>
                    <div className="text-sm font-bold text-orange-900 mt-0.5">
                      R$ {data.costPerResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Handle de saída */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-blue-500 border-2 border-white"
          style={{ right: -6 }}
        />
      </div>
    </>
  )
}

export default memo(TrafficSourceNode)
