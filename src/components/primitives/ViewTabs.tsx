import type { ReactNode } from 'react'

export interface ViewTabItem<K extends string = string> {
  key: K
  label: string
  count?: number
  icon?: ReactNode
}

interface ViewTabsProps<K extends string> {
  items: ViewTabItem<K>[]
  value: K
  onChange: (key: K) => void
  className?: string
  ariaLabel?: string
}

/**
 * ViewTabs — tab switcher pill-style usado no topo de views densas
 * (Home, Client Overview). Persistência de escolha fica a cargo do
 * container via URL ou localStorage.
 */
export function ViewTabs<K extends string>({
  items,
  value,
  onChange,
  className = '',
  ariaLabel,
}: ViewTabsProps<K>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={['flex items-center gap-1 p-1 bg-neutral-100 rounded-xl w-fit', className].join(' ')}
    >
      {items.map((it) => {
        const active = it.key === value
        return (
          <button
            key={it.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.key)}
            className={[
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-white text-neutral-900 shadow-[var(--shadow-xs)]'
                : 'text-neutral-600 hover:text-neutral-900',
            ].join(' ')}
          >
            {it.icon}
            {it.label}
            {it.count != null && (
              <span
                className={[
                  'inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold tabular',
                  active ? 'bg-brand-50 text-brand-700' : 'bg-neutral-200 text-neutral-700',
                ].join(' ')}
              >
                {it.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
