import { BarChart3, Bell, ClipboardList, FileBarChart, History, Settings, ShieldCheck, Users } from 'lucide-react';
import type { UserRole } from '@/lib/auth/session';

export interface NavigationItem {
  readonly label: string;
  readonly href: string;
  readonly icon: typeof ClipboardList;
  readonly roles?: readonly UserRole[];
}

export const navigation: readonly NavigationItem[] = [
  { label: 'Tickets', href: '/tickets', icon: ClipboardList },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Tableau de bord', href: '/dashboard', icon: BarChart3, roles: ['ADMINISTRATOR', 'SUPERVISOR'] },
  { label: 'Utilisateurs', href: '/admin/users', icon: Users, roles: ['ADMINISTRATOR', 'SUPERVISOR'] },
  { label: 'Départements', href: '/admin/departments', icon: Settings, roles: ['ADMINISTRATOR'] },
  { label: 'Catégories', href: '/admin/categories', icon: Settings, roles: ['ADMINISTRATOR'] },
  { label: 'Paramètres', href: '/admin/settings', icon: Settings, roles: ['ADMINISTRATOR'] },
  { label: 'Politiques SLA', href: '/admin/sla', icon: ShieldCheck, roles: ['ADMINISTRATOR'] },
  { label: 'Audit', href: '/audit', icon: History, roles: ['ADMINISTRATOR', 'SUPERVISOR'] },
  { label: 'Rapports', href: '/reports', icon: FileBarChart, roles: ['ADMINISTRATOR', 'SUPERVISOR'] },
];

export function navigationForRole(role: UserRole): readonly NavigationItem[] {
  return navigation.filter((item) => !item.roles || item.roles.includes(role));
}
