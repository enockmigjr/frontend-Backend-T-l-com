'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { notificationDestination, notificationsApi, type NotificationItem } from '@/features/notifications/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';

export function NotificationMenu() {
  const router = useRouter();
  const client = useQueryClient();
  const queryKey = ['notifications', 'unread'] as const;
  const query = useQuery({
    queryKey,
    queryFn: notificationsApi.unread,
    refetchInterval: 60_000,
  });
  const items = query.data ?? [];
  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: (id) => {
      const previous = client.getQueryData<readonly NotificationItem[]>(queryKey);
      client.setQueryData<readonly NotificationItem[]>(queryKey, (current) =>
        current?.filter((item) => item.id !== id),
      );
      return previous;
    },
    onError: (_error, _id, previous) => {
      client.setQueryData(queryKey, previous);
      toast.add({ title: 'Notification non mise à jour', description: 'Réessayez depuis la page des notifications.' });
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={`Notifications, ${items.length} non lues`}
            className="relative"
          />
        }
      >
        <Bell aria-hidden />
        {items.length > 0 ? (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {items.length > 99 ? '99+' : items.length}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between px-2 py-2">
            <span>Notifications</span>
            <span className="font-normal text-muted-foreground">{items.length} non lue(s)</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.slice(0, 5).map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="items-start gap-3 px-2 py-3"
              onClick={() => {
                markRead.mutate(item.id);
                router.push(notificationDestination(item));
              }}
            >
              <span className="mt-1 size-2 shrink-0 rounded-full bg-blue-600" aria-hidden />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm">{item.title}</strong>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                  {item.message}
                </span>
              </span>
              <ExternalLink aria-hidden className="mt-1 size-3.5 text-muted-foreground" />
            </DropdownMenuItem>
          ))}
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Vous êtes à jour.</p>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center py-2 font-medium text-blue-700"
          onClick={() => router.push('/notifications')}
        >
          Voir toutes les notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
