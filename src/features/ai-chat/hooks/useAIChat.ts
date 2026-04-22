import { useCallback, useRef, useState } from 'react'

import { supabase } from '@/lib/supabase'

export type AIChatRole = 'user' | 'assistant'

export interface AIChatMessage {
  id: string
  role: AIChatRole
  content: string
  provider?: 'claude' | 'openai'
  model?: string
  streaming?: boolean
}

interface SendOptions {
  clientId?: string | null
  context?: Record<string, unknown>
}

/**
 * Hook que controla a conversa com /api/ai/chat via SSE streaming.
 * Cria bubble do user imediatamente, injeta placeholder "…" e faz
 * append token-a-token conforme o backend emite deltas.
 */
export function useAIChat() {
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [provider, setProvider] = useState<'claude' | 'openai' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setConversationId(null)
    setProvider(null)
    setError(null)
  }, [])

  const send = useCallback(
    async (text: string, opts: SendOptions = {}) => {
      if (!text.trim() || sending) return
      setError(null)

      const userMsg: AIChatMessage = {
        id: `u_${Date.now()}`,
        role: 'user',
        content: text,
      }
      const assistantMsg: AIChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: '',
        streaming: true,
      }
      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setSending(true)

      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) {
        setError('Sessão expirada — faça login novamente.')
        setSending(false)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const resp = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId,
            clientId: opts.clientId ?? null,
            context: opts.context,
            message: text,
          }),
          signal: controller.signal,
        })
        if (!resp.ok || !resp.body) {
          if (resp.status === 404) {
            throw new Error(
              'Endpoint /api/ai/chat não disponível em dev. Rode `vercel dev` em outra porta e defina VITE_API_PROXY no .env.local, ou teste em produção.',
            )
          }
          if (resp.status === 501) {
            throw new Error(
              'Provedor de IA não configurado (ANTHROPIC_API_KEY / OPENAI_API_KEY ausentes no servidor).',
            )
          }
          const body = await resp.text().catch(() => '')
          throw new Error(body || `HTTP ${resp.status}`)
        }

        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const events = buffer.split('\n\n')
          buffer = events.pop() ?? ''
          for (const ev of events) {
            const lines = ev.split('\n')
            let type = 'message'
            let dataStr = ''
            for (const line of lines) {
              if (line.startsWith('event: ')) type = line.slice(7).trim()
              else if (line.startsWith('data: ')) dataStr += line.slice(6)
            }
            if (!dataStr) continue
            try {
              const payload = JSON.parse(dataStr)
              if (type === 'meta') {
                if (payload.conversationId) setConversationId(payload.conversationId)
                if (payload.provider) setProvider(payload.provider)
              } else if (type === 'delta' && typeof payload.text === 'string') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: m.content + payload.text }
                      : m,
                  ),
                )
              } else if (type === 'done') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, streaming: false, provider: provider ?? undefined }
                      : m,
                  ),
                )
              } else if (type === 'error') {
                throw new Error(payload.message ?? 'erro ao gerar resposta')
              }
            } catch (e) {
              if (e instanceof Error && e.message) throw e
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Falha no chat'
        setError(msg)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, streaming: false, content: m.content || `⚠ ${msg}` }
              : m,
          ),
        )
      } finally {
        setSending(false)
      }
    },
    [conversationId, sending, provider],
  )

  const abort = useCallback(() => {
    abortRef.current?.abort()
    setSending(false)
  }, [])

  return { messages, send, sending, provider, conversationId, reset, abort, error }
}
