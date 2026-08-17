/**
 * <PivotHierarchicalWidget> — tabela com hierarquia expandível.
 * Padrão MidiaHub "Meta Ads": Campanha → Conjunto → Anúncio × métricas.
 * Também serve hierarquias de pessoas: Gestor → Time → Membro.
 *
 * Input flat: array de records. A hierarquia é uma lista de keys.
 * Internamente agrupa e calcula totais por nível.
 */

import { useMemo, useState } from 'react'
import { ChartCard } from '../ChartCard'

export interface PivotMetric {
  key: string
  label: string
  format?: 'currency' | 'number' | 'percent' | 'ratio' | 'text'
  align?: 'left' | 'right' | 'center'
}

export interface PivotHierarchicalWidgetProps {
  title: string
  subtitle?: string
  data: Array<Record<string, unknown>>
  /** Keys da hierarquia (do mais alto pro mais baixo nível) */
  hierarchy: string[]
  metrics: PivotMetric[]
  defaultExpandDepth?: number
  height?: number
}

interface TreeNode {
  key: string
  label: string
  level: number
  pathKey: string
  metrics: Record<string, number>
  children?: TreeNode[]
}

function fmt(v: unknown, format: PivotMetric['format']): string {
  if (v == null || v === '') return '—'
  if (format === 'text') return String(v)
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return String(v)
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
    case 'percent':
      return `${(n * 100).toFixed(1).replace('.', ',')}%`
    case 'ratio':
      return `${n.toFixed(2).replace('.', ',')}x`
    default:
      return n.toLocaleString('pt-BR')
  }
}

function buildTree(
  data: Array<Record<string, unknown>>,
  hierarchy: string[],
  metrics: PivotMetric[],
): TreeNode[] {
  function recurse(rows: typeof data, level: number, parentPath: string): TreeNode[] {
    if (level >= hierarchy.length) return []
    const key = hierarchy[level]
    const groups = new Map<string, typeof data>()
    for (const r of rows) {
      const v = String(r[key] ?? '—')
      if (!groups.has(v)) groups.set(v, [])
      groups.get(v)!.push(r)
    }
    return Array.from(groups.entries()).map(([groupVal, items]) => {
      const pathKey = parentPath ? `${parentPath}/${groupVal}` : groupVal
      // Sum métricas (numéricas)
      const sums: Record<string, number> = {}
      for (const m of metrics) {
        if (m.format === 'text') {
          sums[m.key] = 0
        } else {
          sums[m.key] = items.reduce((acc, r) => acc + (Number(r[m.key]) || 0), 0)
        }
      }
      return {
        key,
        label: groupVal,
        level,
        pathKey,
        metrics: sums,
        children: level + 1 < hierarchy.length ? recurse(items, level + 1, pathKey) : undefined,
      }
    })
  }
  return recurse(data, 0, '')
}

export default function PivotHierarchicalWidget({
  title,
  subtitle,
  data,
  hierarchy,
  metrics,
  defaultExpandDepth = 1,
  height = 400,
}: PivotHierarchicalWidgetProps) {
  const tree = useMemo(() => buildTree(data, hierarchy, metrics), [data, hierarchy, metrics])
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>()
    function seed(nodes: TreeNode[]) {
      for (const n of nodes) {
        if (n.level < defaultExpandDepth) {
          s.add(n.pathKey)
          if (n.children) seed(n.children)
        }
      }
    }
    seed(tree)
    return s
  })

  const isEmpty = !data || data.length === 0
  const toggle = (k: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  function renderRows(nodes: TreeNode[]): React.ReactNode[] {
    const out: React.ReactNode[] = []
    for (const n of nodes) {
      const isOpen = expanded.has(n.pathKey)
      const hasChildren = n.children && n.children.length > 0
      out.push(
        <tr
          key={n.pathKey}
          className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-alt)] cursor-pointer"
          onClick={() => hasChildren && toggle(n.pathKey)}
        >
          <td
            className="px-2 py-1.5 text-xs"
            style={{ paddingLeft: `${n.level * 16 + 8}px` }}
          >
            <span className="inline-block w-4 text-[var(--text-tertiary)]">
              {hasChildren ? (isOpen ? '▾' : '▸') : ''}
            </span>
            <span className={n.level === 0 ? 'font-semibold' : ''}>{n.label}</span>
          </td>
          {metrics.map((m) => (
            <td
              key={m.key}
              className="px-2 py-1.5 text-xs font-mono"
              style={{ textAlign: m.align ?? 'right' }}
            >
              {fmt(n.metrics[m.key], m.format)}
            </td>
          ))}
        </tr>,
      )
      if (hasChildren && isOpen) {
        out.push(...renderRows(n.children!))
      }
    }
    return out
  }

  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={isEmpty}>
      {!isEmpty && (
        <div className="overflow-auto h-full">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-secondary)]">
                  {hierarchy.join(' → ')}
                </th>
                {metrics.map((m) => (
                  <th
                    key={m.key}
                    className="px-2 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                    style={{ textAlign: m.align ?? 'right' }}
                  >
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{renderRows(tree)}</tbody>
          </table>
        </div>
      )}
    </ChartCard>
  )
}
