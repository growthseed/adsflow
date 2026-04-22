import { useMemo } from 'react'

import { BLOCK_LIBRARY } from '../library'
import type { LibraryBlockDef } from '../types'

interface Props {
  onDragStart: (type: LibraryBlockDef) => void
}

export function BlockLibrary({ onDragStart }: Props) {
  const grouped = useMemo(() => {
    const m = new Map<string, LibraryBlockDef[]>()
    for (const b of BLOCK_LIBRARY) {
      if (!m.has(b.category)) m.set(b.category, [])
      m.get(b.category)!.push(b)
    }
    return Array.from(m.entries())
  }, [])

  return (
    <aside className="bg-white border border-neutral-200 rounded-xl p-3 overflow-y-auto max-h-[70vh]">
      <h3 className="eyebrow text-neutral-600 mb-2 px-1">Biblioteca</h3>
      {grouped.map(([cat, items]) => (
        <div key={cat} className="mb-3">
          <div className="text-[10px] uppercase tracking-[0.05em] text-neutral-400 font-semibold mb-1 px-1">
            {cat}
          </div>
          <div className="space-y-1">
            {items.map((b) => (
              <div
                key={b.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-adsflow-block', b.type)
                  e.dataTransfer.effectAllowed = 'copy'
                  onDragStart(b)
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-brand-50 hover:text-brand-700 text-neutral-700 text-[12.5px] border border-transparent hover:border-brand-100"
              >
                <span
                  aria-hidden
                  className="w-6 h-6 rounded bg-neutral-100 grid place-items-center text-[11px] font-bold shrink-0"
                >
                  {b.iconChar}
                </span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  )
}
