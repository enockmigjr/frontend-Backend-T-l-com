'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, MonitorCog, UserRound } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { CurrentUser } from '@/lib/auth/session';
import { apiRequest } from '@/lib/api/client';
import { publishSessionSignal } from '@/lib/auth/session-channel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu({ user }: Readonly<{ user: CurrentUser }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function logout(allSessions: boolean) {
    setPending(true);
    try {
      await apiRequest(allSessions ? '/api/auth/logout-all' : '/api/auth/logout', { method: 'POST' });
      publishSessionSignal('logout');
      queryClient.clear();
      router.replace('/login');
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="h-10 gap-2 px-2" aria-label="Ouvrir le menu du compte" />}
      >
        <Avatar>
          <AvatarFallback className="bg-blue-100 font-semibold text-blue-800">
            {user.firstName.slice(0, 1)}
            {user.lastName.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 text-left lg:block">
          <strong className="block max-w-36 truncate text-xs">
            {user.firstName} {user.lastName}
          </strong>
          <span className="block truncate text-[11px] font-normal text-muted-foreground">{roleLabel(user.role)}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="px-2 py-2">
          <span className="block truncate">{user.email}</span>
          <span className="font-normal text-muted-foreground">{roleLabel(user.role)}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/change-password')}>
          <UserRound aria-hidden />
          Modifier mon mot de passe
        </DropdownMenuItem>
        <DropdownMenuItem disabled={pending} onClick={() => void logout(true)}>
          <MonitorCog aria-hidden />
          Déconnecter toutes mes sessions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={pending} onClick={() => void logout(false)}>
          <LogOut aria-hidden />
          {pending ? 'Déconnexion…' : 'Se déconnecter'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
