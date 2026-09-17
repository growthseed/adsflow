import supabase from '@/lib/supabase'

/**
 * Chamadas autenticadas ao roteador `/api/integrations` usadas pelo Planner
 * (biblioteca de logos e miniaturas de páginas). Sempre envia o JWT do usuário;
 * o servidor valida a associação com o cliente antes de tocar no storage.
 */
export async function plannerRequest<T>(op: string, params: Record<string, string>, body?: unknown, init: { signal?: AbortSignal } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error('Sua sessão expirou.')
  const query = new URLSearchParams({ op, ...params })
  const response = await fetch(`/api/integrations?${query}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: init.signal,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Falha na comunicação com o servidor.')
  return result as T
}

export interface ScreenshotResult { url: string; cached: boolean; capturedAt: string }

/** Captura (ou reaproveita do cache) a miniatura real de uma página. */
export function captureThumbnail(clientSlug: string, url: string, refresh = false, signal?: AbortSignal) {
  return plannerRequest<ScreenshotResult>('planner-screenshot', { client_slug: clientSlug, url, ...(refresh ? { refresh: '1' } : {}) }, undefined, { signal })
}
