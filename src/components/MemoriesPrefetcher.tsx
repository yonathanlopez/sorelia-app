'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { usePrefetchMemories } from '@/hooks/useMemories';

export default function MemoriesPrefetcher() {
  const { isAuthenticated, authChecked } = useAuth();
  const prefetchMemories = usePrefetchMemories();

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      prefetchMemories();
    }
  }, [authChecked, isAuthenticated, prefetchMemories]);

  return null;
}
