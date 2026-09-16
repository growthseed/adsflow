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
import { SERVICE_TIERS } from '@/data/serviceTiers';
import type { ClientServiceTier, ClientServiceTierConfig } from '@/types/metrics';
import {
  permKey,
  type PermissionModule,
  type PermissionAction,
  type PermissionKey,
  type RolePermissionsMap,
  type ClientOverridesMap,
} from '@/types/permissions';

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
    /** Column in DB: service_tier. Default 'basic'. */
    tier: ClientServiceTier;
    /** Column in DB: active_scope. Default 'performance'. */
    scope: string;
    /** Public portal share token (32-char hex). Staff uses this to generate
     *  the link adsflow.efeito.digital/portal/:token for the client. */
    portal_token: string | null;
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

  // Sprint 1 — Tier + Permission resolution
  /** Tier of the active client ('basic' | 'pro' | 'black' | 'enterprise'). */
  activeClientTier: ClientServiceTier | null;
  /** Full tier config (channels, feature flags) from SERVICE_TIERS. */
  activeClientTierConfig: ClientServiceTierConfig | null;
  /**
   * Permission resolver. Returns true when the current user can perform
   * `action` on `module`. Checks role_permissions template + per-client
   * overrides + staff bypass (super_admin/global admin always pass).
   */
  can: (module: PermissionModule, action: PermissionAction) => boolean;

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

  // Sprint 1 — permission maps. Role templates are global and loaded once;
  // client overrides are scoped to the active client and reload on switch.
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>({});
  const [clientOverrides, setClientOverrides] = useState<ClientOverridesMap>({});

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
    // Nunca reaproveitar um perfil/membership de outra sessao enquanto a
    // consulta atual esta em andamento. Os guards continuam em loading ate
    // o chamador concluir, entao a limpeza nao abre uma janela de acesso.
    setProfile(null)
    setClients([])

    // Wrap any Supabase query in a timeout race so one slow query doesn't
    // block the entire auth flow. On timeout, retry ONCE — a cold
    // connection (first request of the session: DNS + TLS handshake) can
    // eat the whole budget on its own even though the query itself runs in
    // under a millisecond once connected (confirmed via EXPLAIN ANALYZE in
    // producao em 2026-08-17). Sem retry, esse cold-start sozinho já
    // derrubava profile+memberships pra vazio e mandava o usuário pra
    // /no-access mesmo com os dados chegando milissegundos depois.
    const raceTimeout = <T,>(p: PromiseLike<T>, label: string, ms: number): Promise<T> =>
      Promise.race([
        Promise.resolve(p),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout ${label} (${ms}ms)`)), ms),
        ),
      ]);

    const withTimeout = <T,>(factory: () => PromiseLike<T>, label: string, ms = 6000): Promise<T> =>
      raceTimeout(factory(), label, ms).catch((err) => {
        console.warn(`[auth] ${label} timeout na 1a tentativa, retentando...`, err?.message);
        return raceTimeout(factory(), `${label} (retry)`, ms);
      });

    try {
      // Run profile + memberships in PARALLEL with independent timeouts
      const profilePromise = withTimeout(
        () => supabase
          .from('users')
          .select('id, email, name, avatar_url, phone, role, is_active, last_login_at, created_at')
          .eq('id', userId)
          .single(),
        'fetchProfile',
      );

      // Simpler membership query — no nested join, avoids recursive RLS
      const membershipsPromise = withTimeout(
        () => supabase
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

      const fetchedProfile = profileResult.status === 'fulfilled' && !profileResult.value.error
        ? profileResult.value.data as UserProfile | null : null
      const staffCatalog = fetchedProfile?.is_active === true &&
        (fetchedProfile.role === 'super_admin' || fetchedProfile.role === 'admin')
      if (staffCatalog || (membershipsResult.status === 'fulfilled' && !membershipsResult.value.error && membershipsResult.value.data)) {
        // Fetch client details in a second step only if needed (non-blocking)
        const memberships = membershipsResult.status === 'fulfilled' && !membershipsResult.value.error
          ? membershipsResult.value.data ?? [] : []
        if (staffCatalog || memberships.length > 0) {
          const clientIds = memberships.map((m: { client_id: string }) => m.client_id)
          const clientsResult = await withTimeout(
            () => {
              const query = supabase
              .from('clients')
              .select('id, name, slug, logo_url, status, industry, service_tier, active_scope, portal_token')
              .eq('status', 'active')
              .order('name')
              return staffCatalog ? query : query.in('id', clientIds)
            },
            'fetchClients',
          )

          if (!clientsResult.error && clientsResult.data) {
            // Normalize DB column names (service_tier, active_scope) to the
            // shorter fields the rest of the app consumes (tier, scope).
            type RawClient = {
              id: string
              name: string
              slug: string
              logo_url: string | null
              status: string
              industry: string | null
              service_tier: ClientServiceTier | null
              active_scope: string | null
              portal_token: string | null
            }
            const clientMap = new Map<string, ClientMembership['client']>(
              (clientsResult.data as RawClient[]).map((c) => [
                c.id,
                {
                  id: c.id,
                  name: c.name,
                  slug: c.slug,
                  logo_url: c.logo_url,
                  status: c.status,
                  industry: c.industry,
                  tier: (c.service_tier as ClientServiceTier) ?? 'basic',
                  scope: c.active_scope ?? 'performance',
                  portal_token: c.portal_token,
                },
              ]),
            )
            const visibleMemberships = staffCatalog
              ? (clientsResult.data as RawClient[]).map((client) => ({
                  client_id: client.id,
                  role: memberships.find((m) => m.client_id === client.id)?.role ?? 'admin',
                }))
              : memberships
            const mapped: ClientMembership[] = visibleMemberships
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

    // Short-circuit: rotas públicas (/portal/:token, /p/:token) não precisam
    // de profile/memberships. Se o usuário tem sessão de uma aba autenticada,
    // o RLS bloqueia esses fetches no contexto público e o timeout de 5s
    // por query atrasa o paint do portal pra cliente. Pula tudo aqui.
    const isPublicRoute =
      typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/portal/') ||
        window.location.pathname.startsWith('/p/'));

    if (isPublicRoute) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let initDone = false;
    let dataLoadTimer: ReturnType<typeof setTimeout> | null = null;

    // Safety timeout: 30s. Cada query individual tem 6s + 1 retry (12s), e
    // fetchClients roda depois de memberships resolver — pior caso é
    // ~24s. 30s dá margem sem deixar o usuário preso numa tela de loading
    // eterna se sessão + rede realmente travarem.
    const timeout = setTimeout(() => {
      if (mounted && !initDone) {
        console.warn('⚠️ Auth timeout (30s). Forçando loading=false — sessão ainda pode resolver em background.');
        setLoading(false);
      }
    }, 30000);

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

    // Sprint 1 — load the global role_permissions template once. This is
    // public reference data (RLS read-open to authenticated) so a single
    // fetch per session is enough. Per-client overrides load separately
    // when the active client changes (see the effect below).
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('role_name, permissions(module, action)')
        if (error) {
          console.warn('[auth] role_permissions fetch failed:', error.message)
          return
        }
        // Supabase v2 infers the joined `permissions` field as an array
        // even for many-to-one FKs. Normalize to first element.
        type PermLite = { module: PermissionModule; action: PermissionAction }
        type Row = {
          role_name: string
          permissions: PermLite | PermLite[] | null
        }
        const map: Record<string, Set<PermissionKey>> = {}
        for (const row of (data || []) as unknown as Row[]) {
          const perm = Array.isArray(row.permissions)
            ? row.permissions[0]
            : row.permissions
          if (!perm) continue
          const key = `${perm.module}:${perm.action}` as PermissionKey
          if (!map[row.role_name]) map[row.role_name] = new Set()
          map[row.role_name].add(key)
        }
        if (mounted) setRolePermissions(map)
      } catch (err) {
        console.warn('[auth] role_permissions fetch crashed:', err)
      }
    })();

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setSupabaseUser(currentUser);

      // INITIAL_SESSION is handled by initSession above. Never await
      // Supabase queries inside this callback: auth holds an internal lock
      // while notifying listeners, and profile/membership reads can deadlock
      // during a hard refresh. TOKEN_REFRESHED only changes the JWT; the
      // user's profile and memberships do not need to be reloaded for every
      // silent token renewal.
      if (_event === 'INITIAL_SESSION' || _event === 'TOKEN_REFRESHED') return;

      if (!currentUser) {
        // Clear state on logout
        setProfile(null);
        setClients([]);
        setActiveClientId(null);
        localStorage.removeItem(ACTIVE_CLIENT_KEY);
        setLoading(false);
        return;
      }

      if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED') {
        setLoading(true);
        if (dataLoadTimer) clearTimeout(dataLoadTimer);
        dataLoadTimer = setTimeout(() => {
          void fetchUserData(currentUser.id).finally(() => {
            if (mounted) setLoading(false);
          });
        }, 0);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (dataLoadTimer) clearTimeout(dataLoadTimer);
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

  // ---- Sprint 1 — Tier derivation ----

  const activeClientTier = useMemo<ClientServiceTier | null>(
    () => activeClient?.client.tier ?? null,
    [activeClient],
  );

  const activeClientTierConfig = useMemo<ClientServiceTierConfig | null>(
    () => (activeClientTier ? SERVICE_TIERS[activeClientTier] ?? null : null),
    [activeClientTier],
  );

  // ---- Sprint 1 — Per-client overrides loader ----
  // Enterprise clients can flip individual (role, permission) pairs.
  // We scope the fetch to the active client only — no point loading
  // overrides the user can't act on.
  useEffect(() => {
    if (!activeClient) {
      setClientOverrides({});
      return;
    }
    let cancelled = false;
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('client_role_overrides')
          .select('role_name, is_granted, permissions(module, action)')
          .eq('client_id', activeClient.client_id)
        if (error || !data) return
        type PermLite = { module: PermissionModule; action: PermissionAction }
        type Row = {
          role_name: string
          is_granted: boolean
          permissions: PermLite | PermLite[] | null
        }
        const map: ClientOverridesMap = {}
        for (const row of data as unknown as Row[]) {
          const perm = Array.isArray(row.permissions)
            ? row.permissions[0]
            : row.permissions
          if (!perm) continue
          const key = permKey(perm.module, perm.action)
          if (!map[row.role_name]) map[row.role_name] = {}
          map[row.role_name]![key] = row.is_granted
        }
        if (!cancelled) setClientOverrides(map)
      } catch (err) {
        console.warn('[auth] client_role_overrides fetch failed:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeClient])

  // ---- Sprint 1 — can() resolver ----
  // Resolution order:
  //   1. super_admin / global admin → always allow (staff bypass)
  //   2. If an override exists for the active role+permission, use it
  //   3. Otherwise fall back to the role_permissions template
  //   4. Default deny
  const can = useCallback(
    (module: PermissionModule, action: PermissionAction): boolean => {
      if (isGlobalAdmin) return true;
      const role = activeClientRole
      if (!role) return false

      const key = permKey(module, action)

      const override = clientOverrides[role]?.[key]
      if (override !== undefined) return override

      return rolePermissions[role]?.has(key) ?? false
    },
    [isGlobalAdmin, activeClientRole, clientOverrides, rolePermissions],
  );

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
    setLoading(true)
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) throw error

      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserData(session.user.id)
      } else {
        setProfile(null)
        setClients([])
      }
    } finally {
      setLoading(false)
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
    activeClientTier,
    activeClientTierConfig,
    can,
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
    activeClientTier, activeClientTierConfig, can,
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
