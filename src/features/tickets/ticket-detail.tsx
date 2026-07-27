'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, CalendarDays, Copy, Hash, Phone, Tag, UserRound, UserRoundPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/features/auth/api-client';
import { ErrorAlert } from '@/features/auth/error-alert';
import { RealtimeStatus } from '@/features/realtime/realtime-status';
import { useRealtimeSync } from '@/features/realtime/use-realtime-sync';
import { ticketsApi } from './api';
import { DiscussionPanel } from './discussion-panel';
import { formatDate } from './presentation';
import { ticketKeys } from './query-keys';
import { TicketActions } from './ticket-actions';
import { TicketPriorityBadge, TicketStatusBadge } from './ticket-badges';
import { TicketHistory } from './ticket-history';
import { TicketSlaCard } from './ticket-sla-card';

export function TicketDetail({ id }: Readonly<{ id: string }>) {
  const realtime = useRealtimeSync(id);
  const result = useQuery({ queryKey: ticketKeys.detail(id), queryFn: () => ticketsApi.get(id) });
  if (result.isPending) return <TicketDetailSkeleton />;
  if (result.error) {
    if (result.error instanceof ApiError && result.error.status === 403) {
      return (
        <Panel className="p-10 text-center">
          <h1 className="text-xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ce ticket ne relève pas de votre périmètre.</p>
        </Panel>
      );
    }
    return <ErrorAlert error={result.error} />;
  }
  const ticket = result.data;
  const assignee = ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : ticket.assigneeName;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button nativeButton={false} variant="ghost" render={<Link href="/tickets" />}>
          <ArrowLeft aria-hidden /> Tickets
        </Button>
        <RealtimeStatus {...realtime} />
      </div>
      <Panel className="overflow-hidden">
        <div className="border-b bg-muted/20 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-primary"
                  onClick={() => {
                    void navigator.clipboard.writeText(ticket.ticketNumber);
                    toast.add({ title: 'Référence copiée' });
                  }}
                >
                  {ticket.ticketNumber}
                  <Copy aria-hidden className="size-3" />
                </button>
                <TicketStatusBadge status={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
                <span className="text-xs font-medium text-muted-foreground">Sévérité {ticket.severity}</span>
              </div>
              <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-tight sm:text-3xl">{ticket.title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  Créé le {formatDate(ticket.createdAt)}
                </span>
                <span>Dernière mise à jour {formatDate(ticket.updatedAt)}</span>
              </p>
            </div>
            <TicketActions ticket={ticket} />
          </div>
        </div>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="p-5 sm:p-6" aria-labelledby="description-title">
            <h2 id="description-title" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Description de l’incident
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{ticket.description}</p>
            {ticket.resolutionSummary ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="text-sm font-semibold text-emerald-900">Résumé de résolution</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-950">
                  {ticket.resolutionSummary}
                </p>
              </div>
            ) : null}
          </section>
          <aside className="border-t bg-muted/15 p-5 lg:border-l lg:border-t-0">
            <h2 className="text-sm font-semibold">Contexte opérationnel</h2>
            <dl className="mt-4 space-y-4">
              <Info
                icon={Building2}
                label="Département demandeur"
                value={ticket.departmentName ?? ticket.department?.name}
              />
              <Info
                icon={Building2}
                label="Équipe assignée"
                value={ticket.assignedTeamName ?? ticket.assignedTeam?.name}
              />
              <Info icon={UserRound} label="Agent assigné" value={assignee ?? 'Non assigné'} />
              <Info
                icon={UserRoundPlus}
                label="Créé par"
                value={
                  ticket.creatorName ??
                  (ticket.creator ? `${ticket.creator.firstName} ${ticket.creator.lastName}` : undefined)
                }
              />
              <Info icon={UserRound} label="Client" value={ticket.customerName ?? 'Non renseigné'} />
              <Info icon={Hash} label="Compte client" value={ticket.customerAccountNumber} />
              <Info icon={Phone} label="Contact client" value={ticket.customerContact} />
              <Info icon={Tag} label="Catégorie" value={ticket.category?.name ?? ticket.categoryName} />
              <Info icon={Tag} label="Tags" value={ticket.tags} />
            </dl>
          </aside>
        </div>
      </Panel>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main>
          <DiscussionPanel ticketId={id} />
        </main>
        <aside className="space-y-4">
          <TicketSlaCard ticket={ticket} />
          <TicketHistory ticketId={id} />
        </aside>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: Readonly<{ icon: typeof Building2; label: string; value?: string | null }>) {
  return (
    <div className="grid grid-cols-[1.5rem_1fr] gap-2">
      <Icon aria-hidden className="mt-0.5 size-4 text-muted-foreground" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium">{value || 'Non renseigné'}</dd>
      </div>
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Chargement du ticket">
      <div className="h-9 w-28 animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-xl border bg-muted/40" />
      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="h-[520px] animate-pulse rounded-xl border bg-muted/40" />
        <div className="h-56 animate-pulse rounded-xl border bg-muted/40" />
      </div>
    </div>
  );
}
