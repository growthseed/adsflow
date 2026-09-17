import { memo } from "react";
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Target, TrendingUp, DollarSign, FileText, ShoppingCart, ArrowUp, ArrowDown, Minus, type LucideIcon } from "lucide-react";

export interface ResultData {
  label: string;
  metric?: string;
  value?: string;
  target?: string;
  achieved?: string;
  percentage?: number;
  onEdit?: () => void;
}

const metricIcons: Record<string, LucideIcon> = {
  'Leads': FileText,
  'Vendas': ShoppingCart,
  'Conversões': Target,
  'CTR': TrendingUp,
  'ROI': DollarSign,
};

const ResultNode = ({ data, selected }: NodeProps & { data: ResultData }) => {
  const Icon = metricIcons[data.metric || 'Conversões'] || Target;
  
  // Calcular status baseado na porcentagem
  const getStatus = () => {
    if (!data.percentage) return 'neutral';
    if (data.percentage >= 100) return 'success';
    if (data.percentage >= 75) return 'warning';
    return 'danger';
  };

  const status = getStatus();
  
  const statusConfig: Record<string, { 
    gradient: string; 
    border: string; 
    bgLight: string;
    icon: LucideIcon;
    iconColor: string;
  }> = {
    success: { 
      gradient: 'from-green-500 to-emerald-600',
      border: 'border-green-500',
      bgLight: 'from-green-50 to-emerald-50',
      icon: ArrowUp,
      iconColor: 'text-green-600'
    },
    warning: { 
      gradient: 'from-yellow-500 to-orange-500',
      border: 'border-yellow-500',
      bgLight: 'from-yellow-50 to-orange-50',
      icon: Minus,
      iconColor: 'text-yellow-600'
    },
    danger: { 
      gradient: 'from-red-500 to-pink-600',
      border: 'border-red-500',
      bgLight: 'from-red-50 to-pink-50',
      icon: ArrowDown,
      iconColor: 'text-red-600'
    },
    neutral: { 
      gradient: 'from-gray-500 to-gray-600',
      border: 'border-gray-500',
      bgLight: 'from-gray-50 to-gray-100',
      icon: Minus,
      iconColor: 'text-gray-600'
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;
  
  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={300}
        minHeight={250}
      />
      
      <div 
      className={`
        min-w-[300px] rounded-xl shadow-xl border-2 ${config.border}
        hover:shadow-2xl transition-all duration-200 cursor-pointer
        bg-white overflow-hidden
      `}
      onDoubleClick={data.onEdit}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className={`w-3 h-3 ${config.border.replace('border', 'bg')} border-2 border-white`}
        style={{ left: -6 }}
      />

      {/* Header com gradiente */}
      <div className={`px-4 py-3 bg-gradient-to-r ${config.gradient}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg">
            <Icon className="w-6 h-6 text-white drop-shadow" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-white text-opacity-90 uppercase tracking-wide">
              Meta · {data.metric || 'Resultado'}
            </div>
            <div className="text-base font-bold text-white mt-0.5 drop-shadow">
              {data.label}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={`p-4 bg-gradient-to-b ${config.bgLight}`}>
        {/* Progress Circle */}
        {data.percentage !== undefined && (
          <div className="mb-4 flex items-center justify-center">
            <div className="relative">
              {/* Circle SVG */}
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.percentage / 100)}`}
                  className={config.iconColor}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <StatusIcon className={`w-6 h-6 ${config.iconColor} mb-1`} />
                <div className="text-3xl font-bold text-gray-900">
                  {data.percentage}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Target vs Achieved */}
        <div className="grid grid-cols-2 gap-3">
          {/* Target */}
          {data.target && (
            <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-xs font-medium text-gray-600 mb-1">Meta</div>
              <div className="text-lg font-bold text-gray-900">
                {data.target}
              </div>
            </div>
          )}

          {/* Achieved */}
          {data.achieved && (
            <div className={`p-3 bg-white rounded-lg shadow-sm border-2 ${config.border}`}>
              <div className={`text-xs font-medium ${config.iconColor} mb-1`}>Alcançado</div>
              <div className={`text-lg font-bold ${config.iconColor}`}>
                {data.achieved}
              </div>
            </div>
          )}
        </div>

        {/* Value Display */}
        {data.value && !data.target && (
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-xs font-medium text-gray-600 mb-1">Valor Atual</div>
            <div className="text-2xl font-bold text-gray-900">
              {data.value}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default memo(ResultNode);
