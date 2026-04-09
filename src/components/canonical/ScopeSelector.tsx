/**
 * ============================================
 * <ScopeSelector> — AdFlow v4 canonical component
 * ============================================
 * Dropdown to switch between project scopes (Performance,
 * Branding, Social, Lead Gen, E-commerce, Educação, Híbrido,
 * Custom). Changing the scope updates the success metrics
 * shown on the hero strip of the client Visão Geral page.
 *
 * Usage:
 *   <ScopeSelector value={scope} onChange={setScope} />
 * ============================================
 */

import { useState, useRef, useEffect } from 'react'
import { PROJECT_SCOPE_LIST } from '@/data/projectScopes'
import type { ProjectScopeId } from '@/types/metrics'

export interface ScopeSelectorProps {
  value: ProjectScopeId
  onChange: (scope: ProjectScopeId) => void
  /** Show description under each option */
  showDescriptions?: boolean
  className?: string
}

export function ScopeSelector({
  value,
  onChange,
  showDescriptions = true,
  className = '',
}: ScopeSelectorProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const current = PROJECT_SCOPE_LIST.find((s) => s.id === value) || PROJECT_SCOPE_LIST[0]

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center gap-2 px-3 py-2
          bg-[var(--surface-card)]
          border border-[var(--border-default)]
          rounded-lg text-sm font-medium text-neutral-900
          hover:border-brand-400 hover:bg-brand-50
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1
          transition-all duration-fast
          min-w-[180px]
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex-1 text-left truncate">{current.name}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-fast ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className={`
            absolute left-0 top-full mt-1 z-dropdown
            bg-[var(--surface-card)]
            border border-[var(--border-subtle)]
            rounded-lg shadow-lg
            min-w-[280px] max-w-[360px]
            py-1 overflow-hidden
            animate-in fade-in slide-in-from-top-1
          `}
          role="listbox"
        >
          {PROJECT_SCOPE_LIST.map((scope) => {
            const selected = scope.id === value
            return (
              <button
                key={scope.id}
                type="button"
                onClick={() => {
                  onChange(scope.id)
                  setOpen(false)
                }}
                className={`
                  w-full text-left px-3 py-2.5
                  hover:bg-[var(--surface-sunken)]
                  transition-colors duration-fast
                  ${selected ? 'bg-brand-50' : ''}
                `}
                role="option"
                aria-selected={selected}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`
                        text-sm font-medium
                        ${selected ? 'text-brand-700' : 'text-neutral-900'}
                      `}
                    >
                      {scope.name}
                    </p>
                    {showDescriptions && scope.description && (
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">
                        {scope.description}
                      </p>
                    )}
                  </div>
                  {selected && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-brand-600 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
