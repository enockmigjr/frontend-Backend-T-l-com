'use client';

import { useQuery } from '@tanstack/react-query';
import { ErrorAlert } from '@/features/auth/error-alert';
import { ticketsApi } from './api';
import { formatDate } from './presentation';
import { ticketKeys } from './query-keys';

export function TicketHistory({ ticketId }: Readonly<{ ticketId: string }>) {
  const history = useQuery({ queryKey: ticketKeys.history(ticketId), queryFn: () => ticketsApi.history(ticketId) });
  return (
    <section className="rounded-xl border bg-white p-4" aria-labelledby="history-title">
      <h2 id="history-title" className="font-semibold">
        Historique
      </h2>
      {history.isPending ? (
        <p className="mt-3 text-sm" role="status">
          Chargement…
        </p>
      ) : null}
      {history.error ? (
        <div className="mt-3">
          <ErrorAlert error={history.error} />
        </div>
      ) : null}
      <ol className="mt-3 space-y-3 border-l pl-4">
        {history.data?.map((entry) => (
          <li
            key={entry.id}
            className="relative text-sm before:absolute before:-left-[21px] before:top-1 before:h-2.5 before:w-2.5 before:rounded-full before:bg-blue-600"
          >
            <p className="font-medium">{entry.action.replaceAll('_', ' ')}</p>
            <time className="text-xs text-slate-500" dateTime={entry.createdAt}>
              {formatDate(entry.createdAt)}
            </time>
          </li>
        ))}
      </ol>
      {history.data?.length === 0 ? <p className="mt-3 text-sm text-slate-600">Aucun événement.</p> : null}
    </section>
  );
}
