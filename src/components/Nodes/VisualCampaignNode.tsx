import { memo } from 'react'
import { Handle, Position, NodeResizer } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Megaphone } from 'lucide-react'

const VisualCampaignNode = memo(({ selected }: NodeProps) => {
  return (
    <>
    <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
      
      <div className="
        w-16 h-16 rounded-full flex items-center justify-center
        bg-green-500 text-white shadow-lg
        hover:scale-110 hover:shadow-xl
        transition-all duration-300 cursor-pointer
      ">
        <Megaphone className="w-8 h-8" />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
    </div>
    </>
  )
})

VisualCampaignNode.displayName = 'VisualCampaignNode'

export default VisualCampaignNode
