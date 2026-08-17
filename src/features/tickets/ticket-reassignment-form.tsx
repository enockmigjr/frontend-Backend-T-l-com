'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';
import { ErrorAlert } from '@/features/auth/error-alert';
import { ticketsApi } from './api';
import { ticketKeys } from './query-keys';
import type { Ticket } from './schemas';

export function TicketReassignmentForm({ ticket, onClose }: Readonly<{ ticket: Ticket; onClose: () => void }>) {
  const client = useQueryClient();
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [validation, setValidation] = useState<string>();
  const mutation = useMutation({
    mutationFn: () => ticketsApi.assign(ticket.id, 'reassign', userId, reason.trim() || undefined),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ticketKeys.detail(ticket.id) }),
        client.invalidateQueries({ queryKey: ticketKeys.all }),
      ]);
      onClose();
    },
  });
  function submit() {
    if (!z.string().uuid().safeParse(userId).success) {
      setValidation("L'identifiant de l'agent cible doit être un UUID valide.");
      return;
    }
    setValidation(undefined);
    mutation.mutate();
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div>
        <p className="text-xs text-muted-foreground">La cible doit être un agent actif de l’équipe assignée.</p>
      </div>
      {mutation.error ? <ErrorAlert error={mutation.error} /> : null}
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="reassign-user">
          Identifiant de l’agent cible
        </label>
        <input
          id="reassign-user"
          className="min-h-11 w-full rounded-lg border px-3 py-2"
          placeholder="UUID"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
        />
        {validation ? (
          <p className="mt-1 text-sm text-red-700 dark:text-red-300" role="alert">
            {validation}
          </p>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="reassign-reason">
          Raison (facultative)
        </label>
        <textarea
          id="reassign-reason"
          rows={2}
          className="w-full rounded-lg border px-3 py-2"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="min-h-11 rounded-lg border px-3 py-2 text-sm" onClick={onClose}>
          Annuler
        </button>
        <button
          disabled={mutation.isPending}
          className="min-h-11 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {mutation.isPending ? 'Réassignation…' : 'Confirmer'}
        </button>
      </div>
    </form>
  );
}
