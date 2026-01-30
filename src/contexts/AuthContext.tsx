/**
 * ============================================
 * AUTH CONTEXT - SUPABASE
 * ============================================
 * Data: 2026-01-20
 * Context de autenticação usando Supabase Auth
 */

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import supabase from '../lib/supabase';

// Extended user type with metadata access
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  user_metadata: {
    name?: string;
    company?: string;
  };
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, metadata?: { name?: string; company?: string }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  // Aliases for backward compatibility
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; name: string; company?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Transform Supabase User to AuthUser
const transformUser = (user: User | null): AuthUser | null => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
    company: user.user_metadata?.company,
    user_metadata: {
      name: user.user_metadata?.name,
      company: user.user_metadata?.company,
    },
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => transformUser(supabaseUser), [supabaseUser]);
  const isAuthenticated = useMemo(() => !!user, [user]);

  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSupabaseUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.warn('Erro ao verificar sessão:', error);
        setLoading(false);
      });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshSession = async () => {
    await supabase.auth.refreshSession();
  };

  // Backward compatibility aliases
  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await signIn(email, password);
    return !error;
  };

  const register = async (data: { email: string; password: string; name: string; company?: string }): Promise<boolean> => {
    const { error } = await signUp(data.email, data.password, {
      name: data.name,
      company: data.company,
    });
    return !error;
  };

  const logout = async () => {
    await signOut();
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    refreshSession,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
