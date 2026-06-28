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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    }),
  ]);
}

function markUnauthenticated(
  setUser: (user: Record<string, unknown> | null) => void,
  setIsAuthenticated: (value: boolean) => void,
  setAuthChecked: (value: boolean) => void,
  setAuthError: (error: AuthError) => void,
  setIsLoadingAuth: (value: boolean) => void,
) {
  setUser(null);
  setIsAuthenticated(false);
  setAuthChecked(true);
  setIsLoadingAuth(false);
  setAuthError({ type: 'auth_required', message: 'Authentication required' });
}

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

      const currentUser = await withTimeout(base44.auth.me(), 10000, 'Auth check');

      setUser(currentUser as Record<string, unknown>);
      setIsAuthenticated(true);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return true;
    } catch {
      markUnauthenticated(setUser, setIsAuthenticated, setAuthChecked, setAuthError, setIsLoadingAuth);
      return false;
    }
  }, []);

  const checkAppState = useCallback(async () => {
    if (authInitialized.current) {
      return;
    }
    authInitialized.current = true;

    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      await withTimeout(
        (async () => {
          const appParams = getAppParams();
          const token = appParams.token || getStoredAccessToken();

          try {
            const appClient = createAxiosClient({
              baseURL: `/api/apps/public`,
              headers: { 'X-App-Id': appParams.appId ?? '' },
              token: token ?? undefined,
              interceptResponses: true,
            });

            const publicSettings = await withTimeout(
              appClient.get(`/prod/public-settings/by-id/${appParams.appId}`),
              8000,
              'Public settings',
            );
            setAppPublicSettings(publicSettings as unknown as Record<string, unknown>);
          } catch {
            // Public settings are optional; auth can still proceed.
          }

          if (token) {
            refreshBase44Client();
            await checkUserAuth();
            return;
          }

          markUnauthenticated(setUser, setIsAuthenticated, setAuthChecked, setAuthError, setIsLoadingAuth);
        })(),
        12000,
        'App startup',
      );
    } catch {
      markUnauthenticated(setUser, setIsAuthenticated, setAuthChecked, setAuthError, setIsLoadingAuth);
    } finally {
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
    setIsLoadingAuth(false);
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
