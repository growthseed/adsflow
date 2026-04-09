/**
 * ============================================
 * AUTH CONTEXT - SUPABASE MULTI-TENANT
 * ============================================
 * Data: 2026-01-20 | Atualizado: 2026-02-13
 * Context de autenticação com suporte multi-tenant,
 * perfil public.users, client_members e roles.
 */

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import supabase, { isSupabaseConfigured } from '../lib/supabase';

// ========== TYPES ==========

export type GlobalRole = 'super_admin' | 'admin' | 'user';
export type ClientRole = 'owner' | 'admin' | 'manager' | 'analyst' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  role: GlobalRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string | null;
}

export interface ClientMembership {
  client_id: string;
  role: ClientRole;
  client: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    status: string;
    industry: string | null;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  globalRole: GlobalRole;
  is_active: boolean;
  // Backward compat
  company?: string;
  user_metadata: {
    name?: string;
    company?: string;
  };
}

export interface AuthContextType {
  // State
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Multi-tenant
  clients: ClientMembership[];
  activeClient: ClientMembership | null;
  activeClientRole: ClientRole | null;
  setActiveClient: (clientId: string) => void;

  // Role helpers
  isSuperAdmin: boolean;
  isGlobalAdmin: boolean;
  hasClientRole: (minRole: ClientRole) => boolean;

  // Auth actions
  signUp: (email: string, password: string, metadata?: { name?: string; company?: string }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;

  // Backward compatibility aliases
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; name: string; company?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
}

// ========== CONSTANTS ==========

const CLIENT_ROLE_HIERARCHY: Record<ClientRole, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  analyst: 2,
  viewer: 1,
};

const ACTIVE_CLIENT_KEY = 'adsflow-active-client';

