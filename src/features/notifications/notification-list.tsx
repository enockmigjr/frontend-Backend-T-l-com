'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useRealtimeSync } from '@/features/realtime/use-realtime-sync';
import { RealtimeStatus } from '@/features/realtime/realtime-status';
import { ErrorAlert } from '@/features/auth/error-alert';
import type { ApiPage } from '@/features/auth/api-client';
import { formatDate } from '@/features/tickets/presentation';
import { notificationsApi, type NotificationItem } from './api';

export function NotificationList() {
  const realtime = useRealtimeSync();
  const client = useQueryClient();
  const queryKey = ['notifications', 1] as const;
  const result = useQuery({ queryKey, queryFn: () => notificationsApi.list(1) });
  const refresh = () => client.invalidateQueries({ queryKey: ['notifications'] });
  const mark = useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<ApiPage<readonly NotificationItem[]>>(queryKey);
      client.setQueryData<ApiPage<readonly NotificationItem[]>>(queryKey, (current) => markRead(current, id));
      return previous;
    },
    onError: (_error, _id, previous) => client.setQueryData(queryKey, previous),
    onSettled: refresh,
  });
  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onMutate: async () => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<ApiPage<readonly NotificationItem[]>>(queryKey);
      client.setQueryData<ApiPage<readonly NotificationItem[]>>(queryKey, (current) => markRead(current));
      return previous;
    },
    onError: (_error, _variables, previous) => client.setQueryData(queryKey, previous),
    onSettled: refresh,
  });
  const unread = result.data?.data.filter((item) => !item.isRead).length ?? 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bell aria-hidden size={24} />
            Notifications
          </h1>
          <p className="text-sm text-slate-600">
            {unread} notification{unread > 1 ? 's' : ''} non lue{unread > 1 ? 's' : ''}
          </p>
          <RealtimeStatus {...realtime} />
        </div>
        <button
          disabled={unread === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
          className="flex min-h-11 items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          <CheckCheck aria-hidden size={18} />
          Tout marquer comme lu
        </button>
      </header>
      {result.isPending ? (
        <div className="rounded-xl border bg-white p-8 text-center" role="status">
          Chargement des notifications…
        </div>
      ) : null}
      {result.error || mark.error || markAll.error ? (
        <ErrorAlert error={result.error ?? mark.error ?? markAll.error} />
      ) : null}
      {result.data ? (
        <ul className="divide-y rounded-xl border bg-white">
          {result.data.data.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              onRead={() => {
                if (!item.isRead) mark.mutate(item.id);
              }}
            />
          ))}
        </ul>
      ) : null}
      {result.data?.data.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <h2 className="font-semibold">Aucune notification</h2>
          <p className="text-sm text-slate-600">Les événements importants apparaîtront ici.</p>
        </div>
      ) : null}
    </div>
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

function NotificationRow({ item, onRead }: Readonly<{ item: NotificationItem; onRead: () => void }>) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold">{item.title}</h2>
        {!item.isRead ? (
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600">
            <span className="sr-only">Non lue</span>
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-slate-700">{item.message}</p>
      <time className="mt-2 block text-xs text-slate-500" dateTime={item.createdAt}>
        {formatDate(item.createdAt)}
      </time>
    </>
  );
  const className = `block px-5 py-4 hover:bg-slate-50 ${item.isRead ? '' : 'bg-blue-50/60'}`;
  return (
    <li>
      {item.referenceType === 'ticket' && item.referenceId ? (
        <Link href={`/tickets/${item.referenceId}`} onClick={onRead} className={className}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onRead} className={`${className} min-h-11 w-full text-left`}>
          {content}
        </button>
      )}
    </li>
  );
}
