'use client';

import { useEffect } from 'react';
import { completeOAuthCallback } from '@/lib/auth-callback';

export default function AuthCallbackPage() {
  useEffect(() => {
    const ok = completeOAuthCallback();
    window.location.replace(ok ? '/overview' : '/login?error=auth_failed');
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
      style={{ backgroundColor: '#f9fafb', color: '#111827' }}
    >
      <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-600">Finishing sign in...</p>
    </div>
  );
}
