import { memo } from "react"
import { Handle, Position, NodeResizer } from "reactflow"
import type { NodeProps } from "reactflow"
import { MessageCircle, Globe, FileText, Mail, Phone, MapPin } from "lucide-react"

export interface ChannelNodeData {
  label: string
  channelType: 'whatsapp' | 'website' | 'form' | 'email' | 'phone' | 'store'
  conversionInfo?: string
  isActive?: boolean
  onEdit?: () => void
}

const channelConfig = {
  whatsapp: {
    icon: MessageCircle,
    color: 'bg-green-500',
    border: 'border-green-600',
    text: 'text-white',
    label: 'WhatsApp',
    emoji: '💬'
  },
  website: {
    icon: Globe,
    color: 'bg-blue-500',
    border: 'border-blue-600',
    text: 'text-white',
    label: 'Website',
    emoji: '🌐'
  },
  form: {
    icon: FileText,
    color: 'bg-purple-500',
    border: 'border-purple-600',
    text: 'text-white',
    label: 'Formulário',
    emoji: '📋'
  },
  email: {
    icon: Mail,
    color: 'bg-orange-500',
    border: 'border-orange-600',
    text: 'text-white',
    label: 'Email',
    emoji: '📧'
  },
  phone: {
    icon: Phone,
    color: 'bg-indigo-500',
    border: 'border-indigo-600',
    text: 'text-white',
    label: 'Telefone',
    emoji: '📞'
  },
  store: {
    icon: MapPin,
    color: 'bg-red-500',
    border: 'border-red-600',
    text: 'text-white',
    label: 'Loja Física',
    emoji: '🏪'
  },
}

const ChannelNode = ({ data, selected }: NodeProps<ChannelNodeData>) => {
  const config = channelConfig[data.channelType]
  const isActive = data.isActive !== false // Default true

  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={180}
        minHeight={100}
      />
      
      <div 
        className={`
          min-w-[180px] rounded-xl shadow-lg border-4
          ${isActive ? config.color : 'bg-gray-300'}
          ${isActive ? config.border : 'border-gray-400'}
          hover:shadow-xl transition-all duration-200 cursor-pointer
          ${!isActive && 'opacity-60'}
        `}
        onDoubleClick={data.onEdit}
      >
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3 h-3 border-2 border-white ${isActive ? config.color : 'bg-gray-400'}`}
          style={{ left: -6 }}
        />

        <div className="p-4">
          {/* Header — emoji dentro de um badge consistente com a família "core" (p-2.5, cantos arredondados) */}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <span className="text-2xl leading-none">{config.emoji}</span>
            </div>
            <div className="flex-1">
              <div className={`text-xs font-semibold uppercase ${config.text} opacity-80`}>
                Canal de Conversão
              </div>
              <div className={`text-sm font-bold ${config.text}`}>
                {data.label || config.label}
              </div>
            </div>
          </div>

          {/* Info */}
          {data.conversionInfo && (
            <div className={`text-xs ${config.text} bg-white bg-opacity-20 rounded px-2 py-1 mt-2`}>
              {data.conversionInfo}
            </div>
          )}

          {/* Status Badge */}
          <div className="mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isActive 
                ? 'bg-white bg-opacity-30 text-white' 
                : 'bg-gray-400 text-gray-700'
            }`}>
              {isActive ? '✅ Ativo' : '⏸️ Inativo'}
            </span>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className={`w-3 h-3 border-2 border-white ${isActive ? config.color : 'bg-gray-400'}`}
          style={{ right: -6 }}
        />
      </div>
    </>
  )
}

export default memo(ChannelNode)
