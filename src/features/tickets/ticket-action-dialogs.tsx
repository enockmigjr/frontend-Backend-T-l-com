'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import type { CurrentUser } from '@/lib/auth/session';
import type { Ticket } from './schemas';
import { TicketDeletePanel } from './ticket-delete-panel';
import { TicketEditForm } from './ticket-edit-form';
import { TicketEscalationForm } from './ticket-escalation-form';
import { TicketReassignmentForm } from './ticket-reassignment-form';
import type { DialogAction } from './ticket-transition-dialog';

export type TicketActionPanel = 'edit' | 'escalate' | 'reassign' | 'delete' | 'assign';

export function Action({ label, onClick }: Readonly<{ label: string; onClick: () => void }>) {
  return <DropdownMenuItem onClick={onClick}>{label}</DropdownMenuItem>;
}

export function primaryAction(
  ticket: Ticket,
  canOperate: boolean,
): { label: string; action: string; dialog?: DialogAction; icon: 'play' | 'check' } | null {
  if (!canOperate) return null;
  if (['ASSIGNED', 'REOPENED', 'PENDING_CUSTOMER', 'PENDING_THIRD_PARTY'].includes(ticket.status)) {
    return { label: ticket.status.startsWith('PENDING') ? 'Reprendre' : 'Démarrer', action: 'start', icon: 'play' };
  }
  if (ticket.status === 'IN_PROGRESS')
    return { label: 'Résoudre', action: 'resolve', dialog: 'resolve', icon: 'check' };
  if (ticket.status === 'RESOLVED') return { label: 'Clôturer', action: 'close', dialog: 'close', icon: 'check' };
  return null;
}

export function PanelDialog({
  panel,
  setPanel,
  ticket,
  user,
  children,
}: Readonly<{
  panel?: TicketActionPanel;
  setPanel: (panel?: TicketActionPanel) => void;
  ticket: Ticket;
  user?: CurrentUser;
  children: React.ReactNode;
}>) {
  const title =
    panel === 'edit'
      ? 'Modifier le ticket'
      : panel === 'escalate'
        ? 'Escalader le ticket'
        : panel === 'delete'
          ? 'Supprimer le ticket'
          : 'Modifier l’affectation';
  return (
    <ResourceDialog
      open={Boolean(panel)}
      onOpenChange={(open) => {
        if (!open) setPanel();
      }}
      title={title}
      size={panel === 'edit' ? 'large' : 'default'}
    >
      {panel === 'edit' && user ? <TicketEditForm ticket={ticket} user={user} onClose={() => setPanel()} /> : null}
      {panel === 'escalate' && user ? (
        <TicketEscalationForm ticket={ticket} user={user} onClose={() => setPanel()} />
      ) : null}
      {panel === 'reassign' ? <TicketReassignmentForm ticket={ticket} onClose={() => setPanel()} /> : null}
      {panel === 'delete' ? <TicketDeletePanel ticketId={ticket.id} onClose={() => setPanel()} /> : null}
      {children}
    </ResourceDialog>
  );
}

export function AssignmentForm({
  users,
  busy,
  onAssign,
}: Readonly<{
  users: readonly { id: string; firstName: string; lastName: string; isActive: boolean }[];
  busy: boolean;
  onAssign: (id: string) => void;
}>) {
  const [id, setId] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (id) onAssign(id);
      }}
      className="space-y-4"
    >
      <label className="grid gap-1.5 text-sm font-medium">
        Agent
        <select
          className="h-10 rounded-lg border bg-background px-3"
          value={id}
          onChange={(event) => setId(event.target.value)}
        >
          <option value="">Sélectionner un agent</option>
          {users
            .filter((item) => item.isActive)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.firstName} {item.lastName}
              </option>
            ))}
        </select>
      </label>
      <Button type="submit" className="w-full" disabled={!id || busy}>
        Confirmer l’affectation
      </Button>
    </form>
  );
}
