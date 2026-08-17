import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from 'reactflow';
import type { EdgeProps } from 'reactflow';
import type { ConversionEdgeData } from '../../types/funnelytics';
import { formatPercentage, formatNumber } from '../../types/funnelytics';

interface ConversionEdgeProps extends EdgeProps {
  data?: ConversionEdgeData;
}

const ConversionEdge: React.FC<ConversionEdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determina cor baseado na taxa de conversão
  const getEdgeColor = () => {
    if (!data?.conversionRate) return '#94A3B8'; // gray-400
    if (data.conversionRate >= 50) return '#22C55E'; // green-500
    if (data.conversionRate >= 20) return '#3B82F6'; // blue-500
    if (data.conversionRate >= 10) return '#F59E0B'; // amber-500
    return '#EF4444'; // red-500
  };

  // Determina cor de fundo do badge
  const getBadgeColor = () => {
    if (!data?.conversionRate) return 'bg-gray-100 text-gray-600';
    if (data.conversionRate >= 50) return 'bg-green-100 text-green-700';
    if (data.conversionRate >= 20) return 'bg-blue-100 text-blue-700';
    if (data.conversionRate >= 10) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const edgeColor = getEdgeColor();

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: 2,
          strokeDasharray: data?.animated ? '5,5' : undefined,
        }}
      />

      {/* Label com métricas */}
      {(data?.conversionRate !== undefined || data?.conversions !== undefined) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {/* Duas "pílulas" coladas — rótulo pequeno em cima, valor em negrito embaixo,
                mesmo padrão visual do Funnelytics (chips de Rate/People sobre a aresta) */}
            <div className="flex items-stretch rounded-md overflow-hidden shadow-sm border border-white/60 backdrop-blur-sm divide-x divide-white/40">
              {data?.conversionRate !== undefined && (
                <div className={`px-2 py-1 flex flex-col items-center leading-none ${getBadgeColor()}`}>
                  <span className="text-[9px] uppercase tracking-wide opacity-70">Taxa</span>
                  <span className="text-xs font-bold mt-0.5">
                    {formatPercentage(data.conversionRate)}
                  </span>
                </div>
              )}
              {data?.conversions !== undefined && (
                <div className="px-2 py-1 flex flex-col items-center leading-none bg-white/85 text-gray-700">
                  <span className="text-[9px] uppercase tracking-wide opacity-60">Pessoas</span>
                  <span className="text-xs font-bold mt-0.5">
                    {formatNumber(data.conversions)}
                  </span>
                </div>
              )}
            </div>

            {/* Dropoffs indicator */}
            {data?.dropoffs !== undefined && data.dropoffs > 0 && (
              <div className="mt-1 text-center">
                <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                  -{formatNumber(data.dropoffs)} drop
                </span>
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Animated particles (opcional) */}
      {data?.animated && (
        <circle r="4" fill={edgeColor}>
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
};

export default ConversionEdge;
