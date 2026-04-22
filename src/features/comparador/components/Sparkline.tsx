interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  color?: string
  ariaLabel?: string
}

/**
 * Sparkline SVG — linha + área preenchida com opacidade baixa.
 * Até 30 pontos usa SVG direto (handoff V2). Sem eixos, sem labels.
 */
export function Sparkline({
  data,
  width = 120,
  height = 28,
  strokeWidth = 1.5,
  color = 'var(--color-brand-600)',
  ariaLabel,
}: SparklineProps) {
  if (data.length < 2) {
    return (
      <div
        aria-label={ariaLabel ?? 'sem tendência'}
        className="text-[11px] text-neutral-400 tabular"
        style={{ width, height }}
      >
        —
      </div>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const toY = (v: number) => height - ((v - min) / range) * (height - 2) - 1

  const line = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(2)} ${toY(v).toFixed(2)}`)
    .join(' ')
  const area = `${line} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel ?? 'tendência'}
      className="overflow-visible"
    >
      <path d={area} fill={color} fillOpacity={0.1} />
      <path d={line} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
