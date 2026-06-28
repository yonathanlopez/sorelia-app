'use client';

import { useEffect } from 'react';
import { completeOAuthCallback } from '@/lib/auth-callback';
import { getStoredAccessToken } from '@/lib/app-params';
import LoadingScreen from '@/components/LoadingScreen';

export default function RootRedirectPage() {
  useEffect(() => {
    completeOAuthCallback();
    const destination = getStoredAccessToken() ? '/overview' : '/login';
    window.location.replace(destination);

    const fallback = window.setTimeout(() => {
      if (window.location.pathname === '/') {
        window.location.replace(destination);
      }
    }, 4000);

    return () => window.clearTimeout(fallback);
  }, []);

  return <LoadingScreen message="Loading Sorelia..." />;
}
