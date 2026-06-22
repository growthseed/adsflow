/**
 * useMoaiSnapshot — fetch /api/sync/moai-snapshot ou fallback pro mock.
 *
 * Estratégia:
 *   1. Pede GET /api/sync/moai-snapshot
 *   2. Se 200 + snapshot, usa
 *   3. Se 404 / 503 / erro, fallback pro MOAI_MOCK_SNAPSHOT
 *   4. Estado: { snapshot, status: 'live' | 'mock' | 'loading', error }
 *
 * Não bloqueia render — começa com mock + tenta upgrade pra live em
 * background.
 */

import { useEffect, useState } from 'react'
import { MOAI_MOCK_SNAPSHOT } from '@/data/moaiMockSnapshot'

type SnapshotShape = typeof MOAI_MOCK_SNAPSHOT

interface UseMoaiSnapshotResult {
  snapshot: SnapshotShape
  status: 'live' | 'mock' | 'loading'
  error: string | null
  generatedAt: string | null
  refetch: () => Promise<void>
}

export function useMoaiSnapshot(): UseMoaiSnapshotResult {
  const [snapshot, setSnapshot] = useState<SnapshotShape>(MOAI_MOCK_SNAPSHOT)
  const [status, setStatus] = useState<'live' | 'mock' | 'loading'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(MOAI_MOCK_SNAPSHOT.last_synced_at)

  async function fetchSnapshot() {
    // Em dev (Vite) /api/* não está disponível — pula a request e usa mock.
    // Em prod (Vercel) tenta o endpoint real.
    if (import.meta.env.DEV) {
      setStatus('mock')
      setError('Dev mode — usando mock (endpoint /api só em produção Vercel)')
      return
    }
    setStatus('loading')
    try {
      const r = await fetch('/api/sync/moai-snapshot?slug=moai', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      if (!r.ok) {
        setStatus('mock')
        setError(r.status === 404 ? 'Sem snapshot ainda — usando mock' : `Erro ${r.status}`)
        return
      }
      const json = (await r.json()) as {
        ok: boolean
        snapshot: Record<string, unknown>
        meta: { generated_at: string }
      }
      if (json.ok && json.snapshot) {
        const merged = {
          ...MOAI_MOCK_SNAPSHOT,
          ...json.snapshot,
          kpis: {
            ...MOAI_MOCK_SNAPSHOT.kpis,
            ...((json.snapshot as { kpis?: typeof MOAI_MOCK_SNAPSHOT.kpis }).kpis ?? {}),
          },
        } as SnapshotShape
        setSnapshot(merged)
        setStatus('live')
        setGeneratedAt(json.meta?.generated_at ?? null)
        setError(null)
      } else {
        setStatus('mock')
      }
    } catch (e) {
      setStatus('mock')
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    queueMicrotask(() => void fetchSnapshot())
  }, [])

  return { snapshot, status, error, generatedAt, refetch: fetchSnapshot }
}
