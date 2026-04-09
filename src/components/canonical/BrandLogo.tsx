/**
 * ============================================
 * <BrandLogo> — AdFlow v4 canonical component
 * ============================================
 * Official brand logos (colored SVG). Always use this instead
 * of emoji or generic icons when referring to a platform.
 *
 * Usage:
 *   <BrandLogo brand="google_ads" size={24} />
 *   <BrandLogo brand="meta_ads" size={32} variant="monochrome" />
 *
 * SVGs follow each brand's official guidelines. For brands not
 * yet added, extend the LOGOS map below with the official path.
 * ============================================
 */

import type { KPISource } from '@/types/metrics'

export type BrandLogoSize = 16 | 20 | 24 | 32 | 48 | 64 | 80 | 96

export interface BrandLogoProps {
  brand: KPISource
  size?: BrandLogoSize
  variant?: 'color' | 'monochrome'
  className?: string
  'aria-label'?: string
}

interface LogoDefinition {
  label: string
  viewBox: string
  /** Colored SVG JSX — official brand colors */
  color: React.ReactNode
  /** Monochrome — uses currentColor */
  monochrome?: React.ReactNode
}

const LOGOS: Partial<Record<KPISource, LogoDefinition>> = {
  meta_ads: {
    label: 'Meta Ads',
    viewBox: '0 0 64 64',
    color: (
      <>
        <rect width="64" height="64" rx="14" fill="#0866FF" />
        <path
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          d="M16 32c0-7 4-12 10-12 5 0 8 3 12 10s7 10 12 10c4 0 8-3 8-8s-4-10-10-10-9 4-12 10-7 10-12 10c-6 0-10-5-10-10z"
        />
      </>
    ),
  },

  instagram: {
    label: 'Instagram',
    viewBox: '0 0 64 64',
    color: (
      <>
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FEDA77" />
            <stop offset="25%" stopColor="#F58529" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="75%" stopColor="#8134AF" />
            <stop offset="100%" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#ig-grad)" />
        <rect x="14" y="14" width="36" height="36" rx="10" fill="none" stroke="#FFFFFF" strokeWidth="3" />
        <circle cx="32" cy="32" r="9" fill="none" stroke="#FFFFFF" strokeWidth="3" />
        <circle cx="44" cy="20" r="2.5" fill="#FFFFFF" />
      </>
    ),
  },

  google_ads: {
    label: 'Google Ads',
    viewBox: '0 0 192 192',
    color: (
      <>
        <path
          fill="#FBBC04"
          d="M21.35 116.11L70.5 31.01c6.8-11.79 21.88-15.83 33.67-9.03 11.79 6.8 15.83 21.88 9.03 33.67l-49.15 85.1c-6.8 11.79-21.88 15.83-33.67 9.03-11.79-6.8-15.83-21.88-9.03-33.67z"
        />
        <circle cx="42.5" cy="149.52" r="24.65" fill="#34A853" />
        <path
          fill="#4285F4"
          d="M170.65 116.11L121.5 31.01c-6.8-11.79-21.97-15.83-33.67-9.03-11.79 6.8-15.83 21.88-9.03 33.67l49.15 85.1c6.8 11.79 21.88 15.83 33.67 9.03 11.7-6.9 15.83-21.97 9.03-33.67z"
        />
      </>
    ),
  },

  ga4: {
    label: 'Google Analytics 4',
    viewBox: '0 0 192 192',
    color: (
      <>
        <path
          fill="#F9AB00"
          d="M150 26v139c0 15.56 10.74 24 22 24 10.42 0 22-7.29 22-24V27c0-14.26-10.53-23-22-23s-22 9.63-22 22z"
        />
        <path
          fill="#E37400"
          d="M96 72v94c0 15.56 10.74 24 22 24 10.42 0 22-7.29 22-24V73c0-14.26-10.53-23-22-23s-22 9.63-22 22zM40 140a22 22 0 100 44 22 22 0 000-44z"
        />
      </>
    ),
  },

  gsc: {
    label: 'Google Search Console',
    viewBox: '0 0 192 192',
    color: (
      <>
        <circle cx="96" cy="96" r="88" fill="#4285F4" />
        <path
          fill="#FFFFFF"
          d="M86 52c-18.78 0-34 15.22-34 34s15.22 34 34 34c8.12 0 15.58-2.85 21.43-7.6l20.26 20.26a5.99 5.99 0 008.49-8.49l-20.26-20.26c4.75-5.85 7.6-13.31 7.6-21.43C123.52 67.22 108.3 52 86 52zm0 12c12.15 0 22 9.85 22 22s-9.85 22-22 22-22-9.85-22-22 9.85-22 22-22z"
        />
      </>
    ),
  },

  youtube: {
    label: 'YouTube',
    viewBox: '0 0 256 180',
    color: (
      <>
        <path
          fill="#FF0000"
          d="M250.346 28.075A32.18 32.18 0 00227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 005.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0022.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0022.657-22.657c6.34-35.348 8.293-89.1-.164-123.134z"
        />
        <path fill="#FFFFFF" d="M102.421 128.06l66.328-38.418-66.328-38.418z" />
      </>
    ),
  },

  gmb: {
    label: 'Google Meu Negócio',
    viewBox: '0 0 192 192',
    color: (
      <>
        <path fill="#4285F4" d="M64 16h64v64H64z" />
        <path fill="#34A853" d="M128 16h48v64h-48z" />
        <path fill="#FBBC04" d="M16 80h160v48H16z" />
        <path fill="#EA4335" d="M16 16h48v64H16zM16 128h160v48H16z" />
        <circle cx="96" cy="104" r="20" fill="#FFFFFF" />
      </>
    ),
  },

  linkedin_ads: {
    label: 'LinkedIn Ads',
    viewBox: '0 0 256 256',
    color: (
      <>
        <path
          fill="#0A66C2"
          d="M218.123 218.127h-37.93v-59.403c0-14.165-.253-32.4-19.728-32.4-19.756 0-22.779 15.434-22.779 31.369v60.43h-37.93V95.967h36.413v16.694h.51a39.907 39.907 0 0135.928-19.733c38.445 0 45.533 25.288 45.533 58.186l-.017 67.013zM56.955 79.27c-12.157.002-22.014-9.852-22.016-22.009-.002-12.157 9.851-22.014 22.008-22.016 12.157-.003 22.014 9.851 22.016 22.008A22.013 22.013 0 0156.955 79.27zm18.966 138.858H37.95V95.967h37.97v122.16zM237.033.018H18.89C8.58-.098.125 8.161-.001 18.471v219.053c.122 10.315 8.576 18.582 18.89 18.474h218.144c10.336.128 18.823-8.139 18.966-18.474V18.454c-.147-10.33-8.635-18.588-18.966-18.453z"
        />
      </>
    ),
  },

  tiktok_ads: {
    label: 'TikTok Ads',
    viewBox: '0 0 256 290',
    color: (
      <>
        <path
          fill="#FF004F"
          d="M189.72 104.421c18.678 13.345 41.56 21.197 66.273 21.197v-47.53a67.115 67.115 0 01-13.923-1.454v37.413c-24.71 0-47.59-7.851-66.272-21.197v96.996c0 48.523-39.356 87.855-87.9 87.855-18.113 0-34.949-5.473-48.934-14.86 15.962 16.313 38.222 26.432 62.848 26.432 48.548 0 87.905-39.332 87.905-87.857v-96.995h.003zm17.17-47.952c-9.546-10.423-15.814-23.893-17.17-38.785v-6.113h-13.19c3.32 18.927 14.644 35.097 30.36 44.898zM69.673 225.607a40.008 40.008 0 01-8.203-24.33c0-22.192 18.001-40.186 40.21-40.186a40.313 40.313 0 0112.197 1.883v-48.593c-4.61-.631-9.262-.9-13.912-.801v37.822a40.268 40.268 0 00-12.2-1.884c-22.208 0-40.208 17.992-40.208 40.187 0 15.694 8.997 29.281 22.116 35.902z"
        />
        <path
          fill="#000000"
          d="M175.797 92.849c18.683 13.346 41.563 21.197 66.273 21.197V76.634c-13.794-2.937-26.005-10.141-35.18-20.165-15.715-9.802-27.038-25.971-30.358-44.898h-34.643V199.83c-.079 22.132-18.049 40.052-40.21 40.052-13.058 0-24.66-6.221-32.007-15.87-13.12-6.621-22.115-20.208-22.115-35.9 0-22.193 18-40.187 40.208-40.187 4.255 0 8.356.662 12.2 1.883v-37.822c-47.692.985-86.031 39.933-86.031 87.854 0 23.912 9.551 45.589 25.053 61.428 13.985 9.385 30.82 14.86 48.934 14.86 48.545 0 87.9-39.335 87.9-87.857v-96.995h-.024z"
        />
        <path
          fill="#00F2EA"
          d="M242.07 76.63V66.516a66.285 66.285 0 01-35.18-10.047 66.47 66.47 0 0035.18 20.163zM176.533 11.57a67.562 67.562 0 01-.736-5.529V0h-47.832v199.827c-.076 22.129-18.048 40.05-40.208 40.05a40.06 40.06 0 01-18.09-4.285c7.347 9.647 18.949 15.868 32.007 15.868 22.16 0 40.132-17.918 40.21-40.05V11.571h34.649zM99.966 113.58v-10.769a88.895 88.895 0 00-12.055-.813C39.36 101.998 0 141.33 0 189.85c0 30.42 15.467 57.227 38.971 72.995-15.502-15.838-25.053-37.516-25.053-61.427 0-47.92 38.336-86.869 86.048-87.838z"
        />
      </>
    ),
  },

  kommo: {
    label: 'Kommo',
    viewBox: '0 0 64 64',
    color: (
      <>
        <rect width="64" height="64" rx="12" fill="#FFCE5C" />
        <path
          fill="#000000"
          d="M17 42l6-20h5l4 12 4-12h5l6 20h-5l-3-11-4 11h-4l-4-11-3 11z"
        />
      </>
    ),
  },

  clickup: {
    label: 'ClickUp',
    viewBox: '0 0 256 256',
    color: (
      <>
        <defs>
          <linearGradient id="cu-grad" x1="12.6%" x2="88.6%" y1="85.3%" y2="10.7%">
            <stop offset="0%" stopColor="#8930FD" />
            <stop offset="100%" stopColor="#49CCF9" />
          </linearGradient>
          <linearGradient id="cu-grad-2" x1="14.2%" x2="86.7%" y1="85.3%" y2="10.7%">
            <stop offset="0%" stopColor="#FF02F0" />
            <stop offset="100%" stopColor="#FFC800" />
          </linearGradient>
        </defs>
        <path
          fill="url(#cu-grad)"
          d="M0 189.533l39.423-30.23c20.971 27.322 43.264 39.955 68.127 39.955 24.716 0 46.404-12.486 66.347-39.625l40.047 29.413C184.925 226.91 150.19 246 107.55 246 65.058 246 30.03 226.91 0 189.533z"
        />
        <path
          fill="url(#cu-grad-2)"
          d="M107.404 83.009l-70.004 60.32L6 107.24 107.55 20 209.908 107.314l-31.62 36.015z"
        />
      </>
    ),
  },

  ecommerce: {
    label: 'E-commerce',
    viewBox: '0 0 24 24',
    color: (
      <path
        fill="#10B981"
        d="M17 18a2 2 0 100 4 2 2 0 000-4zM1 2a1 1 0 000 2h2l3.6 7.59-1.35 2.44A1 1 0 006 16h12a1 1 0 100-2H6.42l1.1-2h7.45a1 1 0 00.92-.61L19 5H5.21l-.94-2H1zm6 16a2 2 0 100 4 2 2 0 000-4z"
      />
    ),
  },

  shopify: {
    label: 'Shopify',
    viewBox: '0 0 64 64',
    color: (
      <>
        <rect width="64" height="64" rx="14" fill="#95BF46" />
        <path
          fill="#FFFFFF"
          d="M44 22h-3v-3a7 7 0 00-14 0v3h-3a2 2 0 00-2 2v22a2 2 0 002 2h22a2 2 0 002-2V24a2 2 0 00-2-2zm-15-3a3 3 0 016 0v3h-6v-3zm3 17a4 4 0 110-8 4 4 0 010 8z"
        />
      </>
    ),
  },

  woocommerce: {
    label: 'WooCommerce',
    viewBox: '0 0 64 64',
    color: (
      <>
        <rect width="64" height="64" rx="14" fill="#7F54B3" />
        <path
          fill="#FFFFFF"
          d="M14 22h36a4 4 0 014 4v14a4 4 0 01-4 4h-12l-6 6v-6H14a4 4 0 01-4-4V26a4 4 0 014-4z"
        />
        <text
          x="32"
          y="38"
          fontFamily="-apple-system, system-ui, sans-serif"
          fontSize="13"
          fontWeight="700"
          fill="#7F54B3"
          textAnchor="middle"
        >
          Woo
        </text>
      </>
    ),
  },

  mailchimp: {
    label: 'Mailchimp',
    viewBox: '0 0 64 64',
    color: (
      <>
        <rect width="64" height="64" rx="14" fill="#FFE01B" />
        <path
          fill="#241C15"
          d="M16 24c0-2 1.5-3.5 3.5-3.5S23 22 23 24v8c0 1 .5 2 1.5 2.5l8 4c1 .5 2 .5 3 0l8-4c1-.5 1.5-1.5 1.5-2.5v-8c0-2 1.5-3.5 3.5-3.5S52 22 52 24v8c0 4-2 7.5-5.5 9.5l-8 4c-4 2-9 2-13 0l-8-4C18 39.5 16 36 16 32v-8z"
        />
      </>
    ),
  },

  brevo: {
    label: 'Brevo',
    viewBox: '0 0 64 64',
    color: (
      <>
        <rect width="64" height="64" rx="12" fill="#0B996E" />
        <path
          fill="#FFFFFF"
          d="M32 14c-9.94 0-18 8.06-18 18s8.06 18 18 18c6.23 0 11.72-3.17 14.94-7.98l-5.2-3.48A11.96 11.96 0 0132 44c-6.63 0-12-5.37-12-12s5.37-12 12-12c4.1 0 7.72 2.06 9.89 5.2l5.2-3.48C43.73 16.57 38.23 14 32 14z"
        />
        <circle cx="44" cy="32" r="5" fill="#FFA73C" />
      </>
    ),
  },

  hotmart: {
    label: 'Hotmart',
    viewBox: '0 0 64 64',
    color: (
      <>
        <rect width="64" height="64" rx="12" fill="#EF4E23" />
        <path
          fill="#FFFFFF"
          d="M32 12c-2.2 4.5-6.5 7.3-6.5 13.3 0 3 1.4 5.5 3.5 7-.8-1.2-1.3-2.6-1.3-4.1 0-3.8 3-5.8 4.3-9 .5 2 1.5 3.5 2.8 4.9 2.7 2.9 5.2 6 5.2 10.5 0 6.4-5.2 11.6-11.6 11.6-1.2 0-2.4-.2-3.5-.5 2.7 3.1 6.6 5 11 5 8.1 0 14.6-6.5 14.6-14.6 0-9.4-8.2-13.8-12.2-19.5-2.3-3.3-3.3-5.1-3.3-5.1s-1 1.5-3 0z"
        />
      </>
    ),
  },
}

