/**
 * ============================================
 * SUPABASE CLIENT - FRONTEND
 * ============================================
 * Data: 2025-12-30
 * Cliente Supabase para autenticação e queries
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Log warning se as variáveis não estão definidas (não quebra a app)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidos.',
    'Configure as variáveis de ambiente na Vercel ou no .env local.'
  );
}

// Cliente Supabase - cria mesmo sem credenciais (vai falhar nas chamadas, mas não quebra a app)
//
// IMPORTANT: detectSessionInUrl is DISABLED on purpose.
// We use Google OAuth (not Supabase OAuth providers) for third-party integrations.
// When the Google OAuth callback URL arrives with `?code=...`, Supabase would
// otherwise try to treat that code as its own PKCE code and hang trying to
// exchange it with the wrong endpoint. Disabling this is safe because AdFlow
// authenticates users via email/password — Supabase OAuth is not used.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'adsflow-auth'
    }
  }
);

// Flag para saber se o Supabase está configurado
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export default supabase;
