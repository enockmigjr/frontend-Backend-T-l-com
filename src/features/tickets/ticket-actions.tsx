'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MoreHorizontal, Play, UserRoundCheck } from 'lucide-react';
import { useState } from 'react';
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
import { ErrorAlert } from '@/features/auth/error-alert';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { ticketsApi } from './api';
import { Action, AssignmentForm, PanelDialog, primaryAction, type TicketActionPanel } from './ticket-action-dialogs';
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
import { TicketTransitionDialog, type DialogAction } from './ticket-transition-dialog';

export function TicketActions({ ticket }: Readonly<{ ticket: Ticket }>) {
  const client = useQueryClient();
  const user = useCurrentUser();
  const [dialog, setDialog] = useState<DialogAction>();
  const [text, setText] = useState('');
  const [panel, setPanel] = useState<TicketActionPanel>();
  const elevated = isElevated(user.data);
  const assigned = isAssigned(ticket, user.data);
  const canOperate = mayOperate(ticket, user.data);
  const users = useQuery({ queryKey: ['ticket-users'], queryFn: ticketsApi.users, enabled: elevated });
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ticketKeys.detail(ticket.id) }),
      client.invalidateQueries({ queryKey: ticketKeys.history(ticket.id) }),
      client.invalidateQueries({ queryKey: ticketKeys.comments(ticket.id) }),
      client.invalidateQueries({ queryKey: ticketKeys.all }),
      client.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  const transition = useMutation({
    mutationFn: ({ action, body }: { action: string; body?: object }) => ticketsApi.transition(ticket.id, action, body),
    onSuccess: async () => {
      setDialog(undefined);
      setText('');
      await refresh();
      toast.add({ title: 'Ticket mis à jour' });
    },
  });
  const assignment = useMutation({
    mutationFn: ({ action, userId }: { action: 'assign' | 'reassign'; userId: string }) =>
      ticketsApi.assign(ticket.id, action, userId),
    onSuccess: async () => {
      setPanel(undefined);
      await refresh();
      toast.add({ title: ticket.assignedTo ? 'Ticket réassigné' : 'Ticket assigné' });
    },
  });
  const reply = useMutation({
    mutationFn: ({ content }: { content: string }) => ticketsApi.publicReply(ticket.id, content),
    onSuccess: async () => {
      setDialog(undefined);
      setText('');
      await refresh();
      toast.add({ title: 'Réponse envoyée au demandeur' });
    },
  });

  function submitDialog() {
    if (!dialog) return;
    if (dialog === 'resolve') transition.mutate({ action: 'resolve', body: { resolutionSummary: text } });
    else if (dialog === 'public-reply') reply.mutate({ content: text });
    else if (dialog === 'reopen') transition.mutate({ action: 'reopen', body: { reason: text } });
    else transition.mutate({ action: dialog, body: { reason: text || undefined } });
  }

  const primary = primaryAction(ticket, canOperate);
  const error = transition.error ?? assignment.error ?? reply.error;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {error ? (
        <div className="w-full">
          <ErrorAlert error={error} />
        </div>
      ) : null}
      {primary ? (
        <Button
          type="button"
          onClick={() => (primary.dialog ? setDialog(primary.dialog) : transition.mutate({ action: primary.action }))}
          disabled={transition.isPending}
        >
          {primary.icon === 'play' ? <Play aria-hidden /> : <CheckCircle2 aria-hidden />}
          {primary.label}
        </Button>
      ) : null}
      {!ticket.assignedTo &&
      ticket.status === 'NEW' &&
      user.data?.id &&
      user.data.departmentId === ticket.assignedTeamId ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => assignment.mutate({ action: 'assign', userId: user.data.id })}
        >
          <UserRoundCheck aria-hidden /> Me l’assigner
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" variant="outline" aria-label="Autres actions" />}>
          <MoreHorizontal aria-hidden /> Actions
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Gestion du ticket</DropdownMenuLabel>
            {canEditTicket(ticket, user.data) ? <Action label="Modifier" onClick={() => setPanel('edit')} /> : null}
            {elevated ? (
              <Action label={ticket.assignedTo ? 'Réassigner' : 'Assigner'} onClick={() => setPanel('assign')} />
            ) : null}
            {assigned && !elevated ? <Action label="Réassigner" onClick={() => setPanel('reassign')} /> : null}
            {canOperate ? <Action label="Escalader" onClick={() => setPanel('escalate')} /> : null}
            {ticket.supportIntegrationId ? (
              <Action label="Répondre au demandeur" onClick={() => setDialog('public-reply')} />
            ) : null}
          </DropdownMenuGroup>
          {canOperate ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Cycle de vie</DropdownMenuLabel>
                {ticket.status === 'IN_PROGRESS' ? (
                  <Action label="Mettre en attente client" onClick={() => setDialog('pending-customer')} />
                ) : null}
                {ticket.status === 'IN_PROGRESS' ? (
                  <Action label="Mettre en attente tiers" onClick={() => setDialog('pending-third-party')} />
                ) : null}
                {ticket.status === 'RESOLVED' ? <Action label="Clôturer" onClick={() => setDialog('close')} /> : null}
                {canReopenTicket(ticket, user.data) ? (
                  <Action label="Rouvrir" onClick={() => setDialog('reopen')} />
                ) : null}
              </DropdownMenuGroup>
            </>
          ) : null}
          {canDeleteTicket(user.data) ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setPanel('delete')}>
                Supprimer le ticket
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <PanelDialog panel={panel} setPanel={setPanel} ticket={ticket} user={user.data}>
        {panel === 'assign' ? (
          <AssignmentForm
            users={users.data?.data ?? []}
            busy={assignment.isPending}
            error={assignment.error}
            onAssign={(id) => assignment.mutate({ action: ticket.assignedTo ? 'reassign' : 'assign', userId: id })}
          />
        ) : null}
      </PanelDialog>
      {dialog ? (
        <TicketTransitionDialog
          action={dialog}
          text={text}
          busy={transition.isPending || reply.isPending}
          error={transition.error ?? reply.error}
          onText={setText}
          onCancel={() => setDialog(undefined)}
          onConfirm={submitDialog}
        />
      ) : null}
    </div>
  );
}
