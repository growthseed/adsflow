import { memo } from 'react'
import { Handle, Position, NodeResizer } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Users } from 'lucide-react'

export interface VisualAudienceNodeData {
  label?: string
}

const VisualAudienceNode = memo(({ data, selected }: NodeProps<VisualAudienceNodeData>) => {
  return (
    <>
    <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
    <div className="flex flex-col items-center gap-2 px-2 py-1">
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
          w-20 h-20 rounded-full flex items-center justify-center
          bg-purple-500 text-white shadow-lg
          hover:scale-110 hover:shadow-xl
          transition-all duration-300 cursor-pointer
        ">
          <Users className="w-10 h-10" />
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
