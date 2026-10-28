import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getAuthenticatedClient } from '../lib/supabase';
import { UserProfile, AppRole, isValidAppRole } from '../types/database.types';

export type ProfileResolution =
  | { status: 'authorized'; profile: UserProfile }
  | { status: 'unauthorized'; reason: 'missing_profile' | 'inactive' | 'invalid_role'; message: string }
  | { status: 'transient_error'; message: string };

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  error: string | null;
  isTransientError: boolean;
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
  const [isTransientError, setIsTransientError] = useState<boolean>(false);

  const configured = isSupabaseConfigured();
  const isSigningOutRef = useRef<boolean>(false);
  const inFlightFetchRef = useRef<string | null>(null);

  /**
   * Safely sign out the session without triggering recursive auth-state callbacks
   * or deadlocks inside event loops.
   */
  const safeSignOut = useCallback(async () => {
    if (isSigningOutRef.current) return;
    isSigningOutRef.current = true;

    try {
      if (configured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[Auth Security] Sign out notice:', err);
    } finally {
      isSigningOutRef.current = false;
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }, [configured]);

  /**
   * Resolves the profile from database and explicitly distinguishes:
   * 1. Authorized active profile with valid AppRole
   * 2. Confirmed unauthorized profile (missing, deactivated, or invalid role)
   * 3. Transient network or server error (retains session for retry)
   */
  const resolveProfile = useCallback(async (
    userId: string,
    userEmail: string,
    accessToken?: string
  ): Promise<ProfileResolution> => {
    if (!configured) {
      return {
        status: 'transient_error',
        message: 'Supabase credentials are not configured. Please set environment variables.',
      };
    }

    try {
      const client = getAuthenticatedClient(accessToken);
      const { data, error: profileErr } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.info('[Auth Profile Audit]', {
        userIdPrefix: userId ? `${userId.substring(0, 8)}...` : 'none',
        userEmail,
        hasAccessToken: Boolean(accessToken),
        profileFound: Boolean(data),
        profileRole: data?.role ?? null,
        isActive: data?.is_active,
        queryError: profileErr ? profileErr.message : null,
      });

      // 1. Transient query/network error - do NOT treat as confirmed unauthorized
      if (profileErr) {
        console.error('[Auth Security] Profile query communication failure:', profileErr.message);
        return {
          status: 'transient_error',
          message: `Database communication error: ${profileErr.message}. Please check your connection.`,
        };
      }

      // 2. Confirmed missing profile
      if (!data) {
        console.warn('[Auth Security] No profile record found in public.profiles for user:', userId);
        return {
          status: 'unauthorized',
          reason: 'missing_profile',
          message: 'No administrative profile record exists for this user in the database. Contact the gym owner to provision your profile.',
        };
      }

      // 3. Confirmed inactive account
      if (data.is_active !== true) {
        console.warn('[Auth Security] Profile marked inactive for user:', userId);
        return {
          status: 'unauthorized',
          reason: 'inactive',
          message: 'This account has been deactivated or is pending approval. Please contact the gym owner.',
        };
      }

      // 4. Confirmed invalid or unexpected role
      if (!isValidAppRole(data.role)) {
        console.warn('[Auth Security] Unexpected or null role for user:', userId, data.role);
        return {
          status: 'unauthorized',
          reason: 'invalid_role',
          message: `This account has an unpermitted administrative role ('${data.role || 'none'}') in the database. Access restricted.`,
        };
      }

      // 5. Explicitly authorized active profile
      return {
        status: 'authorized',
        profile: data as UserProfile,
      };
    } catch (err: any) {
      console.error('[Auth Security] Unexpected error during profile resolution:', err);
      return {
        status: 'transient_error',
        message: err?.message || 'A network error occurred while verifying account authorization.',
      };
    }
  }, [configured]);

  /**
   * Applies resolution result to React state and safely acts on unauthorized sessions.
   */
  const handleResolutionResult = useCallback((
    result: ProfileResolution,
    currentSession: Session | null
  ) => {
    if (result.status === 'authorized') {
      setUser(currentSession?.user ?? null);
      setSession(currentSession);
      setProfile(result.profile);
      setError(null);
      setIsTransientError(false);
    } else if (result.status === 'unauthorized') {
      // Confirmed unauthorized: clear state and safely trigger signout deferred
      setUser(null);
      setSession(null);
      setProfile(null);
      setError(result.message);
      setIsTransientError(false);

      // Defer sign out outside the callback stack to prevent deadlock
      setTimeout(() => {
        safeSignOut();
      }, 0);
    } else {
      // Transient error: retain user session for retry, but do NOT grant admin profile
      setUser(currentSession?.user ?? null);
      setSession(currentSession);
      setProfile(null);
      setError(result.message);
      setIsTransientError(true);
    }
  }, [safeSignOut]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial session check on mount
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;

      if (initialSession?.user) {
        const fetchKey = `${initialSession.user.id}:${initialSession.access_token}`;
        inFlightFetchRef.current = fetchKey;

        const res = await resolveProfile(
          initialSession.user.id,
          initialSession.user.email || '',
          initialSession.access_token
        );

        if (isMounted) {
          handleResolutionResult(res, initialSession);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setError(null);
        setIsTransientError(false);
      }
      if (isMounted) setLoading(false);
    }).catch((err) => {
      console.error('[Auth Security] Session retrieval failed:', err);
      if (isMounted) {
        setError('Failed to initialize session. Please check your network connection.');
        setIsTransientError(true);
        setLoading(false);
      }
    });

    // 2. Auth state change listener (deferred profile resolution to prevent deadlock)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        // Skip re-fetching profile on token refresh if profile is already resolved and user matches
        if (event === 'TOKEN_REFRESHED' && currentSession?.user && profile?.id === currentSession.user.id) {
          setSession(currentSession);
          return;
        }

        if (currentSession?.user) {
          // Defer profile resolution outside of the synchronous onAuthStateChange frame
          setTimeout(async () => {
            if (!isMounted) return;

            const res = await resolveProfile(
              currentSession.user.id,
              currentSession.user.email || '',
              currentSession.access_token
            );

            if (isMounted) {
              handleResolutionResult(res, currentSession);
              setLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, resolveProfile, handleResolutionResult, profile?.id]);

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsTransientError(false);

    if (!configured) {
      const msg = 'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.';
      setError(msg);
      setIsTransientError(false);
      return { success: false, error: msg };
    }

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr) {
        setError(signInErr.message);
        setIsTransientError(false);
        return { success: false, error: signInErr.message };
      }

      if (data.user) {
        const res = await resolveProfile(data.user.id, data.user.email || '', data.session?.access_token);

        if (res.status === 'authorized') {
          setUser(data.user);
          setSession(data.session);
          setProfile(res.profile);
          setError(null);
          setIsTransientError(false);
          return { success: true };
        } else if (res.status === 'unauthorized') {
          // Confirmed unauthorized profile: immediately sign out
          await safeSignOut();
          setError(res.message);
          setIsTransientError(false);
          return { success: false, error: res.message };
        } else {
          // Transient error: do not sign out, but do not log in to admin
          setError(res.message);
          setIsTransientError(true);
          return { success: false, error: res.message };
        }
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred during sign in.';
      setError(msg);
      setIsTransientError(true);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    setError(null);
    setIsTransientError(false);
    await safeSignOut();
  };

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await resolveProfile(
        user.id,
        user.email || '',
        sessionData?.session?.access_token
      );
      handleResolutionResult(res, sessionData?.session ?? session);
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
    setIsTransientError(false);
  };

  const value: AuthContextType = {
    user,
    profile,
    role: profile?.role || null,
    session,
    loading,
    isConfigured: configured,
    error,
    isTransientError,
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
