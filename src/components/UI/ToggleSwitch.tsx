import { memo } from 'react'

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: {
    container: 'w-10 h-6',
    circle: 'w-4 h-4',
    translate: 'translate-x-4',
  },
  md: {
    container: 'w-12 h-7',
    circle: 'w-5 h-5',
    translate: 'translate-x-5',
  },
  lg: {
    container: 'w-14 h-8',
    circle: 'w-6 h-6',
    translate: 'translate-x-6',
  },
}

function ToggleSwitch({ enabled, onChange, label, size = 'md' }: ToggleSwitchProps) {
  const sizes = sizeClasses[size]

  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`
          ${sizes.container}
          relative inline-flex items-center rounded-full
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${enabled 
            ? 'bg-green-500 focus:ring-green-500' 
            : 'bg-gray-300 focus:ring-gray-400'
          }
        `}
        role="switch"
        aria-checked={enabled}
      >
        <span className="sr-only">
          {enabled ? 'Desativar' : 'Ativar'}
        </span>
        
        <span
          className={`
            ${sizes.circle}
            inline-block rounded-full bg-white shadow-lg
            transform transition-transform duration-300 ease-in-out
            ${enabled ? sizes.translate : 'translate-x-1'}
          `}
        />
      </button>

      <span className={`
        text-xs font-semibold uppercase tracking-wider
        ${enabled ? 'text-green-600' : 'text-gray-500'}
      `}>
        {enabled ? 'Ativo' : 'Inativo'}
      </span>
    </div>
  )
}

export default memo(ToggleSwitch)
