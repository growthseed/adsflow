import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

interface DeltaProps {
  /** valor absoluto do delta (positivo ou negativo); ex. 12.3 = +12,3% */
  value: number
  /** 'lower_is_better' inverte a cor (CPL caindo é bom) */
  betterIs?: 'higher' | 'lower'
  suffix?: string
  className?: string
}

/**
 * Delta — indicador ▲/▼ com cor semântica segundo a direção e o
 * contexto. Handoff V2: CPL caindo não é "negativo neutro", é positivo.
 */
export function Delta({ value, betterIs = 'higher', suffix = '%', className = '' }: DeltaProps) {
  const rounded = Math.abs(value) < 0.05 ? 0 : value
  const sign = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat'
  const isPositive =
    sign === 'flat' ? null : betterIs === 'higher' ? sign === 'up' : sign === 'down'

  const colorClass =
    isPositive === null
      ? 'text-neutral-500'
      : isPositive
      ? 'text-success-600'
      : 'text-error-600'

  const Icon = sign === 'up' ? ArrowUp : sign === 'down' ? ArrowDown : Minus
  const magnitude =
    sign === 'flat'
      ? '0'
      : Math.abs(rounded).toLocaleString('pt-BR', { maximumFractionDigits: 1 })

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold tabular ${colorClass} ${className}`}
    >
      <Icon size={12} strokeWidth={2.5} />
      {magnitude}
      {suffix}
    </span>
  )
}
