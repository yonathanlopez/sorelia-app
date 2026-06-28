'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

function LoadingScreen({ message = 'Loading Sorelia...' }: { message?: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6"
      style={{ backgroundColor: '#f9fafb', color: '#111827' }}
    >
      <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-600">{message}</p>
      <Link href="/login" className="text-sm font-medium text-violet-600 hover:underline">
        Go to login
      </Link>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError } = useAuth();

  useEffect(() => {
    if (!authChecked || isLoadingAuth || isAuthenticated) {
      return;
    }

    window.location.replace('/login');
  }, [authChecked, isLoadingAuth, isAuthenticated]);

  if (!authChecked || isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  return <>{children}</>;
}
