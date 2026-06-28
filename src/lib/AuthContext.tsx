'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { base44, refreshBase44Client } from '@/api/base44Client';
import { getAppParams, getStoredAccessToken } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

interface AuthError {
  type: string;
  message: string;
}

interface AuthContextValue {
  user: Record<string, unknown> | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: AuthError | null;
  authChecked: boolean;
  appPublicSettings: Record<string, unknown> | null;
  logout: (shouldRedirect?: boolean) => void;
  navigateToLogin: () => void;
  checkUserAuth: () => Promise<boolean>;
  checkAppState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState<Record<string, unknown> | null>(null);
  const authInitialized = useRef(false);

  const checkUserAuth = useCallback(async (): Promise<boolean> => {
    try {
      setAuthError(null);

      const token = getStoredAccessToken();
      if (token) {
        base44.auth.setToken(token, false);
      }

      const currentUser = await Promise.race([
        base44.auth.me(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Auth check timed out')), 15000);
        }),
      ]);

      setUser(currentUser as Record<string, unknown>);
      setIsAuthenticated(true);
      setAuthChecked(true);
      return true;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
      return false;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const checkAppState = useCallback(async () => {
    if (authInitialized.current) {
      return;
    }

    try {
      if (!authInitialized.current) {
        setIsLoadingPublicSettings(true);
        setIsLoadingAuth(true);
      }
      setAuthError(null);

      const appParams = getAppParams();
      const token = appParams.token || getStoredAccessToken();

      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: { 'X-App-Id': appParams.appId ?? '' },
        token: token ?? undefined,
        interceptResponses: true,
      });

      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings as unknown as Record<string, unknown>);

        if (token) {
          refreshBase44Client();
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        }
      } catch (appError) {
        const error = appError as {
          status?: number;
          message?: string;
          data?: { extra_data?: { reason?: string } };
        };

        if (error.status === 403 && error.data?.extra_data?.reason) {
          const reason = error.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
          } else if (reason === 'user_not_registered') {
            setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
          } else {
            setAuthError({ type: reason, message: error.message ?? 'Authentication error' });
          }
        } else {
          setAuthError({ type: 'unknown', message: error.message ?? 'Failed to load app' });
        }
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    } catch (error) {
      setAuthError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } finally {
      authInitialized.current = true;
      setIsLoadingPublicSettings(false);
    }
  }, [checkUserAuth]);

  useEffect(() => {
    void checkAppState();
  }, [checkAppState]);

  const logout = useCallback((shouldRedirect = true) => {
    authInitialized.current = false;
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    setAuthError({ type: 'auth_required', message: 'Authentication required' });

    if (shouldRedirect) {
      base44.auth.logout(typeof window !== 'undefined' ? window.location.href : '/');
    } else {
      base44.auth.logout();
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    router.replace('/login');
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }),
    [
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
