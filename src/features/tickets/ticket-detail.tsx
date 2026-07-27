'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { ApiError } from '@/features/auth/api-client';
import { ErrorAlert } from '@/features/auth/error-alert';
import { useRealtimeSync } from '@/features/realtime/use-realtime-sync';
import { RealtimeStatus } from '@/features/realtime/realtime-status';
import { AttachmentsPanel } from './attachments-panel';
import { ticketsApi } from './api';
import { DiscussionPanel } from './discussion-panel';
import { formatDate, priorityLabels, statusLabels } from './presentation';
import { ticketKeys } from './query-keys';
import { TicketActions } from './ticket-actions';
import { TicketHistory } from './ticket-history';

export function TicketDetail({ id }: Readonly<{ id: string }>) {
  const realtime = useRealtimeSync(id);
  const result = useQuery({ queryKey: ticketKeys.detail(id), queryFn: () => ticketsApi.get(id) });
  if (result.isPending)
    return (
      <div className="rounded-xl border bg-white p-10 text-center" role="status">
        Chargement du ticket…
      </div>
    );
  if (result.error) {
    if (result.error instanceof ApiError && result.error.status === 403)
      return (
        <div className="rounded-xl border bg-white p-10 text-center">
          <h1 className="text-xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-sm text-slate-600">Ce ticket ne relève pas de votre périmètre.</p>
          {result.error.correlationId ? (
            <p className="mt-2 font-mono text-xs">Référence : {result.error.correlationId}</p>
          ) : null}
        </div>
      );
    return <ErrorAlert error={result.error} />;
  }
  const ticket = result.data;
  return (
    <div className="space-y-5">
      <Link href="/tickets" className="inline-flex items-center gap-2 text-sm text-blue-700 hover:underline">
        <ArrowLeft aria-hidden size={17} />
        Retour aux tickets
      </Link>
      <header className="rounded-xl border bg-white p-5">
        <div className="mb-3 flex justify-end">
          <RealtimeStatus {...realtime} />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-blue-700">{ticket.ticketNumber}</p>
            <h1 className="mt-1 text-2xl font-bold">{ticket.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Créé le {formatDate(ticket.createdAt)} · mis à jour le {formatDate(ticket.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{statusLabels[ticket.status]}</span>
            <span
              className={`rounded-full px-3 py-1 text-sm ${ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}
            >
              {priorityLabels[ticket.priority]} · {ticket.severity}
            </span>
          </div>
        </div>
      </header>
      <TicketActions ticket={ticket} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <main className="space-y-5">
          <section className="rounded-xl border bg-white p-5" aria-labelledby="description-title">
            <h2 id="description-title" className="font-semibold">
              Description
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{ticket.description}</p>
            {ticket.resolutionSummary ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="font-semibold text-emerald-900">Résolution</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm">{ticket.resolutionSummary}</p>
              </div>
            ) : null}
          </section>
          <DiscussionPanel ticketId={id} />
        </main>
        <aside className="space-y-5">
          <section className="rounded-xl border bg-white p-4">
            <h2 className="font-semibold">Informations</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <Info label="Catégorie" value={ticket.category?.name ?? ticket.categoryName ?? '—'} />
              <Info label="Département" value={ticket.department?.name ?? '—'} />
              <Info label="Équipe" value={ticket.assignedTeam?.name ?? '—'} />
              <Info
                label="Agent"
                value={
                  ticket.assignee
                    ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                    : (ticket.assigneeName ?? 'Non assigné')
                }
              />
              <Info label="Client" value={ticket.customerName ?? '—'} />
            </dl>
          </section>
          <section className={`rounded-xl border p-4 ${ticket.slaBreached ? 'border-red-300 bg-red-50' : 'bg-white'}`}>
            <h2 className="flex items-center gap-2 font-semibold">
              {ticket.slaBreached ? <ShieldAlert aria-hidden size={18} /> : <Clock aria-hidden size={18} />}SLA
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <Info
                label="Première réponse"
                value={ticket.firstResponseDueAt ? formatDate(ticket.firstResponseDueAt) : '—'}
              />
              <Info
                label="Résolution attendue"
                value={ticket.resolutionDueAt ? formatDate(ticket.resolutionDueAt) : '—'}
              />
            </dl>
          </section>
          <AttachmentsPanel ticketId={id} />
          <TicketHistory ticketId={id} />
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
