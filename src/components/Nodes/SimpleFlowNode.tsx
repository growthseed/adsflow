import { memo } from "react"
import { Handle, Position, NodeResizer } from "reactflow"
import type { NodeProps } from "reactflow"
import { 
  MessageCircle, Instagram, Facebook, Youtube, Mail, 
  Globe, Phone, Calendar, FileText, Image, Video,
  Send, Users, Megaphone, Target, TrendingUp, Zap
} from "lucide-react"

export interface SimpleFlowNodeData {
  label: string
  icon?: 'whatsapp' | 'instagram' | 'facebook' | 'youtube' | 'email' | 'website' | 'phone' | 'calendar' | 'document' | 'image' | 'video' | 'send' | 'users' | 'megaphone' | 'target' | 'trending' | 'zap'
  color?: 'green' | 'pink' | 'blue' | 'red' | 'purple' | 'orange' | 'gray' | 'yellow' | 'indigo'
  subtitle?: string
  showHandles?: boolean
  onEdit?: () => void
}

const iconMap = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  email: Mail,
  website: Globe,
  phone: Phone,
  calendar: Calendar,
  document: FileText,
  image: Image,
  video: Video,
  send: Send,
  users: Users,
  megaphone: Megaphone,
  target: Target,
  trending: TrendingUp,
  zap: Zap,
}

const colorMap = {
  green: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', shadow: 'shadow-green-200' },
  pink: { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600', shadow: 'shadow-pink-200' },
  blue: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', shadow: 'shadow-blue-200' },
  red: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', shadow: 'shadow-red-200' },
  purple: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600', shadow: 'shadow-purple-200' },
  orange: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', shadow: 'shadow-orange-200' },
  gray: { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600', shadow: 'shadow-gray-200' },
  yellow: { bg: 'bg-yellow-400', text: 'text-gray-900', border: 'border-yellow-500', shadow: 'shadow-yellow-200' },
  indigo: { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600', shadow: 'shadow-indigo-200' },
}

const SimpleFlowNode = ({ data, selected }: NodeProps<SimpleFlowNodeData>) => {
  const Icon = iconMap[data.icon || 'send']
  const colors = colorMap[data.color || 'blue']
  const showHandles = data.showHandles !== false // Default true

  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={120}
        minHeight={120}
      />
      
      <div 
        className={`
          min-w-[120px] min-h-[120px] rounded-2xl
          ${colors.bg} ${colors.border} border-4
          shadow-xl ${colors.shadow}
          hover:scale-105 transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center p-4 gap-2
        `}
        onDoubleClick={data.onEdit}
      >
        {showHandles && (
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 bg-white border-2 border-gray-400"
            style={{ left: -6 }}
          />
        )}

        <Icon className={`w-12 h-12 ${colors.text} drop-shadow-lg`} />
        
        <div className="text-center">
          <div className={`text-sm font-bold ${colors.text} leading-tight`}>
            {data.label}
          </div>
          {data.subtitle && (
            <div className={`text-xs ${colors.text} opacity-80 mt-1`}>
              {data.subtitle}
            </div>
          )}
        </div>

        {showHandles && (
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 bg-white border-2 border-gray-400"
            style={{ right: -6 }}
          />
        )}
      </div>
    </>
  )
}

export default memo(SimpleFlowNode)
