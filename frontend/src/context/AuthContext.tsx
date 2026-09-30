import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../api/client.js';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: 'student' | 'admin';
  auth_provider?: string;
  created_at?: string;
  updated_at?: string;
}

// User interface backwards-compatible with existing components
export interface User extends UserProfile {}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (sbUser: SupabaseUser | null): Promise<UserProfile | null> => {
    if (!sbUser) return null;

    try {
      // 1. Try backend /api/auth/me which validates token, verifies role, and syncs to SQLite for judge
      const res = await api.getMe();
      if (res?.user) {
        return {
          id: sbUser.id,
          username: res.user.username || sbUser.user_metadata?.username || sbUser.email?.split('@')[0] || 'user',
          email: res.user.email || sbUser.email || '',
          full_name: res.user.full_name || sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || null,
          avatar_url: res.user.avatar_url || sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null,
          role: res.user.role === 'admin' ? 'admin' : 'student',
          auth_provider: res.user.auth_provider || sbUser.app_metadata?.provider || 'supabase',
        };
      }
    } catch {
      // Backend request error or offline fallback - query Supabase profiles directly
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sbUser.id)
            .maybeSingle();

          if (data) {
            return {
              id: data.id,
              username: data.username || sbUser.user_metadata?.username || sbUser.email?.split('@')[0] || 'user',
              email: data.email || sbUser.email || '',
              full_name: data.full_name || sbUser.user_metadata?.full_name || null,
              avatar_url: data.avatar_url || sbUser.user_metadata?.avatar_url || null,
              role: data.role === 'admin' ? 'admin' : 'student',
              auth_provider: data.auth_provider || sbUser.app_metadata?.provider || 'supabase',
              created_at: data.created_at,
              updated_at: data.updated_at,
            };
          }
        } catch {
          // ignore
        }
      }
    }

    // 2. Fallback to Supabase metadata if database record hasn't loaded yet
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      username: meta.username || sbUser.email?.split('@')[0] || 'user',
      email: sbUser.email || '',
      full_name: meta.full_name || meta.name || null,
      avatar_url: meta.avatar_url || meta.picture || null,
      // Never trust user-controlled auth metadata for authorization.
      role: 'student',
      auth_provider: sbUser.app_metadata?.provider || 'email',
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const p = await loadProfile(session.user);
      setProfile(p);
      setUser(p);
    } else if (!isSupabaseConfigured && getAuthToken()) {
      try {
        const res = await api.getMe();
        if (res.user) {
          setProfile(res.user);
          setUser(res.user);
        }
      } catch {
        // ignore
      }
    }
  }, [session, loadProfile]);

  useEffect(() => {
    let isMounted = true;

    let revision = 0;
    let profileTimer: ReturnType<typeof setTimeout> | undefined;

    // Auth callbacks must remain synchronous: getSession/profile requests inside
    // the callback can wait on the same Supabase auth lock indefinitely.
    const applySession = (activeSession: Session | null) => {
      const currentRevision = ++revision;
      clearTimeout(profileTimer);
      setSession(activeSession);
      if (!activeSession) {
        removeAuthToken();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setAuthToken(activeSession.access_token);
      const sbUser = activeSession.user;
      const fallback: UserProfile = {
        id: sbUser.id,
        username: sbUser.user_metadata?.username || sbUser.email?.split('@')[0] || 'user',
        email: sbUser.email || '',
        avatar_url: sbUser.user_metadata?.avatar_url || null,
        role: 'student',
      };
      setUser(previous => previous?.id === sbUser.id ? previous : fallback);
      setProfile(previous => previous?.id === sbUser.id ? previous : fallback);
      profileTimer = setTimeout(async () => {
        const p = await loadProfile(sbUser);
        if (isMounted && currentRevision === revision) {
          setProfile(p);
          setUser(p);
          setLoading(false);
        }
      }, 0);
    };

    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (isMounted) applySession(newSession);
      });
      subscription = data.subscription;
      const initialRevision = revision;
      supabase.auth.getSession().then(({ data: { session: activeSession }, error }) => {
        if (isMounted && initialRevision === revision) {
          applySession(error ? null : activeSession);
        }
      }).catch(() => {
        if (isMounted && initialRevision === revision) applySession(null);
      });
    } else {
      (async () => {
        try {
          if (getAuthToken()) {
            const res = await api.getMe();
            if (isMounted) {
              setProfile(res.user);
              setUser(res.user);
            }
          }
        } catch {
          removeAuthToken();
        } finally {
          if (isMounted) setLoading(false);
        }
      })();
    }

    return () => {
      isMounted = false;
      clearTimeout(profileTimer);
      revision++;
      subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const login = async (identifier: string, password: string) => {
    const cleanId = identifier.trim();

    if (isSupabaseConfigured) {
      if (!cleanId.includes('@')) {
        throw new Error('Use your email address, or continue with Google.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanId.toLowerCase(),
        password,
      });

      if (error) {
        throw new Error(error.message || 'Invalid credentials');
      }

      if (data.session) {
        setSession(data.session);
        setAuthToken(data.session.access_token);
        const p = await loadProfile(data.session.user);
        setProfile(p);
        setUser(p);
      }
    } else {
      // Local fallback for offline/development test runner
      const res = await api.login({ username: cleanId, password });
      if (res.token) {
        setAuthToken(res.token);
      }
      setProfile(res.user);
      setUser(res.user);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            full_name: cleanUsername,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Registration failed');
      }

      if (data.session) {
        setSession(data.session);
        setAuthToken(data.session.access_token);
        const p = await loadProfile(data.session.user);
        setProfile(p);
        setUser(p);
      }
    } else {
      // Local fallback for offline/test runner
      const res = await api.register({ username: cleanUsername, email: cleanEmail, password });
      if (res.token) {
        setAuthToken(res.token);
      }
      setProfile(res.user);
      setUser(res.user);
    }
  };

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message || 'Google sign-in failed');
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      removeAuthToken();
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        isAdmin: (profile?.role === 'admin' || user?.role === 'admin'),
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
