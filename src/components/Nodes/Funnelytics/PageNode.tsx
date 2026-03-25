import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { PageNodeData } from '../../../types/funnelytics';
import {
  PAGE_CONFIG,
  formatNumber,
  formatPercentage
} from '../../../types/funnelytics';

const PageNode: React.FC<NodeProps<PageNodeData>> = ({ data, selected }) => {
  const config = PAGE_CONFIG[data.pageType] || PAGE_CONFIG.landing;

  // Calcula status baseado no bounce rate
  const getBounceRateColor = (rate?: number) => {
    if (rate === undefined) return 'text-gray-500';
    if (rate < 30) return 'text-green-600';
    if (rate < 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
    <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
    <div
      className={`
        relative min-w-[180px] rounded-lg shadow-lg overflow-hidden
        transition-all duration-200 bg-white
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      style={{
        border: `2px solid ${config.color}`,
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ backgroundColor: config.color }}
      >
        <span className="text-xl">{config.icon}</span>
        <span className="text-white font-semibold text-sm truncate flex-1">
          {data.label || config.label}
        </span>
      </div>

      {/* URL Badge */}
      {data.url && (
        <div className="px-3 py-1 bg-gray-100 border-b">
          <span className="text-[10px] text-gray-500 truncate block">
            {data.url}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="p-3 space-y-2">
        {/* Visitors */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Visitantes</span>
          <span className="text-sm font-bold text-gray-800">
            {formatNumber(data.visitors)}
          </span>
        </div>

        {/* Unique Visitors */}
        {data.uniqueVisitors !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Únicos</span>
            <span className="text-sm font-medium text-gray-700">
              {formatNumber(data.uniqueVisitors)}
            </span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          {/* Bounce Rate */}
          {data.bounceRate !== undefined && (
            <div className="text-center p-1.5 bg-gray-50 rounded">
              <div className={`text-sm font-bold ${getBounceRateColor(data.bounceRate)}`}>
                {formatPercentage(data.bounceRate)}
              </div>
              <div className="text-[10px] text-gray-400">Bounce</div>
            </div>
          )}

          {/* Exit Rate */}
          {data.exitRate !== undefined && (
            <div className="text-center p-1.5 bg-gray-50 rounded">
              <div className="text-sm font-bold text-orange-600">
                {formatPercentage(data.exitRate)}
              </div>
              <div className="text-[10px] text-gray-400">Exit</div>
            </div>
          )}

          {/* Avg Time on Page */}
          {data.avgTimeOnPage !== undefined && (
            <div className="text-center p-1.5 bg-gray-50 rounded">
              <div className="text-sm font-bold text-blue-600">
                {Math.floor(data.avgTimeOnPage / 60)}:{(data.avgTimeOnPage % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-[10px] text-gray-400">Tempo</div>
            </div>
          )}

          {/* Scroll Depth */}
          {data.scrollDepth !== undefined && (
            <div className="text-center p-1.5 bg-gray-50 rounded">
              <div className="text-sm font-bold text-purple-600">
                {formatPercentage(data.scrollDepth)}
              </div>
              <div className="text-[10px] text-gray-400">Scroll</div>
            </div>
          )}
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

export default memo(PageNode);
