'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import LoadingScreen from '@/components/LoadingScreen';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth, authChecked, authError } = useAuth();

  useEffect(() => {
    if (!authChecked || isLoadingAuth || isAuthenticated) {
      return;
    }

    router.replace('/login');
  }, [authChecked, isLoadingAuth, isAuthenticated, router]);

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
