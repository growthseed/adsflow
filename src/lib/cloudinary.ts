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
 * Gera uma URL de thumbnail para uma página web
 * NOTA: Usando placeholder até configurar serviço de screenshot
 */
export function generateThumbnailUrl(url: string, options: ThumbnailOptions = {}): string {
  if (!isValidScreenshotUrl(url)) {
    console.warn('Invalid URL for screenshot:', url);
    return '';
  }

  const { width = 480, height = 270 } = options;
  const domain = extractDomain(url);
  
  // Placeholder temporário com domínio
  return `https://via.placeholder.com/${width}x${height}/3B82F6/FFFFFF?text=${encodeURIComponent(domain)}`;
}

/**
 * Gera URL com cache-busting
 */
export function generateFreshThumbnailUrl(url: string, options: ThumbnailOptions = {}): string {
  const timestamp = Date.now();
  const baseUrl = generateThumbnailUrl(url, options);
  return `${baseUrl}&t=${timestamp}`;
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
