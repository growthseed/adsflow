import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ActionNodeData } from '../../../types/funnelytics';
import {
  ACTION_CONFIG,
  formatNumber,
  formatPercentage,
  formatCurrency
} from '../../../types/funnelytics';

const ActionNode: React.FC<NodeProps & { data: ActionNodeData }> = ({ data, selected }) => {
  const config = ACTION_CONFIG[data.actionType] || ACTION_CONFIG.click;

  // Determina status visual baseado na taxa de conversão
  const getConversionColor = (rate?: number) => {
    if (rate === undefined) return 'bg-gray-100 text-gray-600';
    if (rate >= 50) return 'bg-green-100 text-green-700';
    if (rate >= 20) return 'bg-yellow-100 text-yellow-700';
    if (rate >= 5) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <>
    <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
    <div
      className={`
        relative min-w-[160px] rounded-xl shadow-lg overflow-hidden
        transition-all duration-200 bg-white
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      style={{
        border: `2px solid ${config.color}`,
      }}
    >
      {/* Header com ícone grande */}
      <div
        className="px-4 py-3 flex items-center justify-center gap-2"
        style={{ backgroundColor: `${config.color}20` }}
      >
        <span className="text-3xl">{config.icon}</span>
      </div>

      {/* Label */}
      <div
        className="text-center py-1.5 font-semibold text-sm text-white"
        style={{ backgroundColor: config.color }}
      >
        {data.label || config.label}
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* Conversions - Número principal */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {formatNumber(data.conversions)}
          </div>
          <div className="text-xs text-gray-500">conversões</div>
        </div>

        {/* Conversion Rate Badge */}
        {data.conversionRate !== undefined && (
          <div className={`
            text-center py-2 px-3 rounded-lg
            ${getConversionColor(data.conversionRate)}
          `}>
            <div className="text-lg font-bold">
              {formatPercentage(data.conversionRate)}
            </div>
            <div className="text-[10px] uppercase tracking-wide opacity-75">
              Taxa de Conversão
            </div>
          </div>
        )}

        {/* Value metrics */}
        {(data.value !== undefined || data.avgValue !== undefined) && (
          <div className="pt-2 border-t space-y-1.5">
            {data.value !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Valor Total</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(data.value)}
                </span>
              </div>
            )}
            {data.avgValue !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Valor Médio</span>
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(data.avgValue)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
    </>
  );
};

export default memo(ActionNode);
