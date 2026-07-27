'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RadioTower } from 'lucide-react';
import type { CurrentUser } from '@/lib/auth/session';
import { navigationForRole, type NavigationGroup } from './navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const groups: readonly NavigationGroup[] = ['Travail', 'Supervision', 'Administration'];

export function AppSidebar({ user }: Readonly<{ user: CurrentUser }>) {
  const pathname = usePathname();
  const items = navigationForRole(user.role);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-3">
        <Link href="/tickets" className="flex items-center gap-2 overflow-hidden rounded-lg px-1">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-700 text-white shadow-sm">
            <RadioTower aria-hidden className="size-4" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <strong className="block truncate text-sm tracking-tight">KAMGOKO</strong>
            <span className="block truncate text-[11px] text-muted-foreground">Operations Desk</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-2">
        {groups.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>{group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupItems.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={active}
                          tooltip={item.label}
                          className="h-9 data-active:bg-blue-50 data-active:text-blue-800"
                        >
                          <Icon aria-hidden />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
