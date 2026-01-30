import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { UTMTrackerNodeData } from '../../../types/funnelytics';
import {
  formatNumber,
  formatCurrency,
  formatPercentage
} from '../../../types/funnelytics';
import { Link, Tag } from 'lucide-react';

const UTMTrackerNode: React.FC<NodeProps<UTMTrackerNodeData>> = ({ data, selected }) => {
  // Calcula ROI color
  const getRoiColor = (roi?: number) => {
    if (roi === undefined) return 'text-gray-600';
    if (roi >= 200) return 'text-green-600';
    if (roi >= 100) return 'text-blue-600';
    if (roi >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className={`
        relative min-w-[220px] rounded-lg shadow-lg overflow-hidden
        transition-all duration-200 bg-white
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      style={{
        border: '2px solid #8B5CF6',
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600">
        <Link className="w-5 h-5 text-white" />
        <span className="text-white font-semibold text-sm truncate flex-1">
          {data.label || 'UTM Tracker'}
        </span>
        <Tag className="w-4 h-4 text-white/70" />
      </div>

      {/* UTM Parameters */}
      <div className="p-3 space-y-1 bg-purple-50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded">
            source
          </span>
          <span className="text-xs text-gray-700 truncate flex-1">
            {data.utm_source}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded">
            medium
          </span>
          <span className="text-xs text-gray-700 truncate flex-1">
            {data.utm_medium}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded">
            campaign
          </span>
          <span className="text-xs text-gray-700 truncate flex-1">
            {data.utm_campaign}
          </span>
        </div>
        {data.utm_content && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded">
              content
            </span>
            <span className="text-xs text-gray-700 truncate flex-1">
              {data.utm_content}
            </span>
          </div>
        )}
        {data.utm_term && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded">
              term
            </span>
            <span className="text-xs text-gray-700 truncate flex-1">
              {data.utm_term}
            </span>
          </div>
        )}
      </div>

      {/* Metrics */}
      {(data.totalVisits !== undefined ||
        data.totalConversions !== undefined ||
        data.totalRevenue !== undefined ||
        data.roi !== undefined) && (
        <div className="p-3 border-t bg-white">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">
            Métricas Agregadas
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.totalVisits !== undefined && (
              <div className="text-center p-1.5 bg-gray-50 rounded">
                <div className="text-sm font-bold text-gray-800">
                  {formatNumber(data.totalVisits)}
                </div>
                <div className="text-[10px] text-gray-400">Visitas</div>
              </div>
            )}
            {data.totalConversions !== undefined && (
              <div className="text-center p-1.5 bg-gray-50 rounded">
                <div className="text-sm font-bold text-blue-600">
                  {formatNumber(data.totalConversions)}
                </div>
                <div className="text-[10px] text-gray-400">Conversões</div>
              </div>
            )}
            {data.totalRevenue !== undefined && (
              <div className="text-center p-1.5 bg-gray-50 rounded">
                <div className="text-sm font-bold text-green-600">
                  {formatCurrency(data.totalRevenue)}
                </div>
                <div className="text-[10px] text-gray-400">Receita</div>
              </div>
            )}
            {data.roi !== undefined && (
              <div className="text-center p-1.5 bg-gray-50 rounded">
                <div className={`text-sm font-bold ${getRoiColor(data.roi)}`}>
                  {formatPercentage(data.roi)}
                </div>
                <div className="text-[10px] text-gray-400">ROI</div>
              </div>
            )}
          </div>
        </div>
      )}

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
  );
};

export default memo(UTMTrackerNode);
