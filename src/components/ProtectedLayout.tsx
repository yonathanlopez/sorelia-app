'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
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
  const { isAuthenticated, isLoadingAuth, authChecked, authError } = useAuth();

  useEffect(() => {
    if (authChecked && !isLoadingAuth && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, router]);

  if (!authChecked || isLoadingAuth) {
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
