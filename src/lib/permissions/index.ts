import type { UserRole } from '@/lib/auth/session';

export interface PermissionResult {
  readonly allowed: boolean;
  readonly reason?: string;
}
const allow = (): PermissionResult => ({ allowed: true });
const deny = (reason: string): PermissionResult => ({ allowed: false, reason });

export function canViewDashboard(role: UserRole): PermissionResult {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
    ? allow()
    : deny('Réservé aux superviseurs et administrateurs.');
}
export function canManageReferences(role: UserRole): PermissionResult {
  return role === 'ADMINISTRATOR' ? allow() : deny('Réservé aux administrateurs.');
}
export function canViewAudit(role: UserRole): PermissionResult {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
    ? allow()
    : deny('Journal d’audit non autorisé pour ce rôle.');
}
export function canUseInternalNotes(role: UserRole): PermissionResult {
  return role === 'FIELD_TECHNICIAN'
    ? deny('Les notes internes ne sont pas accessibles aux techniciens terrain.')
    : allow();
}
