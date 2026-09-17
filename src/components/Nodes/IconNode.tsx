import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { BrandIcons } from '@/components/Icons/BrandIcons'

export interface IconNodeData {
  label: string
  platform: 'Instagram' | 'Facebook' | 'WhatsApp' | 'LinkedIn' | 'YouTube' | 'X'
  iconType: 'social'
  onEdit?: () => void
}

// Configuração de cores e sombras por plataforma
const platformConfig = {
  Instagram: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    border: 'border-pink-500',
    glow: 'shadow-pink-500/30',
  },
  Facebook: {
    bg: 'bg-blue-50',
    border: 'border-blue-600',
    glow: 'shadow-blue-500/30',
  },
  WhatsApp: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    glow: 'shadow-green-500/30',
  },
  LinkedIn: {
    bg: 'bg-blue-50',
    border: 'border-blue-700',
    glow: 'shadow-blue-700/30',
  },
  YouTube: {
    bg: 'bg-red-50',
    border: 'border-red-600',
    glow: 'shadow-red-500/30',
  },
  Twitter: {
    bg: 'bg-gray-50',
    border: 'border-gray-900',
    glow: 'shadow-gray-900/30',
  },
  X: {
    bg: 'bg-gray-50',
    border: 'border-gray-900',
    glow: 'shadow-gray-900/30',
  },
}

function IconNode({ data }: NodeProps & { data: IconNodeData }) {
  const config = platformConfig[data.platform] || platformConfig.Instagram
  const BrandIcon = BrandIcons[data.platform]

  return (
    <>
    {/* Badge circular de tamanho fixo — sem NodeResizer (mesmo motivo do
        BrandNode: esticar a bounding box sem esticar o circulo interno
        deixava a alca de resize "flutuando" longe do icone). */}
    <div
      className={`
        relative min-w-[112px] rounded-xl border-2
        ${config.bg} ${config.border}
        transition-all duration-200 hover:shadow-2xl ${config.glow}
        cursor-pointer group
      `}
      onDoubleClick={data.onEdit}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-white bg-gray-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-white bg-gray-400"
      />

      {/* Conteúdo */}
      <div className="p-2 flex flex-col items-center gap-1.5">
        {/* Ícone REAL da Marca com cores oficiais — círculo, mesmo padrão dos demais nós visuais */}
        <div className={`
          w-16 h-16 rounded-full
          flex items-center justify-center
          shadow-lg group-hover:scale-110 transition-transform duration-200
          bg-white p-3
        `}>
          {BrandIcon && <BrandIcon />}
        </div>

        {/* Nome da Plataforma */}
        <div className="text-center">
          <div className="text-[11px] font-bold text-gray-800">
            {data.label}
          </div>
        </div>
      </div>


    </div>
    </>
  )
}

export default memo(IconNode)
