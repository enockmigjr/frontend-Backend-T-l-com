'use client';

import { useRouter } from 'next/navigation';
import { ChevronUp, LogOut, MonitorCog, Settings, UserRound } from 'lucide-react';
import type { CurrentUser } from '@/lib/auth/session';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSessionActions } from '@/features/auth/use-session-actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu({
  user,
  placement = 'topbar',
}: Readonly<{ user: CurrentUser; placement?: 'topbar' | 'sidebar' }>) {
  const router = useRouter();
  const { logout, pending } = useSessionActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={placement === 'sidebar'
        ? 'flex h-12 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-sidebar-accent focus-visible:ring-2'
        : 'flex h-10 items-center gap-2 rounded-lg px-2 hover:bg-muted focus-visible:ring-2'}
      >
        <Avatar>
          <AvatarFallback className="bg-blue-100 font-semibold text-blue-800">
            {user.firstName.slice(0, 1)}
            {user.lastName.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span className={placement === 'sidebar' ? 'min-w-0 flex-1 group-data-[collapsible=icon]:hidden' : 'hidden min-w-0 text-left lg:block'}>
          <strong className="block max-w-36 truncate text-xs">
            {user.firstName} {user.lastName}
          </strong>
          <span className="block truncate text-[11px] font-normal text-muted-foreground">{roleLabel(user.role)}</span>
        </span>
        {placement === 'sidebar' ? <ChevronUp className="size-4 group-data-[collapsible=icon]:hidden" /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2">
            <span className="block truncate">{user.email}</span>
            <span className="font-normal text-muted-foreground">{roleLabel(user.role)}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings aria-hidden />
            Profil et préférences
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/change-password')}>
            <UserRound aria-hidden />
            Modifier mon mot de passe
          </DropdownMenuItem>
          <DropdownMenuItem disabled={pending} onClick={() => void logout(true)}>
            <MonitorCog aria-hidden />
            Déconnecter toutes mes sessions
          </DropdownMenuItem>
        </DropdownMenuGroup>
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
