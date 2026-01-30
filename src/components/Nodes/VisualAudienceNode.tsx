import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Users } from 'lucide-react'

const VisualAudienceNode = memo(({ }: NodeProps) => {
  return (
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
  )
})

VisualAudienceNode.displayName = 'VisualAudienceNode'

export default VisualAudienceNode
