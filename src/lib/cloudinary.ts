/**
 * Cloudinary Helper Library (Modified)
 * Using placeholder service instead of premium Cloudinary URL2PNG
 */

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop';
  gravity?: 'north' | 'center' | 'south' | 'auto';
  quality?: number;
  format?: 'png' | 'jpg' | 'webp';
}

export type ThumbnailPreset = 'small' | 'medium' | 'large' | 'landingPage' | 'socialPost';

const PRESETS: Record<ThumbnailPreset, ThumbnailOptions> = {
  small: { width: 200, height: 150, crop: 'fill', gravity: 'north' },
  medium: { width: 400, height: 300, crop: 'fill', gravity: 'north' },
  large: { width: 800, height: 600, crop: 'fill', gravity: 'north' },
  landingPage: { width: 480, height: 270, crop: 'fill', gravity: 'north', format: 'jpg', quality: 80 },
  socialPost: { width: 300, height: 300, crop: 'fill', gravity: 'center', format: 'jpg', quality: 80 },
};

/**
 * Gera uma URL de thumbnail para uma página web.
 * Fallback: SVG inline (data URI) com o domínio como texto — zero dependência
 * de rede. via.placeholder.com (anterior) ficava caindo com ERR_CONNECTION_CLOSED.
 * Quando o serviço real de screenshot for plugado, só mudar essa função.
 */
export function generateThumbnailUrl(url: string, options: ThumbnailOptions = {}): string {
  if (!isValidScreenshotUrl(url)) {
    console.warn('Invalid URL for screenshot:', url);
    return inlineSvgPlaceholder('—', options);
  }
  const domain = extractDomain(url);
  return inlineSvgPlaceholder(domain, options);
}

function inlineSvgPlaceholder(label: string, options: ThumbnailOptions = {}): string {
  const { width = 480, height = 270 } = options;
  // Gradient brand (alinhado ao design system V2)
  const escaped = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  const svg = [
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>`,
    `<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>`,
    `<stop offset='0%' stop-color='#6488ae'/><stop offset='100%' stop-color='#476382'/>`,
    `</linearGradient></defs>`,
    `<rect width='100%' height='100%' fill='url(#g)'/>`,
    `<text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' fill='#ffffff' font-family='Inter,system-ui,sans-serif' font-size='${Math.round(Math.min(width, height) / 14)}' font-weight='600'>${escaped}</text>`,
    `</svg>`,
  ].join('')
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Cache-busting: com data URI inline não há cache HTTP, então apenas
 * retornamos a mesma URL. Mantém assinatura por compatibilidade.
 */
export function generateFreshThumbnailUrl(url: string, options: ThumbnailOptions = {}): string {
  return generateThumbnailUrl(url, options);
}

/**
 * Gera thumbnail usando preset
 */
export function generatePresetThumbnail(url: string, preset: ThumbnailPreset): string {
  const options = PRESETS[preset];
  return generateThumbnailUrl(url, options);
}

/**
 * Valida URL para screenshot
 */
export function isValidScreenshotUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extrai domínio da URL
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace('www.', '');
  } catch {
    return url;
  }
}
