/**
 * <TableWidget> — Clean sortable table (Reportei-style).
 * No pagination — caller should limit rows before passing.
 */

import { useState, useMemo, type ReactNode } from 'react'
import { ChartCard } from '../ChartCard'

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  /** Text alignment */
  align?: 'left' | 'right' | 'center'
  /** Custom cell renderer */
  render?: (row: T) => ReactNode
  /** Sortable (default true) */
  sortable?: boolean
  /** Width (CSS value) */
  width?: string
}

export interface TableWidgetProps<T> {
  title: string
  subtitle?: string
  columns: TableColumn<T>[]
  rows: T[]
  /** Default sort column key */
  defaultSortKey?: string
  defaultSortDir?: 'asc' | 'desc'
  /** Max height for scroll */
  maxHeight?: number
}

export default function TableWidget<T extends Record<string, unknown>>({
  title,
  subtitle,
  columns,
  rows,
  defaultSortKey,
  defaultSortDir = 'desc',
  maxHeight = 360,
}: TableWidgetProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir)

  const sorted = useMemo(() => {
    if (!sortKey) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return copy
  }, [rows, sortKey, sortDir])

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const isEmpty = !rows || rows.length === 0

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      empty={isEmpty}
      height={maxHeight}
    >
      {!isEmpty && (
        <div className="overflow-auto -mx-4 -my-4" style={{ maxHeight }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                {columns.map((col) => {
                  const k = col.key as string
                  const isSorted = sortKey === k
                  const isSortable = col.sortable !== false
                  return (
                    <th
                      key={k}
                      scope="col"
                      style={{ width: col.width }}
                      className={`px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                      } ${isSortable ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                      onClick={() => isSortable && toggleSort(k)}
                    >
                      <div
                        className={`inline-flex items-center gap-1 ${
                          col.align === 'right'
                            ? 'justify-end'
                            : col.align === 'center'
                              ? 'justify-center'
                              : ''
                        }`}
                      >
                        {col.label}
                        {isSorted && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            {sortDir === 'asc' ? (
                              <polyline points="18 15 12 9 6 15" />
                            ) : (
                              <polyline points="6 9 12 15 18 9" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  {columns.map((col) => {
                    const k = col.key as string
                    return (
                      <td
                        key={k}
                        className={`px-4 py-2.5 text-slate-700 ${
                          col.align === 'right'
                            ? 'text-right tabular-nums'
                            : col.align === 'center'
                              ? 'text-center'
                              : ''
                        }`}
                      >
                        {col.render ? col.render(row) : String(row[k] ?? '—')}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  )
}
