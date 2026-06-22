/**
 * <NPSGaugeWidget> — Speedometer NPS com 3 zonas (Detrator / Passivo / Promotor).
 *
 * NPS Score = %Promotores − %Detratores  (range -100 a +100)
 * Agulha anima de -100 até o valor real com easing.
 */

import { useEffect, useState } from 'react'
import { ChartCard } from '../ChartCard'

export interface NPSGaugeWidgetProps {
  title: string
  subtitle?: string
  /** -100 a +100 */
  npsScore: number
  /** Distribuição percentual (0-100 cada) */
  promotores: number
  passivos: number
  detratores: number
  /** Total de respostas */
  totalRespostas?: number
  /** Comparativo (delta vs período anterior) */
  delta?: number | null
  height?: number
}

function classify(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'World-class', color: '#00C896' }
  if (score >= 50) return { label: 'Excelente', color: '#10B981' }
  if (score >= 30) return { label: 'Ótimo', color: '#3B82F6' }
  if (score >= 0)  return { label: 'Bom', color: '#FFB800' }
  return { label: 'Em alerta', color: '#FF4D4D' }
}

export default function NPSGaugeWidget({
  title, subtitle, npsScore, promotores, passivos, detratores, totalRespostas, delta, height = 320,
}: NPSGaugeWidgetProps) {
  const [animScore, setAnimScore] = useState(-100)

  // Anima de -100 até o score real (1.2s easing)
  useEffect(() => {
    const start = -100
    const end = Math.max(-100, Math.min(100, npsScore))
    const duration = 1200
    const startTime = performance.now()
    let raf = 0
    const step = (t: number) => {
      const elapsed = t - startTime
      const progress = Math.min(1, elapsed / duration)
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimScore(start + (end - start) * eased)
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [npsScore])

  const { label, color } = classify(npsScore)

  // Converte NPS (-100..+100) em ângulo (-90° à esquerda, +90° à direita)
  // Total arc = 180° (semi-circle). Score -100 = -90°, +100 = +90°
  const angleDeg = (animScore / 100) * 90 // -90 a +90

  // SVG geometry
  const cx = 150
  const cy = 130
  const r = 110
  const strokeW = 18

  // Helper pra arc path
  function arcPath(startAngle: number, endAngle: number, radius = r): string {
    const startRad = ((startAngle - 90) * Math.PI) / 180
    const endRad = ((endAngle - 90) * Math.PI) / 180
    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)
    const large = endAngle - startAngle > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }

  // 3 zonas: Detratores (-90 a -30°), Passivos (-30 a +30°), Promotores (+30 a +90°)
  // Mas em ângulos de arc SVG: começa em -90° (esq) e vai até +90° (dir)
  // Convertendo: detrator = arc do -90° (start) ao -30°, passivo -30 a 30°, promotor 30 a 90°
  // No nosso sistema startAngle=0 é o topo, +90 = direita, -90 = esquerda
  // Vamos usar 180° -> 0° (semicirc inferior superior)
  // Detrator: 180 - 240 graus (esquerda baixa)
  // Vou usar approach mais direto: arc de 180° a 360°

  // Detrator arc: -90° a -30° (esquerda)
  // Passivo arc: -30° a +30° (centro)
  // Promotor arc: +30° a +90° (direita)
  function arcAtAngles(a1: number, a2: number) {
    return arcPath(a1, a2)
  }

  // Agulha
  const needleRad = ((angleDeg - 90) * Math.PI) / 180
  const needleLen = r - 4
  const nx = cx + needleLen * Math.cos(needleRad)
  const ny = cy + needleLen * Math.sin(needleRad)

  return (
    <ChartCard title={title} subtitle={subtitle} height={height}>
      <div className="h-full flex flex-col items-center justify-center">
        <svg viewBox="0 0 300 200" className="w-full max-w-[300px]" style={{ overflow: 'visible' }}>
          {/* 3 Zonas */}
          <path d={arcAtAngles(-90, -30)} fill="none" stroke="#FF4D4D" strokeWidth={strokeW} strokeLinecap="butt" />
          <path d={arcAtAngles(-30, 30)} fill="none" stroke="#FFB800" strokeWidth={strokeW} strokeLinecap="butt" />
          <path d={arcAtAngles(30, 90)} fill="none" stroke="#00C896" strokeWidth={strokeW} strokeLinecap="butt" />

          {/* Tick marks */}
          {[-100, -50, 0, 50, 100].map((v) => {
            const a = (v / 100) * 90
            const rad = ((a - 90) * Math.PI) / 180
            const r2 = r + 22
            const x2 = cx + r2 * Math.cos(rad)
            const y2 = cy + r2 * Math.sin(rad)
            return (
              <g key={v}>
                <text x={x2} y={y2} fontSize="10" fill="#6B7280" textAnchor="middle" dominantBaseline="middle">
                  {v > 0 ? `+${v}` : v}
                </text>
              </g>
            )
          })}

          {/* Agulha (animada) */}
          <line x1={cx} y1={cy} x2={nx} y2={ny}
            stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="8" fill={color} />
          <circle cx={cx} cy={cy} r="3" fill="white" />

          {/* Score central */}
          <text x={cx} y={cy + 50} fontSize="32" fontWeight="bold" fill={color} textAnchor="middle">
            {Math.round(animScore)}
          </text>
          <text x={cx} y={cy + 70} fontSize="10" fill="#6B7280" textAnchor="middle" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            NPS Score
          </text>
        </svg>

        {/* Label classificação */}
        <div className="mt-2 flex items-center gap-2">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
            style={{ background: color }}
          >
            {label}
          </span>
          {delta != null && !Number.isNaN(delta) && (
            <span className={`text-xs ${delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)} vs período anterior
            </span>
          )}
        </div>

        {/* Breakdown */}
        <div className="mt-3 grid grid-cols-3 gap-3 w-full max-w-[300px] text-center">
          <div>
            <div className="text-[10px] uppercase text-gray-400">Detratores</div>
            <div className="text-lg font-bold text-red-600">{detratores.toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-gray-400">Passivos</div>
            <div className="text-lg font-bold text-amber-600">{passivos.toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-gray-400">Promotores</div>
            <div className="text-lg font-bold text-emerald-600">{promotores.toFixed(0)}%</div>
          </div>
        </div>

        {totalRespostas != null && (
          <div className="mt-2 text-[10px] text-gray-400">{totalRespostas.toLocaleString('pt-BR')} respostas</div>
        )}
      </div>
    </ChartCard>
  )
}
