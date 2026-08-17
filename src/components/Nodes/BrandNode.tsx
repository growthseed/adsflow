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

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={60} minHeight={60} />
      <div className="flex flex-col items-center gap-2 px-2 py-1">
        {data.label && (
          <div className="text-xs font-semibold text-gray-700 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
            {data.label}
          </div>
        )}

        {/* Wrapper relative separado — garante que os Handles fiquem centrados no círculo, não no card inteiro */}
        <div className="relative">
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 !bg-blue-500 border-2 border-white"
          />

          {/* Círculo com logo da marca — mesmo formato dos demais nós visuais */}
          <div
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              ${brandConfig.color} ${brandConfig.textColor}
              ${brandConfig.shadow}
              hover:scale-110 hover:shadow-xl
              transition-all duration-300 cursor-pointer
            `}
          >
            <BrandIcon
              name={data.brand}
              size={40}
              className={brandConfig.textColor}
            />
          </div>

          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 !bg-blue-500 border-2 border-white"
          />
        </div>
      </div>
    </>
  )
})

BrandNode.displayName = 'BrandNode'

export default BrandNode
