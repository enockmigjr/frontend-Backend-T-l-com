'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, RadioTower } from 'lucide-react';
import type { CurrentUser } from '@/lib/auth/session';
import { navigationForRole, type NavigationGroup } from './navigation';
import { UserMenu } from './user-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

const groups: readonly NavigationGroup[] = ['Travail', 'Supervision', 'Administration'];
const storageKey = 'kamgoko.sidebar.groups.v1';

export function AppSidebar({ user }: Readonly<{ user: CurrentUser }>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const items = navigationForRole(user.role);
  const [opened, setOpened] = useState<Record<NavigationGroup, boolean>>({
    Travail: true,
    Supervision: true,
    Administration: true,
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;
      try {
        const value: unknown = JSON.parse(stored);
        if (isGroupState(value)) setOpened(value);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function setGroup(group: NavigationGroup, open: boolean) {
    setOpened((current) => {
      const next = { ...current, [group]: open };
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-2">
        <Link
          href="/tickets"
          onClick={closeMobile}
          className="flex h-10 w-full items-center gap-2 overflow-hidden rounded-lg px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="app-sidebar-logo grid size-8 shrink-0 place-items-center rounded-lg text-white shadow-sm">
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
          const open = state === 'collapsed' || opened[group];
          return (
            <Collapsible key={group} open={open} onOpenChange={(value) => setGroup(group, value)}>
              <SidebarGroup>
                <CollapsibleTrigger
                  disabled={state === 'collapsed'}
                  className="group/collapse flex w-full items-center rounded-md focus-visible:ring-2"
                >
                  <SidebarGroupLabel render={<span />} className="flex-1 cursor-pointer">
                    {group}
                  </SidebarGroupLabel>
                  <ChevronDown className="mr-2 size-4 text-muted-foreground transition-transform group-data-panel-open/collapse:rotate-180 group-data-[collapsible=icon]:hidden" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {groupItems.map((item) => {
                        const active = isNavigationActive(
                          pathname,
                          item.href,
                          items.map((entry) => entry.href),
                        );
                        const Icon = item.icon;
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              render={<Link href={item.href} onClick={closeMobile} />}
                              isActive={active}
                              aria-current={active ? 'page' : undefined}
                              tooltip={item.label}
                              className="app-sidebar-item h-9"
                            >
                              <Icon aria-hidden />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <UserMenu user={user} placement="sidebar" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function isNavigationActive(pathname: string, href: string, hrefs: readonly string[]): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  return !hrefs.some(
    (candidate) => candidate !== href && candidate.startsWith(`${href}/`) && pathname.startsWith(candidate),
  );
}

function isGroupState(value: unknown): value is Record<NavigationGroup, boolean> {
  if (typeof value !== 'object' || value === null) return false;
  return groups.every(
    (group) => Object.prototype.hasOwnProperty.call(value, group) && typeof Reflect.get(value, group) === 'boolean',
  );
}
