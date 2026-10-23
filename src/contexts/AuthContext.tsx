import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, AppRole } from '../types/database.types';
import { clearMemberCache } from '../services/memberService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string, userEmail: string): Promise<UserProfile | null> => {
    if (!configured) return null;

    try {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const isDesignatedOwner = userEmail.toLowerCase() === 'pranavsonawane1328@gmail.com';

      if (profileErr) {
        console.warn('Profile fetch warning (table may be pending migration):', profileErr.message);
        // Fallback profile if table is not yet migrated, preserving email
        return {
          id: userId,
          email: userEmail,
          full_name: isDesignatedOwner ? 'Gym Owner' : 'Gym Staff',
          phone: null,
          role: isDesignatedOwner ? 'owner' : 'staff',
          is_active: true,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      if (data) {
        if (!data.is_active) {
          await supabase.auth.signOut();
          setError('This account is pending approval or has been deactivated. Please contact the gym owner.');
          return null;
        }
        return data as UserProfile;
      }

      // If no profile row exists in database yet, only designated owner gets initial access
      if (!isDesignatedOwner) {
        await supabase.auth.signOut();
        setError('This account is pending owner approval. Please contact the gym owner.');
        return null;
      }

      return {
        id: userId,
        email: userEmail,
        full_name: 'Gym Owner',
        phone: null,
        role: 'owner',
        is_active: true,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;

      if (initialSession?.user) {
        setSession(initialSession);
        setUser(initialSession.user);
        const userProfile = await fetchProfile(initialSession.user.id, initialSession.user.email || '');
        if (isMounted) setProfile(userProfile);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      if (isMounted) setLoading(false);
    }).catch((err) => {
      console.error('Auth session initialization failed:', err);
      if (isMounted) setLoading(false);
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          clearMemberCache();
        }

        setSession(currentSession);
        if (currentSession?.user) {
          setUser(currentSession.user);
          const userProfile = await fetchProfile(currentSession.user.id, currentSession.user.email || '');
          if (isMounted) setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, fetchProfile]);

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);

    if (!configured) {
      const msg = 'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.';
      setError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr) {
        setError(signInErr.message);
        return { success: false, error: signInErr.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        const userProfile = await fetchProfile(data.user.id, data.user.email || '');
        setProfile(userProfile);
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred during sign in.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      if (configured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      clearMemberCache();
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const updated = await fetchProfile(user.id, user.email || '');
      setProfile(updated);
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    profile,
    role: profile?.role || null,
    session,
    loading,
    isConfigured: configured,
    error,
    signInWithEmail,
    signOut,
    refreshProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