// ========== CONTEXT ==========

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ========== PROVIDER ==========

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clients, setClients] = useState<ClientMembership[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_CLIENT_KEY);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // ---- Derived state ----
  const user = useMemo((): AuthUser | null => {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
      avatar_url: profile?.avatar_url || null,
      phone: profile?.phone || null,
      globalRole: profile?.role || 'user',
      is_active: profile?.is_active ?? true,
      company: supabaseUser.user_metadata?.company,
      user_metadata: {
        name: supabaseUser.user_metadata?.name,
        company: supabaseUser.user_metadata?.company,
      },
    };
  }, [supabaseUser, profile]);

  const isAuthenticated = useMemo(() => !!user, [user]);

  const activeClient = useMemo(() => {
    if (!activeClientId || clients.length === 0) {
      return clients[0] || null;
    }
    return clients.find((c) => c.client_id === activeClientId) || clients[0] || null;
  }, [clients, activeClientId]);

  const activeClientRole = useMemo(() => activeClient?.role || null, [activeClient]);
  const isSuperAdmin = useMemo(() => profile?.role === 'super_admin', [profile]);
  const isGlobalAdmin = useMemo(() => profile?.role === 'super_admin' || profile?.role === 'admin', [profile]);

  // ---- Fetch profile + clients (PARALLEL with per-query timeout) ----
  const fetchUserData = useCallback(async (userId: string) => {
    // Wrap any Supabase query in a 5s timeout race so one slow query
    // doesn't block the entire auth flow.
    const withTimeout = <T,>(p: PromiseLike<T>, label: string, ms = 5000): Promise<T> =>
      Promise.race([
        Promise.resolve(p),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout ${label} (${ms}ms)`)), ms),
        ),
      ]);

    try {
      // Run profile + memberships in PARALLEL with independent timeouts
      const profilePromise = withTimeout(
        supabase
          .from('users')
          .select('id, email, name, avatar_url, phone, role, is_active, last_login_at, created_at')
          .eq('id', userId)
          .single(),
        'fetchProfile',
      );

      // Simpler membership query — no nested join, avoids recursive RLS
      const membershipsPromise = withTimeout(
        supabase
          .from('client_members')
          .select('client_id, role')
          .eq('user_id', userId),
        'fetchMemberships',
      );

      const [profileResult, membershipsResult] = await Promise.allSettled([
        profilePromise,
        membershipsPromise,
      ]);

      if (profileResult.status === 'fulfilled' && !profileResult.value.error && profileResult.value.data) {
        setProfile(profileResult.value.data as UserProfile);
      } else if (profileResult.status === 'rejected') {
        console.warn('Profile fetch failed:', profileResult.reason?.message);
      }

      if (membershipsResult.status === 'fulfilled' && !membershipsResult.value.error && membershipsResult.value.data) {
        // Fetch client details in a second step only if needed (non-blocking)
        const memberships = membershipsResult.value.data
        if (memberships.length > 0) {
          const clientIds = memberships.map((m: { client_id: string }) => m.client_id)
          const clientsResult = await withTimeout(
            supabase
              .from('clients')
              .select('id, name, slug, logo_url, status, industry')
              .in('id', clientIds),
            'fetchClients',
          )

          if (!clientsResult.error && clientsResult.data) {
            const clientMap = new Map(clientsResult.data.map((c: { id: string }) => [c.id, c]))
            const mapped: ClientMembership[] = memberships
              .filter((m: { client_id: string }) => clientMap.has(m.client_id))
              .map((m: { client_id: string; role: ClientRole }) => ({
                client_id: m.client_id,
                role: m.role as ClientRole,
                client: clientMap.get(m.client_id) as ClientMembership['client'],
              }))
            setClients(mapped)
          }
        } else {
          setClients([])
        }
      } else if (membershipsResult.status === 'rejected') {
        console.warn('Memberships fetch failed:', membershipsResult.reason?.message);
      }

      // Fire-and-forget: don't block auth on a write operation
      supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId)
        .then(() => {});
    } catch (err) {
      console.warn('Erro ao carregar dados do usuario:', err);
    }
  }, []);

  // ---- Auth state listener ----
  useEffect(() => {
    // Short-circuit: se Supabase não está configurado, não tenta autenticar
    if (!isSupabaseConfigured) {
      console.warn('⚠️ Supabase não configurado. Pulando autenticação.');
      setLoading(false);
      return;
    }

    let mounted = true;
    let initDone = false;

    // Safety timeout: 20s (each query has its own 5s timeout via withTimeout,
    // so reaching 20s here means multiple queries + session recovery all stalled)
    const timeout = setTimeout(() => {
      if (mounted && !initDone) {
        console.warn('⚠️ Auth timeout (20s). Forçando loading=false — sessão ainda pode resolver em background.');
        setLoading(false);
      }
    }, 20000);

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setSupabaseUser(currentUser);

        if (currentUser) {
          await fetchUserData(currentUser.id);
        }
      } catch (error) {
        console.warn('Erro ao verificar sessao:', error);
      } finally {
        initDone = true;
        clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setSupabaseUser(currentUser);

      // Skip if initSession already handled this (dedup INITIAL_SESSION)
      if (!initDone && _event === 'INITIAL_SESSION') return;

      if (currentUser) {
        await fetchUserData(currentUser.id);
      } else {
        // Clear state on logout
        setProfile(null);
        setClients([]);
        setActiveClientId(null);
        localStorage.removeItem(ACTIVE_CLIENT_KEY);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // ---- Actions ----
  const setActiveClient = useCallback((clientId: string) => {
    setActiveClientId(clientId);
    localStorage.setItem(ACTIVE_CLIENT_KEY, clientId);
  }, []);

  const hasClientRole = useCallback((minRole: ClientRole): boolean => {
    if (isSuperAdmin) return true;
    if (!activeClientRole) return false;
    return CLIENT_ROLE_HIERARCHY[activeClientRole] >= CLIENT_ROLE_HIERARCHY[minRole];
  }, [activeClientRole, isSuperAdmin]);

  const signUp = useCallback(async (email: string, password: string, metadata?: { name?: string; company?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session?.user) {
      await fetchUserData(session.user.id);
    }
  }, [fetchUserData]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  // Backward compat aliases
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await signIn(email, password);
    return !error;
  }, [signIn]);

  const register = useCallback(async (data: { email: string; password: string; name: string; company?: string }): Promise<boolean> => {
    const { error } = await signUp(data.email, data.password, {
      name: data.name,
      company: data.company,
    });
    return !error;
  }, [signUp]);

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  // ---- Context value ----
  const value: AuthContextType = useMemo(() => ({
    user,
    profile,
    loading,
    isAuthenticated,
    clients,
    activeClient,
    activeClientRole,
    setActiveClient,
    isSuperAdmin,
    isGlobalAdmin,
    hasClientRole,
    signUp,
    signIn,
    signOut,
    refreshSession,
    resetPassword,
    login,
    register,
    logout,
  }), [
    user, profile, loading, isAuthenticated,
    clients, activeClient, activeClientRole, setActiveClient,
    isSuperAdmin, isGlobalAdmin, hasClientRole,
    signUp, signIn, signOut, refreshSession, resetPassword,
    login, register, logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ========== HOOK ==========

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
