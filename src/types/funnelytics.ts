// Tipos para componentes inspirados no Funnelytics
// Source → Page → Action tracking

// ============================================
// SOURCE NODE - Origem do tráfego
// ============================================
export type SourceType =
  | 'google_ads'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'email'
  | 'sms'
  | 'organic'
  | 'direct'
  | 'referral'
  | 'affiliate';

export interface SourceNodeData {
  source: SourceType;
  label: string;
  visits: number;
  uniqueVisitors?: number;
  cost?: number;
  cpc?: number;
  cpm?: number;
  // UTM Parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  // Metadata
  startDate?: string;
  endDate?: string;
}

// ============================================
// PAGE NODE - Páginas visitadas
// ============================================
export type PageType =
  | 'landing'
  | 'home'
  | 'product'
  | 'category'
  | 'blog'
  | 'checkout'
  | 'cart'
  | 'thank_you'
  | 'confirmation'
  | 'form'
  | 'webinar'
  | 'video';

export interface PageNodeData {
  pageType: PageType;
  label: string;
  url?: string;
  visitors: number;
  uniqueVisitors?: number;
  bounceRate?: number;
  avgTimeOnPage?: number; // em segundos
  exitRate?: number;
  scrollDepth?: number; // porcentagem
}

// ============================================
// ACTION NODE - Ações do usuário
// ============================================
export type ActionType =
  | 'click'
  | 'view'
  | 'scroll'
  | 'submit'
  | 'download'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'subscribe'
  | 'unsubscribe'
  | 'share'
  | 'like'
  | 'comment'
  | 'play_video'
  | 'complete_video';

export interface ActionNodeData {
  actionType: ActionType;
  label: string;
  conversions: number;
  conversionRate?: number;
  value?: number; // valor monetário da ação
  avgValue?: number;
}

// ============================================
// UTM TRACKER NODE - Rastreamento UTM
// ============================================
export interface UTMTrackerNodeData {
  label: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
  // Métricas agregadas
  totalVisits?: number;
  totalConversions?: number;
  totalRevenue?: number;
  roi?: number;
}

// ============================================
// FUNNEL NODE - Visualização de funil inline
// ============================================
export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface FunnelNodeData {
  label: string;
  stages: FunnelStage[];
  orientation?: 'vertical' | 'horizontal';
  showPercentages?: boolean;
  showCounts?: boolean;
}

// ============================================
// CONVERSION EDGE - Conexão com métricas
// ============================================
export interface ConversionEdgeData {
  conversionRate: number;
  conversions: number;
  dropoffs?: number;
  label?: string;
  animated?: boolean;
}

// ============================================
// ÍCONES E CORES POR TIPO
// ============================================
export const SOURCE_CONFIG: Record<SourceType, { icon: string; color: string; label: string }> = {
  google_ads: { icon: '🔍', color: '#4285F4', label: 'Google Ads' },
  facebook: { icon: '📘', color: '#1877F2', label: 'Facebook' },
  instagram: { icon: '📸', color: '#E4405F', label: 'Instagram' },
  linkedin: { icon: '💼', color: '#0A66C2', label: 'LinkedIn' },
  tiktok: { icon: '🎵', color: '#000000', label: 'TikTok' },
  youtube: { icon: '▶️', color: '#FF0000', label: 'YouTube' },
  email: { icon: '✉️', color: '#EA4335', label: 'Email' },
  sms: { icon: '💬', color: '#25D366', label: 'SMS' },
  organic: { icon: '🌱', color: '#34A853', label: 'Organic' },
  direct: { icon: '🔗', color: '#6B7280', label: 'Direct' },
  referral: { icon: '🤝', color: '#8B5CF6', label: 'Referral' },
  affiliate: { icon: '💰', color: '#F59E0B', label: 'Affiliate' },
};

export const PAGE_CONFIG: Record<PageType, { icon: string; color: string; label: string }> = {
  landing: { icon: '🎯', color: '#3B82F6', label: 'Landing Page' },
  home: { icon: '🏠', color: '#6B7280', label: 'Home' },
  product: { icon: '🛍️', color: '#10B981', label: 'Produto' },
  category: { icon: '📁', color: '#8B5CF6', label: 'Categoria' },
  blog: { icon: '📝', color: '#F59E0B', label: 'Blog' },
  checkout: { icon: '💳', color: '#EF4444', label: 'Checkout' },
  cart: { icon: '🛒', color: '#F97316', label: 'Carrinho' },
  thank_you: { icon: '🎉', color: '#22C55E', label: 'Obrigado' },
  confirmation: { icon: '✅', color: '#14B8A6', label: 'Confirmação' },
  form: { icon: '📋', color: '#6366F1', label: 'Formulário' },
  webinar: { icon: '🎥', color: '#EC4899', label: 'Webinar' },
  video: { icon: '▶️', color: '#DC2626', label: 'Vídeo' },
};

export const ACTION_CONFIG: Record<ActionType, { icon: string; color: string; label: string }> = {
  click: { icon: '👆', color: '#3B82F6', label: 'Click' },
  view: { icon: '👁️', color: '#6B7280', label: 'View' },
  scroll: { icon: '📜', color: '#8B5CF6', label: 'Scroll' },
  submit: { icon: '📤', color: '#10B981', label: 'Submit' },
  download: { icon: '⬇️', color: '#F59E0B', label: 'Download' },
  add_to_cart: { icon: '🛒', color: '#F97316', label: 'Add to Cart' },
  remove_from_cart: { icon: '❌', color: '#EF4444', label: 'Remove' },
  begin_checkout: { icon: '💳', color: '#EC4899', label: 'Begin Checkout' },
  purchase: { icon: '💰', color: '#22C55E', label: 'Purchase' },
  subscribe: { icon: '📧', color: '#6366F1', label: 'Subscribe' },
  unsubscribe: { icon: '🚫', color: '#DC2626', label: 'Unsubscribe' },
  share: { icon: '🔗', color: '#14B8A6', label: 'Share' },
  like: { icon: '❤️', color: '#EF4444', label: 'Like' },
  comment: { icon: '💬', color: '#3B82F6', label: 'Comment' },
  play_video: { icon: '▶️', color: '#DC2626', label: 'Play Video' },
  complete_video: { icon: '✅', color: '#22C55E', label: 'Complete Video' },
};

// ============================================
// HELPERS
// ============================================
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatPercentage(num: number): string {
  return num.toFixed(1) + '%';
}

export function formatCurrency(num: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(num);
}

export function calculateConversionRate(conversions: number, total: number): number {
  if (total === 0) return 0;
  return (conversions / total) * 100;
}
