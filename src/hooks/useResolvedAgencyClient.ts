import { useMemo } from 'react'

import { getClientBySlug } from '@/services/adapters/clickupAdapter'
import type { AgencyClient } from '@/services/adapters/clickupTypes'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Resolve o cliente pela fonte mais completa disponível. O snapshot do
 * ClickUp continua preferido quando existe; clientes recém-criados usam a
 * identidade do Supabase até o primeiro sync de tarefas chegar.
 */
export function useResolvedAgencyClient(clientSlug?: string): AgencyClient | undefined {
  const { clients } = useAuth()

  return useMemo(() => {
    if (!clientSlug) return undefined

    const fromSnapshot = getClientBySlug(clientSlug)
    if (fromSnapshot) return fromSnapshot

    const membership = clients.find((item) => item.client.slug === clientSlug)
    if (!membership) return undefined

    return {
      slug: membership.client.slug,
      name: membership.client.name,
      short_name: membership.client.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase(),
      clickup_folder_id: '',
      clickup_folder_name: '',
      avatar_gradient: 'from-slate-500 to-slate-700',
      industry: membership.client.industry || undefined,
      city: undefined,
      task_count: 0,
      stats: {
        urgent: 0,
        in_progress: 0,
        review: 0,
        upcoming: 0,
        backlog: 0,
        done: 0,
        overdue: 0,
        total_active: 0,
      },
      upcoming_tasks: [],
      all_tasks: [],
      last_synced_at: new Date(0).toISOString(),
      clickup_url: '',
    }
  }, [clientSlug, clients])
}
