'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { InterfacePreferencesSync } from '@/features/settings/preferences';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            retry: (attempt, error) => attempt < 2 && isTransient(error),
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <InterfacePreferencesSync />
      {children}
    </QueryClientProvider>
  );
}

function isTransient(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /network|timeout|502|503|504/i.test(error.message);
}
