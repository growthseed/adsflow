import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'
import type { PortalComment } from '../types'

interface Row {
  id: string
  anchor: string
  author_id: string | null
  author_name: string | null
  body: string
  parent_id: string | null
  resolved_at: string | null
  created_at: string
}

function toComment(r: Row): PortalComment {
  return {
    id: r.id,
    anchor: r.anchor,
    authorId: r.author_id,
    authorName: r.author_name ?? 'Cliente',
    body: r.body,
    parentId: r.parent_id,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
  }
}

/**
 * Hook de thread de comentários por âncora. Escuta Realtime do
 * Supabase para atualizações em tempo real (handoff V2 spec #8).
 */
export function usePortalComments(clientId: string | null | undefined, anchor: string) {
  const [comments, setComments] = useState<PortalComment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) {
      setComments([])
      setLoading(false)
      return
    }
    let cancelled = false

    supabase
      .from('portal_comments')
      .select('*')
      .eq('client_id', clientId)
      .eq('anchor', anchor)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        setComments(((data as Row[]) ?? []).map(toComment))
        setLoading(false)
      })

    const channel = supabase
      .channel(`portal_comments:${clientId}:${anchor}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_comments',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          if ((payload.new as Row | null)?.anchor && (payload.new as Row).anchor !== anchor) return
          if (payload.eventType === 'INSERT') {
            setComments((c) => [...c, toComment(payload.new as Row)])
          } else if (payload.eventType === 'UPDATE') {
            setComments((c) =>
              c.map((it) => (it.id === (payload.new as Row).id ? toComment(payload.new as Row) : it)),
            )
          } else if (payload.eventType === 'DELETE') {
            setComments((c) => c.filter((it) => it.id !== (payload.old as Row).id))
          }
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [clientId, anchor])

  const post = useCallback(
    async (body: string, parentId: string | null = null) => {
      if (!clientId) return null
      const { data: session } = await supabase.auth.getUser()
      const user = session.user
      if (!user) return null
      const { data, error } = await supabase
        .from('portal_comments')
        .insert({
          client_id: clientId,
          anchor,
          body,
          parent_id: parentId,
          author_id: user.id,
          author_name:
            (user.user_metadata?.name as string | undefined) ??
            user.email?.split('@')[0] ??
            'Cliente',
        })
        .select()
        .single()
      if (error || !data) return null
      return toComment(data as Row)
    },
    [clientId, anchor],
  )

  const resolve = useCallback(
    async (id: string) => {
      const { data: session } = await supabase.auth.getUser()
      const user = session.user
      if (!user) return
      await supabase
        .from('portal_comments')
        .update({ resolved_at: new Date().toISOString(), resolved_by: user.id })
        .eq('id', id)
    },
    [],
  )

  return { comments, loading, post, resolve }
}
