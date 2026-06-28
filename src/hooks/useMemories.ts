'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const MEMORIES_QUERY_KEY = ['memories'] as const;
const MEMORIES_LIMIT = 500;

async function fetchMemories() {
  return base44.entities.Calendar.list('-created_date', MEMORIES_LIMIT);
}

export function useMemories() {
  return useQuery({
    queryKey: MEMORIES_QUERY_KEY,
    queryFn: fetchMemories,
    retry: 1,
  });
}

export function usePrefetchMemories() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.prefetchQuery({
      queryKey: MEMORIES_QUERY_KEY,
      queryFn: fetchMemories,
    });
  };
}
