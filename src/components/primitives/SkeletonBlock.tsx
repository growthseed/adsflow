interface SkeletonBlockProps {
  className?: string
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  height?: number | string
  width?: number | string
}

const radiusClass: Record<NonNullable<SkeletonBlockProps['radius']>, string> = {
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}

/**
 * SkeletonBlock — placeholder com shimmer 2s. Estado loading é
 * obrigatório por handoff V2 (skeleton com mesma altura do conteúdo).
 */
export function SkeletonBlock({
  className = '',
  radius = 'md',
  height,
  width,
}: SkeletonBlockProps) {
  return (
    <div
      className={['shimmer', radiusClass[radius], className].join(' ')}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
      }}
    />
  )
}
