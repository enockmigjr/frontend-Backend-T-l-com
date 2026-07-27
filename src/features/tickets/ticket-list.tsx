'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { ApiError } from '@/features/auth/api-client';
import { ErrorAlert } from '@/features/auth/error-alert';
import { ticketsApi, type TicketFilters as Filters } from './api';
import { formatDate, priorityLabels, statusLabels } from './presentation';
import { ticketKeys } from './query-keys';
import { TicketFilters } from './ticket-filters';

export function TicketList({ filters, query }: Readonly<{ filters: Filters; query: string }>) {
  const result = useQuery({
    queryKey: ticketKeys.list(query),
    queryFn: () => ticketsApi.list(filters),
    placeholderData: keepPreviousData,
  });
  const page = Number(filters.page ?? 1);
  const limit = Number(filters.limit ?? 20);
  const href = (nextPage: number) => {
    const params = new URLSearchParams(query);
    params.set('page', String(nextPage));
    return { pathname: '/tickets', query: Object.fromEntries(params) };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tickets</h1>
          <p className="text-sm text-slate-600">Suivez et traitez les incidents télécom.</p>
        </div>
        <Link
          href="/tickets/new"
          className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white"
        >
          <Plus aria-hidden size={18} />
          Nouveau ticket
        </Link>
      </div>
      <TicketFilters
        values={{
          search: String(filters.search ?? ''),
          status: String(filters.status ?? ''),
          priority: String(filters.priority ?? ''),
        }}
      />
      {result.isPending ? (
        <div className="rounded-xl border bg-white p-8 text-center" role="status">
          Chargement des tickets…
        </div>
      ) : null}
      {result.error ? (
        result.error instanceof ApiError && result.error.status === 403 ? (
          <div className="rounded-xl border bg-white p-8 text-center">
            <h2 className="font-semibold">Accès refusé</h2>
            <p className="text-sm text-slate-600">Votre rôle ne permet pas de consulter cette liste.</p>
          </div>
        ) : (
          <ErrorAlert error={result.error} />
        )
      ) : null}
      {result.data ? (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Liste des tickets filtrés</caption>
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Incident</th>
                <th className="px-4 py-3">Priorité</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Mis à jour</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.data.data.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                      href={`/tickets/${ticket.id}`}
                    >
                      {ticket.ticketNumber}
                    </Link>
                  </td>
                  <td className="max-w-sm px-4 py-3">
                    <span className="line-clamp-2 font-medium">{ticket.title}</span>
                    <span className="block text-xs text-slate-500">{ticket.categoryName ?? 'Sans catégorie'}</span>
                  </td>
                  <td className="px-4 py-3">{priorityLabels[ticket.priority]}</td>
                  <td className="px-4 py-3">{statusLabels[ticket.status]}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(ticket.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.data.data.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="font-semibold">Aucun ticket trouvé</h2>
              <p className="text-sm text-slate-600">Modifiez les filtres ou créez un ticket.</p>
            </div>
          ) : null}
        </div>
      ) : null}
      {result.data && result.data.meta.totalPages > 1 ? (
        <nav aria-label="Pagination des tickets" className="flex items-center justify-between text-sm">
          <span>
            Page {result.data.meta.page} sur {result.data.meta.totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                aria-label="Page précédente"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border bg-white p-2"
                href={href(page - 1)}
              >
                <ChevronLeft aria-hidden size={18} />
              </Link>
            ) : null}
            {page < result.data.meta.totalPages ? (
              <Link
                aria-label="Page suivante"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border bg-white p-2"
                href={href(page + 1)}
              >
                <ChevronRight aria-hidden size={18} />
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-muted-foreground">
        <span>Résultats par page</span>
        {[10, 20, 50, 100].map((size) => {
          const params = new URLSearchParams(query);
          params.set('limit', String(size));
          params.set('page', '1');
          return (
            <Link
              key={size}
              href={{ pathname: '/tickets', query: Object.fromEntries(params) }}
              className={`rounded-md border px-2.5 py-1.5 ${limit === size ? 'bg-foreground text-background' : 'bg-background'}`}
            >
              {size}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
