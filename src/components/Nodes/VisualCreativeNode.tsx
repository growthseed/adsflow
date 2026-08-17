import { memo } from 'react'
import { Handle, Position, NodeResizer } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Image as ImageIcon, Film, Palette, FileImage } from 'lucide-react'

interface VisualCreativeNodeData {
  format: 'image' | 'video' | 'carousel' | 'collection'
  label?: string
}

const formatLabel: Record<VisualCreativeNodeData['format'], string> = {
  image: 'Imagem',
  video: 'Vídeo',
  carousel: 'Carrossel',
  collection: 'Coleção',
}

const VisualCreativeNode = memo(({ data, selected }: NodeProps<VisualCreativeNodeData>) => {
  const formatConfig = {
    image: {
      icon: ImageIcon,
      color: 'bg-pink-500'
    },
    video: {
      icon: Film,
      color: 'bg-red-500'
    },
    carousel: {
      icon: Palette,
      color: 'bg-blue-500'
    },
    collection: {
      icon: FileImage,
      color: 'bg-teal-500'
    }
  }

  const config = formatConfig[data.format] || formatConfig.image
  const Icon = config.icon

  return (
    <>
    <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
    <div className="flex flex-col items-center gap-2 px-2 py-1">
      <div className="text-xs font-semibold text-gray-700 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
        {data.label || formatLabel[data.format] || formatLabel.image}
      </div>

      <div className="relative">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-blue-500 border-2 border-white"
        />

        <div className={`
          w-20 h-20 rounded-full flex items-center justify-center
          ${config.color} text-white shadow-lg
          hover:scale-110 hover:shadow-xl
          transition-all duration-300 cursor-pointer
        `}>
          <Icon className="w-10 h-10" />
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-blue-500 border-2 border-white"
        />
      </div>
    </div>
    </>
  )
})

VisualCreativeNode.displayName = 'VisualCreativeNode'

export default VisualCreativeNode
