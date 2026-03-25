import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { FunnelNodeData } from '../../../types/funnelytics';
import { formatNumber, formatPercentage } from '../../../types/funnelytics';
import { TrendingDown } from 'lucide-react';

// Cores padrão para o funil (do mais quente ao mais frio)
const DEFAULT_COLORS = [
  '#3B82F6', // blue-500
  '#6366F1', // indigo-500
  '#8B5CF6', // purple-500
  '#A855F7', // purple-500
  '#EC4899', // pink-500
  '#EF4444', // red-500
];

const FunnelNode: React.FC<NodeProps<FunnelNodeData>> = ({ data, selected }) => {
  const { stages, orientation = 'vertical', showPercentages = true, showCounts = true } = data;

  // Encontra o maior valor para calcular larguras proporcionais
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <>
    <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
    <div
      className={`
        relative min-w-[240px] rounded-lg shadow-lg overflow-hidden
        transition-all duration-200 bg-white
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      style={{
        border: '2px solid #6366F1',
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600">
        <TrendingDown className="w-5 h-5 text-white" />
        <span className="text-white font-semibold text-sm truncate flex-1">
          {data.label || 'Funil de Conversão'}
        </span>
      </div>

      {/* Funnel Visualization */}
      <div className="p-3">
        {orientation === 'vertical' ? (
          // Vertical Funnel
          <div className="space-y-1">
            {stages.map((stage, index) => {
              const widthPercentage = (stage.count / maxCount) * 100;
              const color = stage.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

              return (
                <div key={stage.id} className="relative">
                  {/* Bar */}
                  <div
                    className="h-8 rounded flex items-center justify-between px-2 transition-all duration-300"
                    style={{
                      width: `${Math.max(widthPercentage, 30)}%`,
                      backgroundColor: color,
                      marginLeft: `${(100 - Math.max(widthPercentage, 30)) / 2}%`,
                    }}
                  >
                    <span className="text-white text-xs font-medium truncate">
                      {stage.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {showCounts && (
                        <span className="text-white/90 text-xs font-bold">
                          {formatNumber(stage.count)}
                        </span>
                      )}
                      {showPercentages && (
                        <span className="text-white/70 text-[10px]">
                          ({formatPercentage(stage.percentage)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Drop indicator between stages */}
                  {index < stages.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <div className="text-[10px] text-gray-400">
                        ↓ {formatPercentage(
                          ((stages[index].count - stages[index + 1].count) / stages[index].count) * 100
                        )} drop
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Horizontal Funnel
          <div className="flex items-end gap-1 h-32">
            {stages.map((stage, index) => {
              const heightPercentage = (stage.count / maxCount) * 100;
              const color = stage.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

              return (
                <div
                  key={stage.id}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  {/* Value on top */}
                  <div className="text-center">
                    {showCounts && (
                      <div className="text-xs font-bold text-gray-800">
                        {formatNumber(stage.count)}
                      </div>
                    )}
                    {showPercentages && (
                      <div className="text-[10px] text-gray-500">
                        {formatPercentage(stage.percentage)}
                      </div>
                    )}
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full rounded-t transition-all duration-300"
                    style={{
                      height: `${Math.max(heightPercentage, 20)}%`,
                      backgroundColor: color,
                    }}
                  />

                  {/* Label */}
                  <div className="text-[10px] text-gray-600 text-center truncate w-full">
                    {stage.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="px-3 py-2 bg-gray-50 border-t flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Total Entrada:
          <span className="font-bold text-gray-800 ml-1">
            {formatNumber(stages[0]?.count || 0)}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Conversão Final:
          <span className="font-bold text-green-600 ml-1">
            {stages.length > 0 ? formatPercentage(stages[stages.length - 1]?.percentage || 0) : '0%'}
          </span>
        </div>
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

export default memo(FunnelNode);
