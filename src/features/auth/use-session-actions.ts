'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { resetCsrfToken } from '@/lib/api/client';
import { publishSessionSignal } from '@/lib/auth/session-channel';

export function useSessionActions() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function logout(): Promise<void> {
    setPending(true);
    // Déconnexion SSO : le BFF efface les cookies puis redirige vers la fin de
    // session Keycloak, qui revient sur /login. L'ancien logout local ne touchait
    // jamais la session Keycloak : l'utilisateur était reconnecté automatiquement.
    resetCsrfToken();
    publishSessionSignal('logout');
    queryClient.clear();
    window.location.assign('/api/auth/keycloak/logout');
  }

  return { logout, pending } as const;
}
