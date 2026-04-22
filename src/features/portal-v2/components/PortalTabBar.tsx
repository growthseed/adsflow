import { BarChart3, Home, ListTodo, MessageCircle } from 'lucide-react'

import type { PortalViewKey } from '../types'

interface Props {
  value: PortalViewKey
  onChange: (v: PortalViewKey) => void
  showChat: boolean
}

interface Item {
  key: PortalViewKey
  label: string
  icon: React.ElementType
}

const BASE: Item[] = [
  { key: 'hoje',    label: 'Hoje',    icon: Home },
  { key: 'dados',   label: 'Dados',   icon: BarChart3 },
  { key: 'tarefas', label: 'Tarefas', icon: ListTodo },
]

const CHAT: Item = { key: 'chat', label: 'Chat', icon: MessageCircle }

/**
 * Bottom tab bar mobile. 3-4 abas conforme config do portal.
 */
export function PortalTabBar({ value, onChange, showChat }: Props) {
  const items = showChat ? [...BASE, CHAT] : BASE
  return (
    <nav
      role="tablist"
      className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 grid z-20"
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
    >
      {items.map((it) => {
        const active = it.key === value
        const Icon = it.icon
        return (
          <button
            key={it.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.key)}
            className={`flex flex-col items-center justify-center py-2.5 text-[10px] font-medium gap-1 transition-colors ${
              active ? 'text-brand-700' : 'text-neutral-500'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            {it.label}
          </button>
        )
      })}
    </nav>
  )
}
