import { memo } from 'react'
import { Handle, Position, NodeResizer } from 'reactflow'
import type { NodeProps } from 'reactflow'
import BrandIcon from '../BrandIcon'

export interface BrandNodeData {
  brand: string
  label: string
  subtitle?: string
  description?: string
  status?: string
  isActive?: boolean
}

const brandColors: Record<string, {
  name: string
  color: string
  hoverColor: string
  border: string
  textColor: string
  shadow: string
}> = {
  whatsapp: {
    name: 'WhatsApp',
    color: 'bg-[#25D366]',
    hoverColor: 'hover:bg-[#20BD5A]',
    border: 'border-[#25D366]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-green-500/30'
  },
  instagram: {
    name: 'Instagram',
    color: 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]',
    hoverColor: 'hover:opacity-90',
    border: 'border-[#E1306C]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-pink-500/30'
  },
  facebook: {
    name: 'Facebook',
    color: 'bg-[#1877F2]',
    hoverColor: 'hover:bg-[#166FE5]',
    border: 'border-[#1877F2]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-blue-500/30'
  },
  youtube: {
    name: 'YouTube',
    color: 'bg-[#FF0000]',
    hoverColor: 'hover:bg-[#E60000]',
    border: 'border-[#FF0000]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-red-500/30'
  },
  meta: {
    name: 'Meta',
    color: 'bg-[#0081FB]',
    hoverColor: 'hover:bg-[#0073E6]',
    border: 'border-[#0081FB]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-blue-500/30'
  },
  google: {
    name: 'Google',
    color: 'bg-white',
    hoverColor: 'hover:bg-gray-50',
    border: 'border-gray-300',
    textColor: 'text-gray-800',
    shadow: 'shadow-lg shadow-gray-400/30'
  },
  linkedin: {
    name: 'LinkedIn',
    color: 'bg-[#0A66C2]',
    hoverColor: 'hover:bg-[#095BA8]',
    border: 'border-[#0A66C2]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-blue-600/30'
  },
  tiktok: {
    name: 'TikTok',
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-900',
    border: 'border-black',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-black/30'
  },
  twitter: {
    name: 'Twitter/X',
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-900',
    border: 'border-black',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-black/30'
  },
  email: {
    name: 'Email',
    color: 'bg-[#0072C6]',
    hoverColor: 'hover:bg-[#0066B3]',
    border: 'border-[#0072C6]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-blue-500/30'
  },
  telegram: {
    name: 'Telegram',
    color: 'bg-[#26A5E4]',
    hoverColor: 'hover:bg-[#2295CB]',
    border: 'border-[#26A5E4]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-blue-400/30'
  },
  messenger: {
    name: 'Messenger',
    color: 'bg-gradient-to-br from-[#0084FF] to-[#00C6FF]',
    hoverColor: 'hover:opacity-90',
    border: 'border-[#0084FF]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-blue-400/30'
  },
  spotify: {
    name: 'Spotify',
    color: 'bg-[#1DB954]',
    hoverColor: 'hover:bg-[#1AAD4B]',
    border: 'border-[#1DB954]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-green-500/30'
  },
  shopify: {
    name: 'Shopify',
    color: 'bg-[#96BF48]',
    hoverColor: 'hover:bg-[#87B03E]',
    border: 'border-[#96BF48]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-green-400/30'
  },
  wordpress: {
    name: 'WordPress',
    color: 'bg-[#21759B]',
    hoverColor: 'hover:bg-[#1D6789]',
    border: 'border-[#21759B]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-blue-600/30'
  },
  woocommerce: {
    name: 'WooCommerce',
    color: 'bg-[#96588A]',
    hoverColor: 'hover:bg-[#874F7A]',
    border: 'border-[#96588A]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-purple-500/30'
  },
  zapier: {
    name: 'Zapier',
    color: 'bg-[#FF4A00]',
    hoverColor: 'hover:bg-[#E64200]',
    border: 'border-[#FF4A00]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-orange-500/30'
  },
  mailchimp: {
    name: 'Mailchimp',
    color: 'bg-[#FFE01B]',
    hoverColor: 'hover:bg-[#E6C918]',
    border: 'border-[#FFE01B]',
    textColor: 'text-gray-800',
    shadow: 'shadow-lg shadow-yellow-400/30'
  },
  hubspot: {
    name: 'HubSpot',
    color: 'bg-[#FF7A59]',
    hoverColor: 'hover:bg-[#E66D50]',
    border: 'border-[#FF7A59]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-orange-400/30'
  },
  notion: {
    name: 'Notion',
    color: 'bg-white',
    hoverColor: 'hover:bg-gray-50',
    border: 'border-gray-300',
    textColor: 'text-gray-800',
    shadow: 'shadow-lg shadow-gray-400/30'
  },
  slack: {
    name: 'Slack',
    color: 'bg-[#4A154B]',
    hoverColor: 'hover:bg-[#3E1241]',
    border: 'border-[#4A154B]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-purple-900/30'
  },
  discord: {
    name: 'Discord',
    color: 'bg-[#5865F2]',
    hoverColor: 'hover:bg-[#4E5AD9]',
    border: 'border-[#5865F2]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-indigo-500/30'
  },
  pinterest: {
    name: 'Pinterest',
    color: 'bg-[#E60023]',
    hoverColor: 'hover:bg-[#CC001F]',
    border: 'border-[#E60023]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-red-600/30'
  },
  reddit: {
    name: 'Reddit',
    color: 'bg-[#FF4500]',
    hoverColor: 'hover:bg-[#E63E00]',
    border: 'border-[#FF4500]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-orange-600/30'
  },
  stripe: {
    name: 'Stripe',
    color: 'bg-[#635BFF]',
    hoverColor: 'hover:bg-[#5850E6]',
    border: 'border-[#635BFF]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-purple-500/30'
  },
  paypal: {
    name: 'PayPal',
    color: 'bg-[#00457C]',
    hoverColor: 'hover:bg-[#003C6E]',
    border: 'border-[#00457C]',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-blue-900/30'
  }
}

