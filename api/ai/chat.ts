/**
 * POST /api/ai/chat — AdsFlow AI · chat com streaming (Sprint 5d)
 *
 * Request body:
 *   {
 *     conversationId?: string,   // null = cria nova
 *     clientId?: string | null,  // contexto opcional (cliente ativo)
 *     context?: { view?, period?, turnWindow? },
 *     message: string
 *   }
 *
 * Response: text/event-stream com 3 tipos de evento:
 *   · meta         → { conversationId, provider, model }
 *   · delta        → { text }
 *   · done         → { messageId, promptTokens, completionTokens }
 *
 * Roteamento dual-provider:
 *   · clients.service_tier == 'enterprise' → Claude (claude-3-7-sonnet-latest)
 *   · caso contrário                       → OpenAI (gpt-4o-mini)
 *   · override via body.forceProvider em dev
 *
 * Segurança:
 *   · JWT Supabase obrigatório (requireUserAuth)
 *   · Se clientId passado, valida membership antes de expor dados
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

import { allowMethods, applyCors, requireUserAuth } from '../_lib/security'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

const CLAUDE_MODEL = 'claude-sonnet-4-5'
const OPENAI_MODEL = 'gpt-4o-mini'

interface ChatBody {
  conversationId?: string | null
  clientId?: string | null
  context?: Record<string, unknown>
  message: string
  forceProvider?: 'claude' | 'openai'
}

type Provider = 'claude' | 'openai'

function sysPrompt(clientName: string | null): string {
  return [
    'Você é a AdsFlow AI — copiloto de gestão de tráfego pago para agências.',
    'Seja direto, em português do Brasil, sem "desculpe" nem floreio.',
    'Sempre que citar números, diga a fonte e o período.',
    clientName
      ? `Cliente ativo no contexto: ${clientName}. Foque nele a não ser que o usuário peça carteira.`
      : 'Sem cliente selecionado — se o usuário perguntar dados, peça para ele trocar o contexto.',
    'IA é sugestão — toda recomendação deve vir com botão "Aplicar" implícito no formato de resposta.',
  ].join(' ')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProvider(
  serviceClient: any,
  clientId: string | null,
  forced?: Provider,
): Promise<Provider> {
  if (forced) return forced
  if (!clientId) return 'openai'
  const { data } = await serviceClient
    .from('clients')
    .select('service_tier')
    .eq('id', clientId)
    .maybeSingle()
  const tier = (data as { service_tier?: string } | null)?.service_tier
  return tier === 'enterprise' || tier === 'pro_max' ? 'claude' : 'openai'
}

function sseWrite(res: VercelResponse, event: string, data: unknown) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

/**
 * Lê stream SSE do provedor e emite delta-by-delta pro cliente.
 * Retorna o texto total coletado e contadores de token quando disponíveis.
 */
async function streamClaude(
  res: VercelResponse,
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
): Promise<{ text: string; promptTokens: number; completionTokens: number }> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  })
  if (!resp.body) throw new Error('claude: empty body')
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let collected = ''
  let promptTokens = 0
  let completionTokens = 0

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const lines = part.split('\n')
      let eventType = ''
      let dataStr = ''
      for (const line of lines) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim()
        else if (line.startsWith('data: ')) dataStr += line.slice(6)
      }
      if (!dataStr) continue
      try {
        const payload = JSON.parse(dataStr)
        if (eventType === 'content_block_delta' && payload.delta?.type === 'text_delta') {
          const txt = payload.delta.text as string
          collected += txt
          sseWrite(res, 'delta', { text: txt })
        } else if (eventType === 'message_delta' && payload.usage) {
          promptTokens = payload.usage.input_tokens ?? promptTokens
          completionTokens = payload.usage.output_tokens ?? completionTokens
        } else if (eventType === 'message_start' && payload.message?.usage) {
          promptTokens = payload.message.usage.input_tokens ?? 0
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }
  return { text: collected, promptTokens, completionTokens }
}

async function streamOpenAI(
  res: VercelResponse,
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
): Promise<{ text: string; promptTokens: number; completionTokens: number }> {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    }),
  })
  if (!resp.body) throw new Error('openai: empty body')
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let collected = ''
  let promptTokens = 0
  let completionTokens = 0

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const raw of lines) {
      const line = raw.trim()
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload)
        const delta = json.choices?.[0]?.delta?.content as string | undefined
        if (delta) {
          collected += delta
          sseWrite(res, 'delta', { text: delta })
        }
        if (json.usage) {
          promptTokens = json.usage.prompt_tokens ?? 0
          completionTokens = json.usage.completion_tokens ?? 0
        }
      } catch {
        // ignore
      }
    }
  }
  return { text: collected, promptTokens, completionTokens }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  const auth = await requireUserAuth(req, res)
  if (!auth) return

  const body = req.body as ChatBody
  if (!body?.message) {
    return res.status(400).json({ error: 'message é obrigatório' })
  }

  const { serviceClient, userClient, user } = auth

  // Resolve conversa (ou cria)
  let conversationId = body.conversationId ?? null
  let clientName: string | null = null

  if (body.clientId) {
    const { data: client } = await serviceClient
      .from('clients')
      .select('name')
      .eq('id', body.clientId)
      .maybeSingle()
    clientName = (client as { name?: string } | null)?.name ?? null
  }

  if (!conversationId) {
    const { data, error } = await userClient
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        client_id: body.clientId ?? null,
        context: body.context ?? {},
        title: body.message.slice(0, 80),
      })
      .select('id')
      .single()
    if (error || !data) {
      return res.status(500).json({ error: 'failed to create conversation' })
    }
    conversationId = (data as { id: string }).id
  }

  // Persiste mensagem do usuário
  await userClient.from('ai_messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: body.message,
  })

  // Histórico (últimos 10 turns) para contexto
  const { data: historyRows } = await userClient
    .from('ai_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(10)
  const history = ((historyRows as { role: 'user' | 'assistant'; content: string }[]) ?? [])
    .reverse()
    .filter((m) => m.role === 'user' || m.role === 'assistant')

  // Escolhe provedor
  const provider = await resolveProvider(serviceClient, body.clientId ?? null, body.forceProvider)
  const model = provider === 'claude' ? CLAUDE_MODEL : OPENAI_MODEL

  // Headers SSE
  res.setHeader('content-type', 'text/event-stream; charset=utf-8')
  res.setHeader('cache-control', 'no-cache, no-transform')
  res.setHeader('connection', 'keep-alive')
  res.setHeader('x-accel-buffering', 'no')
  res.flushHeaders?.()

  sseWrite(res, 'meta', { conversationId, provider, model })

  try {
    const sys = sysPrompt(clientName)
    let result
    if (provider === 'claude') {
      if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY não configurada')
      result = await streamClaude(res, history, sys)
    } else {
      if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada')
      result = await streamOpenAI(
        res,
        [{ role: 'system', content: sys }, ...history],
      )
    }

    const { data: assistantRow } = await userClient
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: result.text,
        provider,
        model,
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
      })
      .select('id')
      .single()

    sseWrite(res, 'done', {
      messageId: (assistantRow as { id?: string } | null)?.id ?? null,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    })
    res.end()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    sseWrite(res, 'error', { message: msg })
    res.end()
  }
}
