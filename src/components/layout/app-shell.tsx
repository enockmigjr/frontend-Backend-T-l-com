'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RadioTower } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { navigationForRole } from './navigation';
import { LoadingState } from '@/components/ui/states';
import { UserMenu } from './user-menu';
import { cn } from '@/lib/utils/cn';
import { subscribeSessionSignals } from '@/lib/auth/session-channel';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userQuery = useQuery({
    queryKey: ['session', 'me'],
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: false,
  });
  useEffect(() => {
    if (userQuery.error) router.replace(`/login?retour=${encodeURIComponent(pathname)}`);
    if (userQuery.data?.mustChangePassword) router.replace('/change-password');
  }, [pathname, router, userQuery.data, userQuery.error]);
  useEffect(
    () =>
      subscribeSessionSignals((signal) => {
        if (signal === 'logout') {
          queryClient.clear();
          router.replace('/login');
          router.refresh();
          return;
        }
        void queryClient.invalidateQueries({ queryKey: ['session', 'me'] });
        router.refresh();
      }),
    [queryClient, router],
  );
  if (!userQuery.data)
    return (
      <main id="contenu">
        <LoadingState label="Vérification de la session…" />
      </main>
    );
  const items = navigationForRole(userQuery.data.role);
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-slate-200 bg-slate-950 text-white lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-3 px-4 lg:h-20 lg:px-6">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600">
            <RadioTower aria-hidden className="size-5" />
          </span>
          <div>
            <p className="font-bold tracking-tight">KAMGOKO</p>
            <p className="text-xs text-slate-400">Centre d’opérations</p>
          </div>
        </div>
        <nav
          aria-label="Navigation principale"
          className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0"
        >
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={{ pathname: item.href }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white',
                  active && 'bg-blue-600 text-white hover:bg-blue-600',
                )}
              >
                <Icon aria-hidden className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <UserMenu user={userQuery.data} />
        </header>
        <main id="contenu" className="mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
