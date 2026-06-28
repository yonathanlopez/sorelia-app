'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import BottomNav from '@/components/BottomNav';
import MemoriesPrefetcher from '@/components/MemoriesPrefetcher';

export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      <MemoriesPrefetcher />
      {children}
      <BottomNav />
    </ProtectedLayout>
  );
}
