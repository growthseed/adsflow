import { useCallback, useRef, useState } from 'react'
import type { Node, Edge } from '@xyflow/react'

export interface FlowSnapshot { nodes: Node[]; edges: Edge[] }

/**
 * Histórico de desfazer/refazer do canvas. Guarda snapshots imutáveis de
 * nodes+edges ANTES de cada mudança relevante (arrastar, adicionar, excluir,
 * editar). Mudanças de seleção e redimensionamento não entram no histórico.
 */
export function usePlannerHistory(limit = 80) {
  const past = useRef<FlowSnapshot[]>([])
  const future = useRef<FlowSnapshot[]>([])
  const lastAt = useRef(0)
  const [depth, setDepth] = useState({ past: 0, future: 0 })
  const sync = () => setDepth({ past: past.current.length, future: future.current.length })

  const record = useCallback((snapshot: FlowSnapshot, { coalesceMs = 0 } = {}) => {
    const now = Date.now()
    if (coalesceMs && now - lastAt.current < coalesceMs && past.current.length) return
    lastAt.current = now
    past.current.push({ nodes: snapshot.nodes, edges: snapshot.edges })
    if (past.current.length > limit) past.current.shift()
    future.current = []
    sync()
  }, [limit])

  const undo = useCallback((current: FlowSnapshot): FlowSnapshot | null => {
    const previous = past.current.pop()
    if (!previous) return null
    future.current.push(current)
    sync()
    return previous
  }, [])

  const redo = useCallback((current: FlowSnapshot): FlowSnapshot | null => {
    const next = future.current.pop()
    if (!next) return null
    past.current.push(current)
    sync()
    return next
  }, [])

  const reset = useCallback(() => { past.current = []; future.current = []; sync() }, [])

  return { record, undo, redo, reset, canUndo: depth.past > 0, canRedo: depth.future > 0 }
}
