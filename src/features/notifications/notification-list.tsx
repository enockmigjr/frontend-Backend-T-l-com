'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, ChevronLeft, ChevronRight, CircleAlert, FileCheck2, Inbox, TicketCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Panel, PageHeader } from '@/components/ui/panel';
import { RealtimeStatus } from '@/features/realtime/realtime-status';
import { useRealtimeSync } from '@/features/realtime/use-realtime-sync';
import { ErrorAlert } from '@/features/auth/error-alert';
import type { ApiPage } from '@/features/auth/api-client';
import { formatDate } from '@/features/tickets/presentation';
import { notificationDestination, notificationsApi, type NotificationItem } from './api';

type View = 'all' | 'unread';

export function NotificationList() {
  const realtime = useRealtimeSync();
  const client = useQueryClient();
  const [view, setView] = useState<View>('all');
  const [page, setPage] = useState(1);
  const queryKey = ['notifications', 'page', page] as const;
  const list = useQuery({ queryKey, queryFn: () => notificationsApi.list(page) });
  const unread = useQuery({ queryKey: ['notifications', 'unread'], queryFn: notificationsApi.unread });
  const refresh = () => client.invalidateQueries({ queryKey: ['notifications'] });
  const mark = useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<ApiPage<readonly NotificationItem[]>>(queryKey);
      client.setQueryData<ApiPage<readonly NotificationItem[]>>(queryKey, (current) => markRead(current, id));
      client.setQueryData<readonly NotificationItem[]>(['notifications', 'unread'], (current) =>
        current?.filter((item) => item.id !== id),
      );
      return previous;
    },
    onError: (_error, _id, previous) => client.setQueryData(queryKey, previous),
    onSettled: refresh,
  });
  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onMutate: async () => {
      await client.cancelQueries({ queryKey: ['notifications'] });
      const previous = client.getQueryData<ApiPage<readonly NotificationItem[]>>(queryKey);
      client.setQueryData<ApiPage<readonly NotificationItem[]>>(queryKey, (current) => markRead(current));
      client.setQueryData(['notifications', 'unread'], []);
      return previous;
    },
    onError: (_error, _variables, previous) => client.setQueryData(queryKey, previous),
    onSettled: refresh,
  });
  const items = view === 'unread' ? unread.data : list.data?.data;
  const error = list.error ?? unread.error ?? mark.error ?? markAll.error;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Retrouvez les changements qui demandent votre attention."
        actions={
          <Button
            type="button"
            variant="outline"
            disabled={!unread.data?.length || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck />
            Tout marquer comme lu
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border bg-background p-1">
          <ViewButton
            selected={view === 'all'}
            onClick={() => {
              setView('all');
              setPage(1);
            }}
          >
            Toutes
          </ViewButton>
          <ViewButton selected={view === 'unread'} onClick={() => setView('unread')}>
            Non lues{' '}
            <span className="rounded-full bg-primary/10 px-1.5 text-xs text-primary">{unread.data?.length ?? 0}</span>
          </ViewButton>
        </div>
        <RealtimeStatus {...realtime} />
      </div>
      {error ? <ErrorAlert error={error} /> : null}
      {(list.isPending || unread.isPending) && !items ? <NotificationSkeleton /> : null}
      {items ? (
        <Panel className="overflow-hidden">
          <ul className="divide-y">
            {items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onRead={() => {
                  if (!item.isRead) mark.mutate(item.id);
                }}
              />
            ))}
          </ul>
          {items.length === 0 ? <EmptyNotifications unreadOnly={view === 'unread'} /> : null}
        </Panel>
      ) : null}
      {view === 'all' && list.data && list.data.meta.totalPages > 1 ? (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination des notifications">
          <span className="text-muted-foreground">
            Page {list.data.meta.page} sur {list.data.meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page <= 1}
              aria-label="Page précédente"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page >= list.data.meta.totalPages}
              aria-label="Page suivante"
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function NotificationRow({ item, onRead }: Readonly<{ item: NotificationItem; onRead: () => void }>) {
  return (
    <li className={item.isRead ? 'bg-background' : 'bg-primary/[0.035]'}>
      <Link
        href={notificationDestination(item)}
        onClick={onRead}
        className="grid grid-cols-[2.5rem_1fr_auto] gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5"
      >
        <span
          className={`grid size-10 place-items-center rounded-full ${item.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}
        >
          <NotificationIcon type={item.type} />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <strong className="truncate text-sm">{item.title}</strong>
            {!item.isRead ? (
              <span className="size-2 shrink-0 rounded-full bg-primary">
                <span className="sr-only">Non lue</span>
              </span>
            ) : null}
          </span>
          <span className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.message}</span>
        </span>
        <time className="hidden whitespace-nowrap text-xs text-muted-foreground sm:block" dateTime={item.createdAt}>
          {formatDate(item.createdAt)}
        </time>
      </Link>
    </li>
  );
}
function NotificationIcon({ type }: Readonly<{ type: string }>) {
  if (type.includes('SLA')) return <CircleAlert aria-hidden className="size-4.5" />;
  if (type.includes('REPORT')) return <FileCheck2 aria-hidden className="size-4.5" />;
  if (type.includes('TICKET')) return <TicketCheck aria-hidden className="size-4.5" />;
  return <Bell aria-hidden className="size-4.5" />;
}
function ViewButton({
  selected,
  onClick,
  children,
}: Readonly<{ selected: boolean; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium ${selected ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground'}`}
    >
      {children}
    </button>
  );
}
function EmptyNotifications({ unreadOnly }: Readonly<{ unreadOnly: boolean }>) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted">
        <Inbox className="size-5 text-muted-foreground" />
      </span>
      <h2 className="mt-4 font-semibold">{unreadOnly ? 'Vous êtes à jour' : 'Aucune notification'}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {unreadOnly ? 'Toutes les notifications ont été consultées.' : 'Les événements importants apparaîtront ici.'}
      </p>
    </div>
  );
}
function NotificationSkeleton() {
  return (
    <Panel className="space-y-2 p-4" role="status" aria-label="Chargement des notifications">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg bg-muted/50" />
      ))}
    </Panel>
  );
}
function markRead(
  page: ApiPage<readonly NotificationItem[]> | undefined,
  id?: string,
): ApiPage<readonly NotificationItem[]> | undefined {
  if (!page) return page;
  const readAt = new Date().toISOString();
  return {
    ...page,
    data: page.data.map((item) => (!item.isRead && (!id || item.id === id) ? { ...item, isRead: true, readAt } : item)),
  };
}
