import { Sparkles, User } from 'lucide-react'

import type { AIChatMessage } from '../hooks/useAIChat'

interface Props {
  message: AIChatMessage
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-primary text-white grid place-items-center shrink-0">
          <Sparkles size={14} />
        </div>
      )}
      <div className={`max-w-[78%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug whitespace-pre-wrap ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-md'
              : 'bg-white border border-neutral-200 text-neutral-900 rounded-tl-md'
          }`}
        >
          {message.content || <TypingDots />}
        </div>
        {!isUser && message.provider && !message.streaming && (
          <div className="mt-1 text-[10px] text-neutral-400">
            via {message.provider === 'claude' ? 'Claude' : 'OpenAI'}
            {message.model ? ` · ${message.model}` : ''}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-neutral-200 text-neutral-600 grid place-items-center shrink-0">
          <User size={14} />
        </div>
      )}
    </div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center" aria-label="digitando">
      <Dot delay="0" />
      <Dot delay="0.15s" />
      <Dot delay="0.3s" />
    </span>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse"
      style={{ animationDelay: delay }}
    />
  )
}
