'use client';

import { useEffect } from 'react';
import { completeOAuthCallback } from '@/lib/auth-callback';
import LoadingScreen from '@/components/LoadingScreen';

export default function AuthCallbackPage() {
  useEffect(() => {
    const ok = completeOAuthCallback();
    const destination = ok ? '/overview' : '/login?error=auth_failed';
    window.location.replace(destination);

    const fallback = window.setTimeout(() => {
      if (window.location.pathname === '/auth/callback') {
        window.location.replace(destination);
      }
    }, 4000);

    return () => window.clearTimeout(fallback);
  }, []);

  return <LoadingScreen message="Finishing sign in..." />;
}
