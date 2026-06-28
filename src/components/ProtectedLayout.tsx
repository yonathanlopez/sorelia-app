'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getStoredAccessToken } from '@/lib/app-params';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

export default function ProtectedLayout({
  children,
  fallback = <DefaultFallback />,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkAppState } = useAuth();

  useEffect(() => {
    if (authChecked && !isLoadingAuth && !isAuthenticated && getStoredAccessToken()) {
      void checkAppState();
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, checkAppState]);

  useEffect(() => {
    if (authChecked && !isLoadingAuth && !isAuthenticated) {
      if (authError?.type !== 'user_not_registered' && !getStoredAccessToken()) {
        router.replace('/login');
      }
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, authError, router]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  return <>{children}</>;
}
