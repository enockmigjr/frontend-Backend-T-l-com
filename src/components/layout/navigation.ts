import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileBarChart,
  FolderCog,
  Gauge,
  History,
  Plug,
  Send,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
} from 'lucide-react';
import type { UserRole } from '@/lib/auth/session';

export type NavigationGroup = 'Travail' | 'Supervision' | 'Administration';

export interface NavigationItem {
  readonly label: string;
  readonly href: string;
  readonly icon: typeof ClipboardList;
  readonly group: NavigationGroup;
  readonly roles?: readonly UserRole[];
}

export const navigation: readonly NavigationItem[] = [
  { label: 'Tickets', href: '/tickets', icon: ClipboardList, group: 'Travail' },
  { label: 'Notifications', href: '/notifications', icon: Bell, group: 'Travail' },
  { label: 'Paramètres', href: '/settings', icon: Settings, group: 'Travail' },
  {
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: BarChart3,
    group: 'Supervision',
    roles: ['ADMINISTRATOR', 'SUPERVISOR'],
  },
  { label: 'Audit', href: '/audit', icon: History, group: 'Supervision', roles: ['ADMINISTRATOR', 'SUPERVISOR'] },
  {
    label: 'Rapports',
    href: '/reports',
    icon: FileBarChart,
    group: 'Supervision',
    roles: ['ADMINISTRATOR', 'SUPERVISOR'],
  },
  { label: 'Vue d’ensemble', href: '/admin', icon: Gauge, group: 'Administration', roles: ['ADMINISTRATOR'] },
  {
    label: 'Utilisateurs',
    href: '/admin/users',
    icon: Users,
    group: 'Administration',
    roles: ['ADMINISTRATOR', 'SUPERVISOR'],
  },
  {
    label: 'Départements',
    href: '/admin/departments',
    icon: Building2,
    group: 'Administration',
    roles: ['ADMINISTRATOR'],
  },
  {
    label: 'Catégories',
    href: '/admin/categories',
    icon: FolderCog,
    group: 'Administration',
    roles: ['ADMINISTRATOR'],
  },
  {
    label: 'Politiques SLA',
    href: '/admin/sla',
    icon: ShieldCheck,
    group: 'Administration',
    roles: ['ADMINISTRATOR'],
  },
  {
    label: 'Intégrations',
    href: '/admin/integrations',
    icon: Plug,
    group: 'Administration',
    roles: ['ADMINISTRATOR', 'SUPERVISOR'],
  },
  {
    label: 'Livraisons externes',
    href: '/admin/livraisons',
    icon: Send,
    group: 'Administration',
    roles: ['ADMINISTRATOR', 'SUPERVISOR'],
  },
  {
    label: 'Demandeurs publics',
    href: '/admin/demandeurs',
    icon: UsersRound,
    group: 'Administration',
    roles: ['ADMINISTRATOR', 'SUPERVISOR'],
  },
];

export function navigationForRole(role: UserRole): readonly NavigationItem[] {
  return navigation.filter((item) => !item.roles || item.roles.includes(role));
}
