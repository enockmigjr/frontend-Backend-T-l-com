'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { ErrorAlert } from '@/features/auth/error-alert';
import { ticketsApi } from './api';
import {
  canDeleteTicket,
  canEditTicket,
  canOperate as mayOperate,
  canReopenTicket,
  isAssigned,
  isElevated,
} from './permissions';
import { ticketKeys } from './query-keys';
import type { Ticket } from './schemas';
import { TicketEditForm } from './ticket-edit-form';
import { TicketEscalationForm } from './ticket-escalation-form';
import { TicketReassignmentForm } from './ticket-reassignment-form';
import { TicketTransitionDialog, type DialogAction } from './ticket-transition-dialog';
import { TicketDeletePanel } from './ticket-delete-panel';

export function TicketActions({ ticket }: Readonly<{ ticket: Ticket }>) {
  const client = useQueryClient();
  const user = useCurrentUser();
  const [dialog, setDialog] = useState<DialogAction>();
  const [text, setText] = useState('');
  const [panel, setPanel] = useState<'edit' | 'escalate' | 'reassign' | 'delete'>();
  const elevated = isElevated(user.data);
  const assigned = isAssigned(ticket, user.data);
  const currentUserId = user.data?.id;
  const canOperate = mayOperate(ticket, user.data);
  const users = useQuery({ queryKey: ['ticket-users'], queryFn: ticketsApi.users, enabled: elevated });
  const mutation = useMutation({
    mutationFn: ({ action, body }: { action: string; body?: object }) => ticketsApi.transition(ticket.id, action, body),
    onSuccess: async () => {
      setDialog(undefined);
      setText('');
      await Promise.all([
        client.invalidateQueries({ queryKey: ticketKeys.detail(ticket.id) }),
        client.invalidateQueries({ queryKey: ticketKeys.all }),
      ]);
    },
  });
  const assignment = useMutation({
    mutationFn: ({ action, userId }: { action: 'assign' | 'reassign'; userId: string }) =>
      ticketsApi.assign(ticket.id, action, userId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ticketKeys.detail(ticket.id) }),
        client.invalidateQueries({ queryKey: ticketKeys.all }),
      ]);
    },
  });
  const button =
    'min-h-11 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50';

  function submitDialog() {
    if (!dialog) return;
    if (dialog === 'resolve') mutation.mutate({ action: 'resolve', body: { resolutionSummary: text } });
    else if (dialog === 'reopen') mutation.mutate({ action: 'reopen', body: { reason: text } });
    else mutation.mutate({ action: dialog, body: { reason: text || undefined } });
  }

  return (
    <section className="rounded-xl border bg-slate-50 p-4" aria-labelledby="actions-title">
      <h2 id="actions-title" className="mb-3 font-semibold">
        Actions disponibles
      </h2>
      {mutation.error || assignment.error ? (
        <div className="mb-3">
          <ErrorAlert error={mutation.error ?? assignment.error} />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {canEditTicket(ticket, user.data) ? (
          <button className={button} onClick={() => setPanel('edit')}>
            Modifier
          </button>
        ) : null}
        {!ticket.assignedTo &&
        ticket.status === 'NEW' &&
        currentUserId &&
        user.data?.departmentId === ticket.assignedTeamId ? (
          <button className={button} onClick={() => assignment.mutate({ action: 'assign', userId: currentUserId })}>
            Me l’assigner
          </button>
        ) : null}
        {canOperate && ['ASSIGNED', 'REOPENED'].includes(ticket.status) ? (
          <button className={button} onClick={() => mutation.mutate({ action: 'start' })}>
            Démarrer le traitement
          </button>
        ) : null}
        {canOperate && ticket.status === 'IN_PROGRESS' ? (
          <>
            <button className={button} onClick={() => setDialog('pending-customer')}>
              Attente client
            </button>
            <button className={button} onClick={() => setDialog('pending-third-party')}>
              Attente tiers
            </button>
            <button className={button} onClick={() => setDialog('resolve')}>
              Résoudre
            </button>
          </>
        ) : null}
        {canOperate && ['PENDING_CUSTOMER', 'PENDING_THIRD_PARTY'].includes(ticket.status) ? (
          <button className={button} onClick={() => mutation.mutate({ action: 'start' })}>
            Reprendre
          </button>
        ) : null}
        {canOperate && ticket.status === 'RESOLVED' ? (
          <button className={button} onClick={() => mutation.mutate({ action: 'close' })}>
            Clôturer
          </button>
        ) : null}
        {canReopenTicket(ticket, user.data) ? (
          <button className={button} onClick={() => setDialog('reopen')}>
            Réouvrir
          </button>
        ) : null}
        {canOperate ? (
          <button className={button} onClick={() => setPanel('escalate')}>
            Escalader
          </button>
        ) : null}
        {assigned && !elevated ? (
          <button className={button} onClick={() => setPanel('reassign')}>
            Réassigner
          </button>
        ) : null}
        {canDeleteTicket(user.data) ? (
          <button
            className="min-h-11 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-800"
            onClick={() => setPanel('delete')}
          >
            Supprimer
          </button>
        ) : null}
        {elevated ? (
          <label className="flex items-center gap-2 text-sm">
            <span>{ticket.assignedTo ? 'Réassigner' : 'Assigner'}</span>
            <select
              className="min-h-11 rounded-lg border bg-white px-3 py-2"
              defaultValue=""
              disabled={users.isPending || assignment.isPending}
              onChange={(event) => {
                if (event.target.value)
                  assignment.mutate({ action: ticket.assignedTo ? 'reassign' : 'assign', userId: event.target.value });
              }}
            >
              <option value="">Choisir un agent</option>
              {users.data?.data
                .filter((candidate) => candidate.isActive && candidate.departmentId === ticket.assignedTeamId)
                .map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.firstName} {candidate.lastName}
                  </option>
                ))}
            </select>
          </label>
        ) : null}
        {!canOperate && ticket.assignedTo ? (
          <p className="text-sm text-slate-600">
            Les transitions sont réservées à l’agent assigné ou à la supervision.
          </p>
        ) : null}
      </div>
      {panel === 'edit' && user.data ? (
        <TicketEditForm ticket={ticket} user={user.data} onClose={() => setPanel(undefined)} />
      ) : null}
      {panel === 'escalate' && user.data ? (
        <TicketEscalationForm ticket={ticket} user={user.data} onClose={() => setPanel(undefined)} />
      ) : null}
      {panel === 'reassign' ? <TicketReassignmentForm ticket={ticket} onClose={() => setPanel(undefined)} /> : null}
      {panel === 'delete' ? <TicketDeletePanel ticketId={ticket.id} onClose={() => setPanel(undefined)} /> : null}
      {dialog ? (
        <TicketTransitionDialog
          action={dialog}
          text={text}
          busy={mutation.isPending}
          onText={setText}
          onCancel={() => setDialog(undefined)}
          onConfirm={submitDialog}
        />
      ) : null}
    </section>
  );
}
