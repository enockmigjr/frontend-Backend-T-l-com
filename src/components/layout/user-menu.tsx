'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CurrentUser } from '@/lib/auth/session';
import { apiRequest } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { publishSessionSignal } from '@/lib/auth/session-channel';

export function UserMenu({ user }: { readonly user: CurrentUser }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
      publishSessionSignal('logout');
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-slate-500">{roleLabel(user.role)}</p>
      </div>
      <span aria-hidden className="grid size-10 place-items-center rounded-full bg-blue-100 font-bold text-blue-800">
        {user.firstName.slice(0, 1)}
        {user.lastName.slice(0, 1)}
      </span>
      <Button variant="ghost" onClick={logout} disabled={pending}>
        {pending ? 'Déconnexion…' : 'Se déconnecter'}
      </Button>
    </div>
  );
}

function roleLabel(role: CurrentUser['role']): string {
  return {
    ADMINISTRATOR: 'Administrateur',
    SUPERVISOR: 'Superviseur',
    CUSTOMER_SERVICE_AGENT: 'Service client',
    NOC_ENGINEER: 'Agent NOC',
    BILLING_AGENT: 'Facturation',
    TECHNICAL_SUPPORT_ENGINEER: 'Support technique',
    FIELD_TECHNICIAN: 'Technicien terrain',
  }[role];
}
