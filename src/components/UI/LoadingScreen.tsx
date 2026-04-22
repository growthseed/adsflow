import { Sparkles } from 'lucide-react'

interface LoadingScreenProps {
  /** `fullscreen` ocupa a viewport inteira (auth gates). `inline` fica em 60vh (Suspense fallback). */
  variant?: 'fullscreen' | 'inline'
  /** Texto exibido abaixo do spinner. Default: "Carregando". */
  label?: string
}

export default function LoadingScreen({
  variant = 'fullscreen',
  label = 'Carregando',
}: LoadingScreenProps) {
  const wrapperClass =
    variant === 'fullscreen'
      ? 'min-h-screen bg-[var(--surface-page)]'
      : 'min-h-[60vh]'

  return (
    <div
      className={`${wrapperClass} w-full flex items-center justify-center px-4`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex flex-col items-center gap-6">
        {/* Glow radial por trás do mark */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 blur-3xl opacity-60 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, rgba(100,136,174,0.35), transparent 70%)',
          }}
        />

        {/* Loader orbital — 2 anéis contra-rotativos + mark central */}
        <div className="relative w-24 h-24">
          {/* Anel externo (horário, mais longo) */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            style={{ animation: 'ls-spin 2.4s linear infinite' }}
            aria-hidden
          >
            <defs>
              <linearGradient id="ls-grad-outer" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#476382" stopOpacity="0" />
                <stop offset="100%" stopColor="#6488ae" stopOpacity="1" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#ls-grad-outer)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="210 276"
            />
          </svg>

          {/* Anel interno (anti-horário, mais curto) */}
          <svg
            className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)]"
            viewBox="0 0 100 100"
            style={{ animation: 'ls-spin-reverse 1.8s linear infinite' }}
            aria-hidden
          >
            <defs>
              <linearGradient id="ls-grad-inner" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8aa8c8" stopOpacity="0" />
                <stop offset="100%" stopColor="#476382" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#ls-grad-inner)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="120 264"
            />
          </svg>

          {/* Mark central — respirando */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ animation: 'ls-breathe 2.4s ease-in-out infinite' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--gradient-primary)',
                boxShadow:
                  '0 8px 24px -6px rgba(71,99,130,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Label com shimmer + dots pulsando */}
        <div className="flex items-center gap-1.5 text-sm">
          <span
            className="font-semibold tracking-wide"
            style={{
              background:
                'linear-gradient(90deg, var(--color-brand-700), var(--color-brand-400), var(--color-brand-700))',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              animation: 'ls-shimmer 3s linear infinite',
            }}
          >
            {label}
          </span>
          <span className="flex gap-0.5 ml-0.5">
            <span
              className="w-1 h-1 rounded-full bg-[var(--color-brand-600)]"
              style={{ animation: 'ls-bounce 1.4s ease-in-out infinite', animationDelay: '0s' }}
            />
            <span
              className="w-1 h-1 rounded-full bg-[var(--color-brand-600)]"
              style={{ animation: 'ls-bounce 1.4s ease-in-out infinite', animationDelay: '0.15s' }}
            />
            <span
              className="w-1 h-1 rounded-full bg-[var(--color-brand-600)]"
              style={{ animation: 'ls-bounce 1.4s ease-in-out infinite', animationDelay: '0.3s' }}
            />
          </span>
        </div>
      </div>

      <style>{`
        @keyframes ls-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ls-spin-reverse {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
        @keyframes ls-breathe {
          0%, 100% { transform: scale(1);    filter: brightness(1); }
          50%      { transform: scale(1.06); filter: brightness(1.1); }
        }
        @keyframes ls-shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ls-bounce {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.35; }
          40%           { transform: translateY(-3px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] * { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
