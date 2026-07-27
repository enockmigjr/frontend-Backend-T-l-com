'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest, resetCsrfToken } from '@/lib/api/client';
import { publishSessionSignal } from '@/lib/auth/session-channel';
import { toast } from '@/components/ui/toast';

export function useSessionActions() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function logout(allSessions = false): Promise<void> {
    setPending(true);
    let remoteFailure = false;
    try {
      await apiRequest(allSessions ? '/api/auth/logout-all' : '/api/auth/logout', { method: 'POST' });
    } catch {
      remoteFailure = true;
    } finally {
      resetCsrfToken();
      publishSessionSignal('logout');
      queryClient.clear();
      router.replace('/login');
      router.refresh();
      setPending(false);
    }
    if (remoteFailure) {
      toast.add({
        title: 'Session locale fermée',
        description: 'La révocation distante n’a pas pu être confirmée. Reconnectez-vous pour vérifier vos sessions.',
      });
    }
  }

  return { logout, pending } as const;
}
