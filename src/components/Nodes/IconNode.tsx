import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { BrandIcons } from '@/components/Icons/BrandIcons'

interface IconNodeData {
  label: string
  platform: 'Instagram' | 'Facebook' | 'WhatsApp' | 'LinkedIn' | 'YouTube' | 'X'
  iconType: 'social'
  onEdit?: () => void
}

interface IconNodeProps {
  data: IconNodeData
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

function IconNode({ data }: IconNodeProps) {
  const config = platformConfig[data.platform] || platformConfig.Instagram
  const BrandIcon = BrandIcons[data.platform]

  return (
    <div
      className={`
        relative min-w-[160px] rounded-2xl border-3 
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
      <div className="p-6 flex flex-col items-center gap-4">
        {/* Ícone REAL da Marca com cores oficiais */}
        <div className={`
          w-24 h-24 rounded-2xl
          flex items-center justify-center
          shadow-lg group-hover:scale-110 transition-transform duration-200
          bg-white p-4
        `}>
          {BrandIcon && <BrandIcon />}
        </div>

        {/* Nome da Plataforma */}
        <div className="text-center">
          <div className="text-sm font-bold text-gray-800">
            {data.label}
          </div>
        </div>
      </div>


    </div>
  )
}

export default memo(IconNode)
