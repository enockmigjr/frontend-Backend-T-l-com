'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Panel, PageHeader } from '@/components/ui/panel';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/features/auth/api-client';
import { ErrorAlert } from '@/features/auth/error-alert';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { ticketsApi, type TicketFilters as Filters } from './api';
import { ticketKeys } from './query-keys';
import { TicketFilters } from './ticket-filters';
import { PageSize, PaginationButton, TicketListSkeleton, TicketRow } from './ticket-list-components';

export function TicketList({ filters, query }: Readonly<{ filters: Filters; query: string }>) {
  const client = useQueryClient();
  const user = useCurrentUser();
  const result = useQuery({
    queryKey: ticketKeys.list(query),
    queryFn: () => ticketsApi.list(filters),
    placeholderData: keepPreviousData,
  });
  const departments = useQuery({ queryKey: ['departments'], queryFn: ticketsApi.departments });
  const start = useMutation({
    mutationFn: (id: string) => ticketsApi.transition(id, 'start'),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ticketKeys.all });
      toast.add({ title: 'Traitement démarré' });
    },
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
      <PageHeader
        eyebrow="Incidents"
        title="Tickets"
        description="Pilotez les incidents, les affectations et les échéances SLA."
        actions={
          <Button nativeButton={false} render={<Link href="/tickets/new" />}>
            <Plus aria-hidden />
            Nouveau ticket
          </Button>
        }
      />
      <TicketFilters
        values={{
          search: String(filters.search ?? ''),
          status: String(filters.status ?? ''),
          priority: String(filters.priority ?? ''),
        }}
      />
      {result.isPending ? <TicketListSkeleton /> : null}
      {result.error ? (
        result.error instanceof ApiError && result.error.status === 403 ? (
          <Panel className="p-8 text-center">
            <h2 className="font-semibold">Accès refusé</h2>
            <p className="text-sm text-muted-foreground">Votre rôle ne permet pas de consulter cette liste.</p>
          </Panel>
        ) : (
          <ErrorAlert error={result.error} />
        )
      ) : null}
      {start.error ? <ErrorAlert error={start.error} /> : null}
      {result.data ? (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <caption className="sr-only">Liste des tickets filtrés</caption>
              <thead className="sticky top-0 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Affectation</th>
                  <th className="px-4 py-3">SLA résolution</th>
                  <th className="px-4 py-3">Mise à jour</th>
                  <th className="w-12 px-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.data.data.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    teamName={
                      ticket.assignedTeamName ??
                      departments.data?.find((department) => department.id === ticket.assignedTeamId)?.name
                    }
                    canStart={Boolean(
                      user.data &&
                      (user.data.id === ticket.assignedTo ||
                        ['SUPERVISOR', 'ADMINISTRATOR'].includes(user.data.role)) &&
                      ['ASSIGNED', 'REOPENED', 'PENDING_CUSTOMER', 'PENDING_THIRD_PARTY'].includes(ticket.status),
                    )}
                    onStart={() => start.mutate(ticket.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {result.data.data.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="font-semibold">Aucun ticket trouvé</h2>
              <p className="mt-1 text-sm text-muted-foreground">Modifiez les filtres ou créez un nouveau ticket.</p>
            </div>
          ) : null}
        </Panel>
      ) : null}
      {result.data ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            {result.data.meta.total} ticket(s) · page {result.data.meta.page} sur {result.data.meta.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <PageSize query={query} current={limit} />
            <PaginationButton enabled={page > 1} href={href(page - 1)} label="Page précédente">
              <ChevronLeft />
            </PaginationButton>
            <PaginationButton enabled={page < result.data.meta.totalPages} href={href(page + 1)} label="Page suivante">
              <ChevronRight />
            </PaginationButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