const BrandNode = memo(({ data, selected }: NodeProps<BrandNodeData>) => {
  const brandConfig = brandColors[data.brand] || brandColors.whatsapp
  const isActive = data.isActive !== false

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={60} minHeight={60} />
      <div className="relative flex flex-col items-center group">
        {/* Handles — positioned for circular shape */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-2.5 h-2.5 !bg-blue-500 border-2 border-white"
          style={{ left: -5 }}
        />

        {/* Circular brand node */}
        <div
          className={`
            w-20 h-20 rounded-full border-3 flex items-center justify-center
            transition-all duration-300 cursor-pointer
            ${isActive ? brandConfig.color : 'bg-gray-100'}
            ${isActive ? brandConfig.border : 'border-gray-300'}
            ${isActive ? brandConfig.shadow : 'shadow-md'}
            ${isActive ? brandConfig.hoverColor : 'hover:bg-gray-200'}
            ${isActive ? '' : 'grayscale opacity-60'}
            ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
          `}
        >
          <BrandIcon
            name={data.brand}
            size={36}
            className={isActive ? brandConfig.textColor : 'text-gray-600'}
          />
        </div>

        {/* Label below the circle */}
        <div className="mt-1.5 text-center max-w-[100px]">
          <span className="text-[11px] font-semibold text-gray-800 leading-tight block truncate">
            {data.label || brandConfig.name}
          </span>
          {data.subtitle && (
            <span className="text-[9px] text-gray-500 block truncate">
              {data.subtitle}
            </span>
          )}
        </div>

        {/* Status dot */}
        {data.status && (
          <div className={`
            absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center
            ${isActive ? 'bg-green-500' : 'bg-gray-400'}
          `}>
            {isActive && (
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </div>
        )}

        <Handle
          type="source"
          position={Position.Right}
          className="w-2.5 h-2.5 !bg-blue-500 border-2 border-white"
          style={{ right: -5 }}
        />
      </div>
    </>
  )
})

BrandNode.displayName = 'BrandNode'

export default BrandNode
