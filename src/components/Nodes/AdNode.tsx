import { memo, useState } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";
import { Image, Grid3x3, PlayCircle, Megaphone, Eye, MousePointer, type LucideIcon } from "lucide-react";
import ToggleSwitch from "@/components/UI/ToggleSwitch";

export interface AdData {
  label: string;
  format?: string;
  headline?: string;
  status?: string;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  isActive?: boolean; // ✅ NOVO: Status ativo/inativo
  onEdit?: () => void;
}

const formatIcons: Record<string, LucideIcon> = {
  'Imagem Única': Image,
  'Carrossel': Grid3x3,
  'Vídeo': PlayCircle,
  'Stories': Megaphone,
};

const AdNode = ({ data, selected }: NodeProps<AdData>) => {
  const [isActive, setIsActive] = useState(data.isActive !== false); // Default: true

  const Icon = formatIcons[data.format || ''] || Image;

  // ✅ Handler para toggle
  const handleToggle = (enabled: boolean) => {
    setIsActive(enabled);
    console.log(`🔄 Anúncio "${data.label}" agora está: ${enabled ? 'ATIVO' : 'INATIVO'}`);
  };
  
  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={280}
        minHeight={220}
      />
      
      <div 
      className={`
        min-w-[280px] rounded-xl shadow-xl border-2 border-orange-500
        hover:shadow-2xl transition-all duration-200 cursor-pointer
        bg-white overflow-hidden
        ${!isActive ? 'opacity-60 grayscale' : ''}
      `}
      onDoubleClick={data.onEdit}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
        style={{ left: -6 }}
      />

      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg">
            <Icon className="w-6 h-6 text-white drop-shadow" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-white text-opacity-90 uppercase tracking-wide">
              Anúncio · {data.format}
            </div>
            <div className="text-base font-bold text-white mt-0.5 drop-shadow">
              {data.label}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 bg-gradient-to-b from-white to-orange-50">
        {/* ✅ TOGGLE ON/OFF */}
        <div className="mb-4 pb-3 border-b border-orange-200">
          <ToggleSwitch 
            enabled={isActive}
            onChange={handleToggle}
            label="Status"
            size="sm"
          />
        </div>

        {/* Headline */}
        {data.headline && (
          <div className="mb-3 p-3 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-xs font-medium text-gray-600 mb-1">Título</div>
            <div className="text-sm font-semibold text-gray-900 line-clamp-2">
              {data.headline}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {/* Impressões */}
          {data.impressions !== undefined && (
            <div className="text-center p-2.5 bg-white rounded-lg shadow-sm border border-orange-100">
              <Eye className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Impressões</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">
                {(data.impressions / 1000).toFixed(1)}K
              </div>
            </div>
          )}

          {/* Cliques */}
          {data.clicks !== undefined && (
            <div className="text-center p-2.5 bg-white rounded-lg shadow-sm border border-orange-100">
              <MousePointer className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Cliques</div>
              <div className="text-sm font-bold text-blue-600 mt-0.5">
                {data.clicks}
              </div>
            </div>
          )}

          {/* CTR */}
          {data.ctr !== undefined && (
            <div className="text-center p-2.5 bg-white rounded-lg shadow-sm border border-orange-100">
              <div className="text-xs text-gray-600">CTR</div>
              <div className="text-sm font-bold text-green-600 mt-0.5">
                {data.ctr.toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
        style={{ right: -6 }}
      />

      {/* ✅ Badge de Status quando INATIVO */}
      {!isActive && (
        <div className="absolute top-3 right-3 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
          PAUSADO
        </div>
      )}
    </div>
    </>
  );
};

export default memo(AdNode);
