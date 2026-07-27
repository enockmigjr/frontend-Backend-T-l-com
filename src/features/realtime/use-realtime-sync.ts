'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { z } from 'zod';
import { ticketKeys } from '@/features/tickets/query-keys';
import { apiRequest } from '@/lib/api/client';

const ticketPayloadSchema = z.object({ ticketId: z.string().uuid().optional(), eventId: z.string().uuid().optional() });
const notificationPayloadSchema = z.object({ id: z.string().uuid().optional() });
const ticketEvents = [
  'ticket.created',
  'ticket.assigned',
  'ticket.escalated',
  'ticket.resolved',
  'ticket.reopened',
  'ticket.status_changed',
  'ticket.deassigned',
  'ticket.sla_warning',
  'ticket.sla_breached',
] as const;
export type RealtimeConnection = 'connected' | 'reconnecting' | 'offline';

export function createEventDeduplicator(maximum = 256): (key?: string) => boolean {
  const seen = new Map<string, true>();
  return (key?: string) => {
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.set(key, true);
    if (seen.size > maximum) {
      const oldest = seen.keys().next().value;
      if (oldest) seen.delete(oldest);
    }
    return true;
  };
}

export function reconnectQueryKeys(ticketId?: string): ReadonlyArray<readonly string[]> {
  const keys: Array<readonly string[]> = [ticketKeys.all, ['notifications']];
  if (ticketId) {
    keys.push(ticketKeys.detail(ticketId), ticketKeys.comments(ticketId), ticketKeys.history(ticketId));
  }
  return keys;
}

export function useRealtimeSync(ticketId?: string) {
  const client = useQueryClient();
  const [connection, setConnection] = useState<RealtimeConnection>('offline');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>();
  useEffect(() => {
    const socket = io('/ws', { withCredentials: true, transports: ['websocket', 'polling'] });
    const acceptEvent = createEventDeduplicator();
    let hasConnected = false;
    let refreshAttempted = false;
    const onTicket = (raw: unknown) => {
      const parsed = ticketPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      if (!acceptEvent(parsed.data.eventId)) return;
      const changedId = parsed.data.ticketId;
      setLastSyncedAt(new Date());
      void client.invalidateQueries({ queryKey: ticketKeys.all });
      if (changedId && (!ticketId || changedId === ticketId))
        void Promise.all([
          client.invalidateQueries({ queryKey: ticketKeys.detail(changedId) }),
          client.invalidateQueries({ queryKey: ticketKeys.comments(changedId) }),
          client.invalidateQueries({ queryKey: ticketKeys.history(changedId) }),
        ]);
    };
    const onNotification = (raw: unknown) => {
      const parsed = notificationPayloadSchema.safeParse(raw);
      if (!parsed.success || !acceptEvent(parsed.data.id)) return;
      setLastSyncedAt(new Date());
      void client.invalidateQueries({ queryKey: ['notifications'] });
    };
    const onConnect = () => {
      refreshAttempted = false;
      setConnection('connected');
      setLastSyncedAt(new Date());
      if (hasConnected) {
        void Promise.all(reconnectQueryKeys(ticketId).map((queryKey) => client.invalidateQueries({ queryKey })));
      }
      hasConnected = true;
    };
    const onDisconnect = () => setConnection(navigator.onLine && socket.active ? 'reconnecting' : 'offline');
    const onReconnectAttempt = () => setConnection(navigator.onLine ? 'reconnecting' : 'offline');
    const onConnectError = () => {
      onReconnectAttempt();
      if (refreshAttempted || !navigator.onLine) return;
      refreshAttempted = true;
      void apiRequest('/api/auth/refresh', { method: 'POST' })
        .then(() => socket.connect())
        .catch(() => undefined);
    };
    const onOffline = () => setConnection('offline');
    const onOnline = () => {
      if (!socket.connected) setConnection('reconnecting');
    };
    ticketEvents.forEach((event) => socket.on(event, onTicket));
    socket.on('notification.created', onNotification);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      ticketEvents.forEach((event) => socket.off(event, onTicket));
      socket.off('notification.created', onNotification);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      socket.disconnect();
    };
  }, [client, ticketId]);
  return { connection, lastSyncedAt } as const;
}