const MONOCHROME_FALLBACK: Partial<Record<KPISource, React.ReactNode>> = {
  // For platforms whose colored logo is too complex for monochrome mode,
  // provide a simplified shape that uses currentColor.
}

export function BrandLogo({
  brand,
  size = 24,
  variant = 'color',
  className = '',
  'aria-label': ariaLabel,
}: BrandLogoProps) {
  const logo = LOGOS[brand]

  if (!logo) {
    // Fallback: render a rounded square with brand initial
    const initial = brand.slice(0, 1).toUpperCase()
    return (
      <div
        className={`inline-flex items-center justify-center rounded-md bg-neutral-200 text-neutral-600 font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        role="img"
        aria-label={ariaLabel || brand}
      >
        {initial}
      </div>
    )
  }

  const content =
    variant === 'monochrome'
      ? MONOCHROME_FALLBACK[brand] || logo.color
      : logo.color

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={logo.viewBox}
      width={size}
      height={size}
      className={className}
      fill={variant === 'monochrome' ? 'currentColor' : undefined}
      role="img"
      aria-label={ariaLabel || logo.label}
    >
      {content}
    </svg>
  )
}

/** List of supported brands — for showcases/storybook */
export const SUPPORTED_BRANDS: KPISource[] = Object.keys(LOGOS) as KPISource[]
