'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import BottomNav from '@/components/BottomNav';
import MemoriesPrefetcher from '@/components/MemoriesPrefetcher';
import { AuthProvider } from '@/lib/AuthContext';

export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedLayout>
        <MemoriesPrefetcher />
        <div className="min-h-screen bg-gray-50">{children}</div>
        <BottomNav />
      </ProtectedLayout>
    </AuthProvider>
  );
}
