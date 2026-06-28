'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import BottomNav from '@/components/BottomNav';

export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      {children}
      <BottomNav />
    </ProtectedLayout>
  );
}
