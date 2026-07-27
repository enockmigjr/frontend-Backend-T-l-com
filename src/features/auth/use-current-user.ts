'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth/session';

export function useCurrentUser() {
  return useQuery({ queryKey: ['session', 'me'], queryFn: ({ signal }) => getCurrentUser(signal), staleTime: 60_000 });
}
