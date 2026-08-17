'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth/session';
import { ApiError } from '@/lib/api/errors';
import { subscribeSessionSignals } from '@/lib/auth/session-channel';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AppSidebar } from './app-sidebar';
import { AppTopbar } from './app-topbar';

export function AppShell({
  children,
  sidebarDefaultOpen,
}: Readonly<{ children: React.ReactNode; sidebarDefaultOpen: boolean }>) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userQuery = useQuery({
    queryKey: ['session', 'me'],
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 2,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (userQuery.error instanceof ApiError && userQuery.error.status === 401) {
      router.replace(`/login?retour=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, userQuery.data, userQuery.error]);

  useEffect(
    () =>
      subscribeSessionSignals((signal) => {
        if (signal === 'logout') {
          queryClient.clear();
          router.replace('/login');
          return;
        }
        void queryClient.invalidateQueries({ queryKey: ['session', 'me'] });
      }),
    [queryClient, router],
  );

  if (userQuery.isPending) return <ShellSkeleton />;
  if (!userQuery.data) {
    return (
      <main id="contenu" className="grid min-h-dvh place-items-center bg-muted/30 p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Session momentanément indisponible</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre page n’a pas été perdue. Vérifiez la connexion au serveur puis réessayez.
          </p>
          <Button className="mt-5" onClick={() => void userQuery.refetch()}>
            Réessayer
          </Button>
        </div>
      </main>
    );
  }

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <AppSidebar user={userQuery.data} />
      <SidebarInset className="min-w-0 bg-muted/35">
        <AppTopbar user={userQuery.data} />
        <main id="contenu" className="w-full flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-(--content-max-width)">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh bg-muted/35">
      <div className="hidden w-64 border-r bg-background p-4 md:block">
        <Skeleton className="h-10 w-40" />
        <div className="mt-10 space-y-3">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className="h-16 border-b bg-background" />
        <div className="space-y-5 p-6">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}
