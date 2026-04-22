import { useMemo } from 'react'

type Size = 'xs' | 'sm' | 'md' | 'lg'

interface AvatarProps {
  name: string
  imageUrl?: string
  size?: Size
  className?: string
}

const sizeClasses: Record<Size, string> = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

// Paleta derivada da escala brand/semantic — estável por hash do nome
const hues = [
  'bg-gradient-to-br from-[#6488ae] to-[#3b536e]', // brand
  'bg-gradient-to-br from-[#22c55e] to-[#15803d]', // success
  'bg-gradient-to-br from-[#f59e0b] to-[#b45309]', // warning
  'bg-gradient-to-br from-[#ef4444] to-[#b91c1c]', // error
  'bg-gradient-to-br from-[#2563eb] to-[#1d4ed8]', // info
  'bg-gradient-to-br from-[#8b5cf6] to-[#5b21b6]', // violet
  'bg-gradient-to-br from-[#ec4899] to-[#9d174d]', // pink
  'bg-gradient-to-br from-[#0ea5e9] to-[#075985]', // sky
]

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Avatar — foto ou iniciais com gradiente derivado do nome.
 * Sizes: xs 20px · sm 24px · md 32px · lg 40px.
 */
export function Avatar({ name, imageUrl, size = 'md', className = '' }: AvatarProps) {
  const tone = useMemo(() => hues[hashName(name) % hues.length], [name])
  const label = useMemo(() => initials(name), [name])

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClasses[size]} rounded-full grid place-items-center text-white font-semibold shrink-0 ${tone} ${className}`}
    >
      {label}
    </div>
  )
}
