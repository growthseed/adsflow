import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { SourceNodeData } from '../../../types/funnelytics';
import {
  SOURCE_CONFIG,
  formatNumber,
  formatCurrency
} from '../../../types/funnelytics';

const SourceNode: React.FC<NodeProps & { data: SourceNodeData }> = ({ data, selected }) => {
  const config = SOURCE_CONFIG[data.source] || SOURCE_CONFIG.direct;

  return (
    <>
    <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
    <div
      className={`
        relative min-w-[180px] rounded-lg shadow-lg overflow-hidden
        transition-all duration-200
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      style={{
        background: `linear-gradient(135deg, ${config.color}22 0%, ${config.color}44 100%)`,
        border: `2px solid ${config.color}`,
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ backgroundColor: config.color }}
      >
        <span className="text-xl">{config.icon}</span>
        <span className="text-white font-semibold text-sm truncate">
          {data.label || config.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2 bg-white/90">
        {/* Visits */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Visitas</span>
          <span className="text-sm font-bold text-gray-800">
            {formatNumber(data.visits)}
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

        {/* Cost */}
        {data.cost !== undefined && (
          <div className="flex justify-between items-center border-t pt-2 mt-2">
            <span className="text-xs text-gray-500">Custo</span>
            <span className="text-sm font-bold text-red-600">
              {formatCurrency(data.cost)}
            </span>
          </div>
        )}

        {/* CPC */}
        {data.cpc !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">CPC</span>
            <span className="text-sm font-medium text-gray-700">
              {formatCurrency(data.cpc)}
            </span>
          </div>
        )}

        {/* CPM */}
        {data.cpm !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">CPM</span>
            <span className="text-sm font-medium text-gray-700">
              {formatCurrency(data.cpm)}
            </span>
          </div>
        )}

        {/* UTM Parameters (collapsed) */}
        {(data.utm_source || data.utm_medium || data.utm_campaign) && (
          <div className="border-t pt-2 mt-2">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
              UTM Params
            </div>
            <div className="space-y-0.5">
              {data.utm_source && (
                <div className="text-[10px] text-gray-500 truncate">
                  <span className="text-gray-400">source:</span> {data.utm_source}
                </div>
              )}
              {data.utm_medium && (
                <div className="text-[10px] text-gray-500 truncate">
                  <span className="text-gray-400">medium:</span> {data.utm_medium}
                </div>
              )}
              {data.utm_campaign && (
                <div className="text-[10px] text-gray-500 truncate">
                  <span className="text-gray-400">campaign:</span> {data.utm_campaign}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Source Handle (output) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
    </>
  );
};

export default memo(SourceNode);
