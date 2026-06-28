'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type LoadingScreenProps = {
  message?: string;
  loginHref?: string;
};

export default function LoadingScreen({
  message = 'Loading Sorelia...',
  loginHref = '/login',
}: LoadingScreenProps) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6"
      style={{ backgroundColor: '#f9fafb', color: '#111827' }}
    >
      <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-600">{message}</p>

      {slow ? (
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <p className="text-sm text-gray-500">
            This is taking longer than expected. Check your connection, then try again.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href={loginHref} className="text-sm font-medium text-violet-600 hover:underline">
              Go to login
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-gray-600 hover:underline"
            >
              Refresh page
            </button>
          </div>
          <p className="text-xs text-gray-400">
            If the page looks unstyled locally, run <span className="font-mono">npm run dev:clean</span>.
          </p>
        </div>
      ) : (
        <Link href={loginHref} className="text-sm font-medium text-violet-600 hover:underline">
          Go to login
        </Link>
      )}
    </div>
  );
}
