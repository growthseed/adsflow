import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Users } from 'lucide-react'

export interface VisualAudienceNodeData {
  label?: string
}

const VisualAudienceNode = memo(({ data }: NodeProps & { data: VisualAudienceNodeData }) => {
  return (
    <>
    {/* Badge circular de tamanho fixo — sem NodeResizer (mesmo motivo do BrandNode). */}
    <div className="flex flex-col items-center gap-1 px-1 py-0.5">
      <div className="text-xs font-semibold text-gray-700 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
        {data?.label || 'Público'}
      </div>

      <div className="relative">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-blue-500 border-2 border-white"
        />

        <div className="
          w-16 h-16 rounded-full flex items-center justify-center
          bg-purple-500 text-white shadow-lg
          hover:scale-110 hover:shadow-xl
          transition-all duration-300 cursor-pointer
        ">
          <Users className="w-8 h-8" />
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

VisualAudienceNode.displayName = 'VisualAudienceNode'

export default VisualAudienceNode
