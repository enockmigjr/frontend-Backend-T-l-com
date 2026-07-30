'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight } from 'lucide-react';
import { ErrorAlert } from '@/features/auth/error-alert';
import { ticketsApi } from './api';
import { actorLabel } from './actor-label';
import { formatDate } from './presentation';
import { ticketKeys } from './query-keys';

const actionLabels: Readonly<Record<string, string>> = {
  CREATED: 'Ticket créé',
  UPDATED: 'Informations modifiées',
  STATUS_CHANGED: 'Statut modifié',
  ASSIGNED: 'Ticket assigné',
  REASSIGNED: 'Ticket réassigné',
  ESCALATED: 'Ticket escaladé',
  RESOLVED: 'Ticket résolu',
  CLOSED: 'Ticket clôturé',
  REOPENED: 'Ticket rouvert',
  DELETED: 'Ticket supprimé',
};

export function TicketHistory({ ticketId }: Readonly<{ ticketId: string }>) {
  const history = useQuery({ queryKey: ticketKeys.history(ticketId), queryFn: () => ticketsApi.history(ticketId) });
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="history-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="history-title" className="flex items-center gap-2 font-semibold">
          <Activity className="size-4 text-primary" />
          Historique
        </h2>
        <span className="text-xs text-muted-foreground">{history.data?.length ?? 0} événement(s)</span>
      </div>
      {history.isPending ? (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          Chargement…
        </p>
      ) : null}
      {history.error ? (
        <div className="mt-3">
          <ErrorAlert error={history.error} />
        </div>
      ) : null}
      <ol className="mt-4 max-h-[420px] space-y-4 overflow-y-auto border-l pl-4">
        {history.data?.map((entry) => (
          <li
            key={entry.id}
            className="relative text-sm before:absolute before:-left-[21px] before:top-1 before:size-2.5 before:rounded-full before:border-2 before:border-background before:bg-primary"
          >
            <p className="font-medium">{actionLabels[entry.action] ?? humanize(entry.action)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{actorLabel(entry)}</p>
            <Change oldValue={entry.oldValue} newValue={entry.newValue} />
            <time className="mt-1 block text-xs text-muted-foreground" dateTime={entry.createdAt}>
              {formatDate(entry.createdAt)}
            </time>
          </li>
        ))}
      </ol>
      {history.data?.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucun événement enregistré.</p>
      ) : null}
    </section>
  );
}

function Change({ oldValue, newValue }: Readonly<{ oldValue?: unknown; newValue?: unknown }>) {
  const oldStatus = statusFrom(oldValue);
  const newStatus = statusFrom(newValue);
  if (!oldStatus && !newStatus) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
      <span>{humanize(oldStatus ?? '—')}</span>
      <ArrowRight className="size-3" />
      <span className="font-medium text-foreground">{humanize(newStatus ?? '—')}</span>
    </p>
  );
}
function statusFrom(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('status' in value)) return undefined;
  return typeof value.status === 'string' ? value.status : undefined;
}
function humanize(value: string): string {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}
