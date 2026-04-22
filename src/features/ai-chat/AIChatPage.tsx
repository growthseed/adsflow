import { useEffect, useRef } from 'react'
import { Settings2, Sparkles, Users } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/primitives'
import { ChatBubble } from './components/ChatBubble'
import { ChatInput } from './components/ChatInput'
import { SuggestedPrompts } from './components/SuggestedPrompts'
import { useAIChat } from './hooks/useAIChat'

export default function AIChatPage() {
  const { activeClient } = useAuth()
  const clientId = activeClient?.client.id ?? null
  const clientName = activeClient?.client.name ?? null
  const { messages, send, sending, provider, reset } = useAIChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSuggestion = (prompt: string) => {
    send(prompt, { clientId })
  }

  return (
    <div className="max-w-layout mx-auto">
      <section
        className="rounded-2xl p-6 mb-5 text-white"
        style={{ background: 'var(--gradient-primary)' }}
      >
        <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] bg-white/15 rounded-full px-2.5 py-1 mb-2">
          <Sparkles size={12} /> AdsFlow AI
        </div>
        <h1 className="text-[28px] font-bold tracking-[-0.02em]">
          Copiloto da sua operação
        </h1>
        <p className="text-[13px] text-white/85 mt-1.5 max-w-[640px]">
          Pergunte sobre qualquer cliente, compare períodos, gere criativos — a IA tem contexto
          dos dados, histórico e metas. Clientes enterprise rodam em Claude; demais em OpenAI.
        </p>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <Card className="flex flex-col h-[70vh] overflow-hidden">
            <header className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
              <div className="w-9 h-9 rounded-lg bg-gradient-primary text-white grid place-items-center">
                <Sparkles size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-neutral-900">AdsFlow AI</div>
                <div className="text-[11px] text-neutral-500 truncate">
                  {clientName ? (
                    <>
                      Contexto: <b className="text-brand-700">{clientName}</b> · últimos 90 dias
                    </>
                  ) : (
                    <>Sem cliente selecionado — resposta em modo carteira</>
                  )}
                  {provider && <> · via {provider === 'claude' ? 'Claude' : 'OpenAI'}</>}
                </div>
              </div>
              <button
                onClick={reset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-700"
              >
                <Users size={12} /> Nova conversa
              </button>
              <button
                aria-label="configurações"
                className="w-8 h-8 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
              >
                <Settings2 size={14} />
              </button>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50"
            >
              {messages.length === 0 && (
                <div className="h-full grid place-items-center text-center">
                  <div className="max-w-sm">
                    <Sparkles size={28} className="mx-auto mb-3 text-brand-600" />
                    <div className="text-sm font-semibold text-neutral-900">
                      Pronto pra começar
                    </div>
                    <p className="text-[12px] text-neutral-500 mt-1">
                      Escolha uma sugestão à direita ou envie sua pergunta no campo abaixo.
                    </p>
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
            </div>

            <div className="p-3 border-t border-neutral-100 bg-white">
              <ChatInput
                onSubmit={(text) => send(text, { clientId })}
                disabled={sending}
                placeholder={
                  sending
                    ? 'Gerando resposta…'
                    : 'Pergunte ou peça algo — Shift+Enter para quebrar linha'
                }
              />
              <p className="text-[10px] text-neutral-400 mt-2">
                Toda recomendação da IA é sugestão — nada é executado sem confirmação.
              </p>
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <SuggestedPrompts onSelect={handleSuggestion} />
        </div>
      </div>
    </div>
  )
}
