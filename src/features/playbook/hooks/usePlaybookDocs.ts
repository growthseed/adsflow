import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'
import { PLAYBOOK_DOCS, type PlaybookCategory } from '@/data/playbook'

export interface PlaybookDocRow {
  id: string | null // null quando vem do fallback estático
  slug: string
  title: string
  description: string | null
  category: PlaybookCategory | 'vertical' | 'reference'
  content: string
  position: number
  active: boolean
  isOfficial: boolean
  updatedAt: string | null
  source: 'db' | 'static'
}

interface Row {
  id: string
  slug: string
  title: string
  description: string | null
  category: 'intro' | 'checklist' | 'vertical' | 'reference'
  content: string
  position: number
  active: boolean
  is_official: boolean
  updated_at: string
}

function toDoc(r: Row): PlaybookDocRow {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category,
    content: r.content,
    position: r.position,
    active: r.active,
    isOfficial: r.is_official,
    updatedAt: r.updated_at,
    source: 'db',
  }
}

/**
 * Carrega docs de playbook_docs. Se tabela vazia (primeira visita),
 * devolve os estáticos de @/data/playbook como fallback — playbook
 * sempre tem conteúdo útil, mesmo antes do admin salvar nada.
 */
export function usePlaybookDocs() {
  const [docs, setDocs] = useState<PlaybookDocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadTick, setReloadTick] = useState(0)
  const reload = useCallback(() => setReloadTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    supabase
      .from('playbook_docs')
      .select('*')
      .order('category')
      .order('position')
      .then(({ data }) => {
        if (cancelled) return
        const rows = (data as Row[] | null) ?? []
        if (rows.length > 0) {
          setDocs(rows.map(toDoc))
        } else {
          // Fallback: estáticos
          setDocs(
            PLAYBOOK_DOCS.map((d, i) => ({
              id: null,
              slug: d.slug,
              title: d.title,
              description: d.description,
              category: d.category,
              content: d.content,
              position: i,
              active: true,
              isOfficial: true,
              updatedAt: null,
              source: 'static',
            })),
          )
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadTick])

  const save = useCallback(
    async (draft: Partial<PlaybookDocRow> & { slug: string; title: string; content: string }): Promise<{ ok: boolean; error?: string }> => {
      const { data: session } = await supabase.auth.getUser()
      const userId = session.user?.id
      const payload = {
        slug: draft.slug,
        title: draft.title,
        description: draft.description ?? null,
        category: draft.category ?? 'checklist',
        content: draft.content,
        position: draft.position ?? 999,
        active: draft.active ?? true,
        is_official: draft.isOfficial ?? false,
        updated_by: userId,
      }
      if (draft.id) {
        const { error } = await supabase.from('playbook_docs').update(payload).eq('id', draft.id)
        if (error) return { ok: false, error: error.message }
      } else {
        const { error } = await supabase.from('playbook_docs').insert(payload)
        if (error) return { ok: false, error: error.message }
      }
      reload()
      return { ok: true }
    },
    [reload],
  )

  const remove = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      const { error } = await supabase.from('playbook_docs').delete().eq('id', id)
      if (error) return { ok: false, error: error.message }
      reload()
      return { ok: true }
    },
    [reload],
  )

  return { docs, loading, save, remove, reload }
}
