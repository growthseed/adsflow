import { memo, useState } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";
import { Users, MapPin, Calendar, DollarSign } from "lucide-react";
import ToggleSwitch from "@/components/UI/ToggleSwitch";

export interface AdSetData {
  label: string;
  targeting?: string;
  budget?: string;
  location?: string;
  ageRange?: string;
  spend?: number;
  results?: number;
  isActive?: boolean; // ✅ NOVO: Status ativo/inativo
  onEdit?: () => void;
}

const AdSetNode = ({ data, selected }: NodeProps<AdSetData>) => {
  const [isActive, setIsActive] = useState(data.isActive !== false); // Default: true

  // ✅ Handler para toggle
  const handleToggle = (enabled: boolean) => {
    setIsActive(enabled);
    console.log(`🔄 AdSet "${data.label}" agora está: ${enabled ? 'ATIVO' : 'INATIVO'}`);
  };

  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={300}
        minHeight={250}
      />
      
      <div 
      className={`
        min-w-[300px] rounded-xl shadow-xl border-2 border-purple-500
        hover:shadow-2xl transition-all duration-200 cursor-pointer
        bg-gradient-to-br from-purple-50 via-white to-pink-50
        overflow-hidden
        ${!isActive ? 'opacity-60 grayscale' : ''}
      `}
      onDoubleClick={data.onEdit}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
        style={{ left: -6 }}
      />

      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg">
            <Users className="w-6 h-6 text-white drop-shadow" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-white text-opacity-90 uppercase tracking-wide">
              Conjunto de Anúncios
            </div>
            <div className="text-base font-bold text-white mt-0.5 drop-shadow">
              {data.label}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* ✅ TOGGLE ON/OFF */}
        <div className="pb-3 border-b border-purple-200">
          <ToggleSwitch 
            enabled={isActive}
            onChange={handleToggle}
            label="Status"
            size="sm"
          />
        </div>

        {/* Targeting Info */}
        {data.targeting && (
          <div className="p-3 bg-white rounded-lg shadow-sm border border-purple-100">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-purple-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-600">Segmentação</div>
                <div className="text-sm font-semibold text-gray-900 mt-0.5">
                  {data.targeting}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location & Age Grid */}
        <div className="grid grid-cols-2 gap-2">
          {data.location && (
            <div className="p-2.5 bg-white rounded-lg shadow-sm border border-purple-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                <div className="text-xs text-gray-600">Local</div>
              </div>
              <div className="text-sm font-semibold text-gray-900 mt-1">
                {data.location}
              </div>
            </div>
          )}

          {data.ageRange && (
            <div className="p-2.5 bg-white rounded-lg shadow-sm border border-purple-100">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                <div className="text-xs text-gray-600">Idade</div>
              </div>
              <div className="text-sm font-semibold text-gray-900 mt-1">
                {data.ageRange}
              </div>
            </div>
          )}
        </div>

        {/* Budget & Results */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div>
            <div className="text-xs text-purple-600 font-medium">Orçamento</div>
            <div className="text-base font-bold text-purple-700">
              {data.budget || 'N/A'}
            </div>
          </div>
          
          {data.results !== undefined && (
            <div className="text-right">
              <div className="text-xs text-purple-600 font-medium">Resultados</div>
              <div className="text-lg font-bold text-purple-700">
                {data.results}
              </div>
            </div>
          )}
        </div>

        {/* Spend */}
        {data.spend !== undefined && (
          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Gasto</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              R$ {data.spend.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
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

export default memo(AdSetNode);
