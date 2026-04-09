// ============================================
// API Client - HÍBRIDO
// - Autenticação: Supabase Auth
// - Flows: Supabase Database
// - Meta Ads Sync: N8N Webhooks
// ============================================

import supabase from './supabase';
import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

// URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const N8N_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://ia-kommo-n8n.xl78rn.easypanel.host/webhook'

// ============================================
// TYPES - AUTENTICAÇÃO
// ============================================

export interface User {
  id: string
  email: string
  name: string
  company?: string
  avatar?: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  company?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

// ============================================
// TYPES - FLOWS (N8N)
// ============================================

export interface Flow {
  id: string
  name: string
  description?: string
  is_template?: boolean
  tags?: string[]
  nodes: ReactFlowNode[]
  edges: ReactFlowEdge[]
  viewport?: {
    x: number
    y: number
    zoom: number
  }
  thumbnail_url?: string
  created_at: string
  updated_at: string
}

export interface CreateFlowInput {
  name: string
  description?: string
  is_template?: boolean
  tags?: string[]
  nodes: ReactFlowNode[]
  edges: ReactFlowEdge[]
  viewport?: {
    x: number
    y: number
    zoom: number
  }
}

export interface UpdateFlowInput {
  name?: string
  description?: string
  is_template?: boolean
  tags?: string[]
  nodes?: ReactFlowNode[]
  edges?: ReactFlowEdge[]
  viewport?: {
    x: number
    y: number
    zoom: number
  }
}

export interface MetaSyncInput {
  flow_id: string
  ad_account_id: string
}

export interface MetaSyncResponse {
  success: boolean
  message: string
  data: {
    impressions: number
    clicks: number
    spend: number
    ctr: number
    cpc: number
    cpm: number
    synced_at: string
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  count?: number
}

// ============================================
// HELPERS - TOKEN MANAGEMENT
// ============================================

export const getToken = (): string | null => {
  return localStorage.getItem('adsflow_token')
}

export const setToken = (token: string): void => {
  localStorage.setItem('adsflow_token', token)
}

export const removeToken = (): void => {
  localStorage.removeItem('adsflow_token')
}

// Fetch para Backend PostgreSQL (com autenticação)
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================
// AUTENTICAÇÃO (PostgreSQL)
// ============================================

export const authAPI = {
  // Registrar novo usuário
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetchAPI<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    setToken(response.token)
    return response
  },

  // Fazer login
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await fetchAPI<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    setToken(response.token)
    return response
  },

  // Fazer logout
  logout: async (): Promise<void> => {
    try {
      await fetchAPI('/auth/logout', { method: 'POST' })
    } finally {
      removeToken()
    }
  },

  // Obter usuário atual
  me: async (): Promise<User> => {
    const response = await fetchAPI<{ user: User }>('/auth/me')
    return response.user
  },
}

// ============================================
// FLOWS (Supabase Database)
// ============================================

export const flowsAPI = {
  /**
   * Lista todos os flows do usuário autenticado
   */
  list: async (): Promise<Flow[]> => {
    try {
      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching flows:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching flows:', error);
      return [];
    }
  },

  /**
   * Cria um novo flow
   */
  create: async (input: CreateFlowInput): Promise<Flow | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('flows')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating flow:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating flow:', error);
      throw error;
    }
  },

  /**
   * Atualiza um flow existente
   */
  update: async (id: string, input: UpdateFlowInput): Promise<Flow | null> => {
    try {
      const { data, error } = await supabase
        .from('flows')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating flow:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating flow:', error);
      throw error;
    }
  },

  /**
   * Deleta um flow
   */
  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting flow:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting flow:', error);
      throw error;
    }
  },

  /**
   * Busca um flow por ID
   */
  get: async (id: string): Promise<Flow | null> => {
    try {
      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error getting flow:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting flow:', error);
      return null;
    }
  },
}

// ============================================
// META ADS SYNC (N8N Webhooks)
// ============================================
// Service layer completo em: src/services/metaAdsService.ts
// (adAccountsService, syncService, insightsService, syncLogsService)

export const metaAPI = {
  /**
   * POST /adsflow/meta-sync
   * Sincroniza dados do Meta Ads para um flow via N8N (legacy)
   */
  sync: async (input: MetaSyncInput): Promise<MetaSyncResponse> => {
    try {
      const response = await fetch(`${N8N_BASE_URL}/adsflow/meta-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error syncing Meta Ads:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync Meta Ads data',
        data: {
          impressions: 0,
          clicks: 0,
          spend: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          synced_at: new Date().toISOString(),
        },
      }
    }
  },
}

// Re-export service layer for convenience
export { adAccountsService, syncService, insightsService, syncLogsService } from '@/services/metaAdsService'

// ============================================
// HEALTH CHECK (PostgreSQL)
// ============================================

export const healthAPI = {
  check: async (): Promise<{ status: string; database: string }> => {
    const response = await fetch(`${API_URL.replace('/api', '')}/health`)
    return response.json()
  },
}

// Exportações legadas para compatibilidade
export const getFlows = flowsAPI.list
export const createFlow = flowsAPI.create
export const updateFlow = flowsAPI.update
export const deleteFlow = flowsAPI.delete
export const syncMetaAds = metaAPI.sync
