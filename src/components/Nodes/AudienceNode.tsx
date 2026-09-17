import { memo } from "react";
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Users, Eye, TrendingUp, Target, Layers, type LucideIcon } from "lucide-react";

export interface AudienceData {
  label: string;
  size?: string;
  demographics?: string;
  type?: string;
  source?: string;
  onEdit?: () => void;
}

const typeIcons: Record<string, LucideIcon> = {
  'Personalizada': Users,
  'Lookalike': Eye,
  'Salva': Target,
};

const typeColors: Record<string, { gradient: string; border: string }> = {
  'Personalizada': { 
    gradient: 'from-indigo-500 to-purple-600',
    border: 'border-indigo-500'
  },
  'Lookalike': { 
    gradient: 'from-purple-500 to-pink-600',
    border: 'border-purple-500'
  },
  'Salva': { 
    gradient: 'from-blue-500 to-indigo-600',
    border: 'border-blue-500'
  },
};

const AudienceNode = ({ data, selected }: NodeProps & { data: AudienceData }) => {
  const Icon = typeIcons[data.type || 'Personalizada'] || Users;
  const colors = typeColors[data.type || 'Personalizada'] || typeColors['Personalizada'];
  
  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={280}
        minHeight={200}
      />
      
      <div 
      className={`
        min-w-[280px] rounded-xl shadow-xl border-2 ${colors.border}
        hover:shadow-2xl transition-all duration-200 cursor-pointer
        bg-white overflow-hidden
      `}
      onDoubleClick={data.onEdit}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className={`w-3 h-3 ${colors.border.replace('border', 'bg')} border-2 border-white`}
        style={{ left: -6 }}
      />

      {/* Header com gradiente */}
      <div className={`px-4 py-3 bg-gradient-to-r ${colors.gradient}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg">
            <Icon className="w-6 h-6 text-white drop-shadow" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-white text-opacity-90 uppercase tracking-wide">
              Audiência · {data.type || 'Personalizada'}
            </div>
            <div className="text-base font-bold text-white mt-0.5 drop-shadow">
              {data.label}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 bg-gradient-to-b from-white to-indigo-50">
        {/* Size Badge */}
        {data.size && (
          <div className="mb-3 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
              <Users className="w-4 h-4 text-indigo-600" />
              <div>
                <div className="text-xs text-indigo-600 font-medium">Tamanho</div>
                <div className="text-lg font-bold text-indigo-700">{data.size}</div>
              </div>
            </div>
          </div>
        )}

        {/* Demographics */}
        {data.demographics && (
          <div className="mb-3 p-3 bg-white rounded-lg shadow-sm border border-indigo-100">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-600">Demografia</div>
                <div className="text-sm font-semibold text-gray-900 mt-0.5">
                  {data.demographics}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Source */}
        {data.source && (
          <div className="p-3 bg-white rounded-lg shadow-sm border border-indigo-100">
            <div className="flex items-start gap-2">
              <Layers className="w-4 h-4 text-indigo-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-600">Fonte</div>
                <div className="text-sm font-semibold text-gray-900 mt-0.5">
                  {data.source}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        className={`w-3 h-3 ${colors.border.replace('border', 'bg')} border-2 border-white`}
        style={{ right: -6 }}
      />
    </div>
    </>
  );
};

export default memo(AudienceNode);
