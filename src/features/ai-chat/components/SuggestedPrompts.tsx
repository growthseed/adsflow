import { AlertTriangle, BarChart3, Gift, ListTodo, Trophy } from 'lucide-react'

interface Prompt {
  tone: 'brand' | 'warning' | 'success' | 'info' | 'accent'
  icon: React.ElementType
  title: string
  body: string
  prompt: string
}

const PROMPTS: Prompt[] = [
  {
    tone: 'brand',
    icon: BarChart3,
    title: 'Resumo semanal da carteira',
    body: 'Quais clientes bateram meta, quais precisam de atenção',
    prompt: 'Faça um resumo semanal de toda a carteira: quem bateu meta, quem está em risco, e sugira 3 ações prioritárias.',
  },
  {
    tone: 'warning',
    icon: AlertTriangle,
    title: 'Por que X subiu/caiu?',
    body: 'Causas prováveis com dados de suporte',
    prompt: 'Analise por que o CPL subiu esta semana e liste as causas prováveis, com dados de suporte.',
  },
  {
    tone: 'success',
    icon: Gift,
    title: 'Gerar criativos por nicho',
    body: '3 variações adaptadas ao tom do cliente',
    prompt: 'Gere 3 variações de copy para criativos no nicho do cliente ativo, com tons diferentes (medo, prova social, oferta).',
  },
  {
    tone: 'info',
    icon: ListTodo,
    title: 'Pauta pra call com cliente',
    body: '4 tópicos priorizados + números',
    prompt: 'Monte uma pauta de 4 tópicos para a próxima call, com números de suporte.',
  },
  {
    tone: 'accent',
    icon: Trophy,
    title: 'Como X está vs nicho?',
    body: 'Anônimo, comparando com carteira',
    prompt: 'Compare o cliente ativo com os outros do mesmo nicho na carteira (de forma anônima) em CPL, ROAS e CTR.',
  },
]

const toneClasses: Record<Prompt['tone'], string> = {
  brand:   'text-brand-700',
  warning: 'text-warning-600',
  success: 'text-success-700',
  info:    'text-info-600',
  accent:  'text-[#7c3aed]',
}

interface Props {
  onSelect: (prompt: string) => void
}

export function SuggestedPrompts({ onSelect }: Props) {
  return (
    <div className="space-y-2">
      <div className="eyebrow text-neutral-600 mb-1">Perguntas rápidas</div>
      {PROMPTS.map((p) => {
        const Icon = p.icon
        return (
          <button
            key={p.title}
            onClick={() => onSelect(p.prompt)}
            className="w-full text-left bg-white border border-neutral-200 rounded-lg p-3 hover:border-brand-500 hover:shadow-[var(--shadow-soft)] transition-colors"
          >
            <div
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${toneClasses[p.tone]}`}
            >
              <Icon size={11} /> {p.title}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 leading-snug">{p.body}</p>
          </button>
        )
      })}
    </div>
  )
}
