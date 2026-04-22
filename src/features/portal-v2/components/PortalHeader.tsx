import { MoreVertical } from 'lucide-react'

import { Avatar } from '@/components/primitives'

interface Props {
  clientName: string
  clientEmail?: string | null
  onMenu?: () => void
}

export function PortalHeader({ clientName, clientEmail, onMenu }: Props) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-white sticky top-0 z-10">
      <Avatar name={clientName} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-neutral-900 truncate">{clientName}</div>
        {clientEmail && (
          <div className="text-[10px] text-neutral-500 truncate">{clientEmail}</div>
        )}
      </div>
      {onMenu && (
        <button
          onClick={onMenu}
          aria-label="menu"
          className="w-7 h-7 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
        >
          <MoreVertical size={16} />
        </button>
      )}
    </header>
  )
}
