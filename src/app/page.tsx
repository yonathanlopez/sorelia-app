'use client';

import { useEffect } from 'react';

function hasStoredToken() {
  return !!(
    window.localStorage.getItem('base44_access_token') ||
    window.localStorage.getItem('token')
  );
}

export default function RootRedirectPage() {
  useEffect(() => {
    window.location.replace(hasStoredToken() ? '/overview' : '/login');
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
      style={{ backgroundColor: '#f9fafb', color: '#111827' }}
    >
      <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-600">Loading Sorelia...</p>
      <a href="/login" className="text-sm font-medium text-violet-600 hover:underline">
        Go to login
      </a>
    </div>
  );
}
