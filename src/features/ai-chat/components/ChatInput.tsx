import { useState } from 'react'
import { Send } from 'lucide-react'

interface Props {
  onSubmit: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSubmit, disabled, placeholder }: Props) {
  const [text, setText] = useState('')
  const submit = () => {
    const t = text.trim()
    if (!t) return
    onSubmit(t)
    setText('')
  }
  return (
    <div className="flex items-end gap-2 border border-neutral-200 rounded-xl p-2 bg-white shadow-[var(--shadow-soft)]">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        rows={2}
        disabled={disabled}
        placeholder={placeholder ?? 'Pergunte ou peça algo — Shift+Enter para quebrar linha'}
        className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={disabled || text.trim().length === 0}
        aria-label="enviar"
        className="shrink-0 w-10 h-10 grid place-items-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
      >
        <Send size={16} />
      </button>
    </div>
  )
}
