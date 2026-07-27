'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';
import { ErrorAlert } from '@/features/auth/error-alert';
import type { CurrentUser } from '@/lib/auth/session';
import { ticketsApi } from './api';
import { isElevated } from './permissions';
import { ticketKeys } from './query-keys';
import type { Ticket } from './schemas';

export function TicketEscalationForm({
  ticket,
  user,
  onClose,
}: Readonly<{ ticket: Ticket; user: CurrentUser; onClose: () => void }>) {
  const client = useQueryClient();
  const elevated = isElevated(user);
  const [departmentId, setDepartmentId] = useState(ticket.assignedTeamId);
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [validation, setValidation] = useState<string>();
  const departments = useQuery({ queryKey: ['departments'], queryFn: ticketsApi.departments });
  const users = useQuery({ queryKey: ['ticket-users'], queryFn: ticketsApi.users, enabled: elevated });
  const escalation = useMutation({
    mutationFn: () => ticketsApi.escalate(ticket.id, userId, departmentId, reason.trim() || undefined),
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
    escalation.mutate();
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
        <p className="text-xs text-slate-600">
          Même équipe : escalade hiérarchique. Autre équipe : escalade fonctionnelle réservée à la supervision.
        </p>
      </div>
      {escalation.error ? <ErrorAlert error={escalation.error} /> : null}
      {elevated ? (
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="escalation-department">
            Équipe cible
          </label>
          <select
            id="escalation-department"
            className="min-h-11 w-full rounded-lg border px-3 py-2"
            value={departmentId}
            onChange={(event) => {
              setDepartmentId(event.target.value);
              setUserId('');
            }}
          >
            {departments.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="escalation-user">
          Agent cible
        </label>
        {elevated ? (
          <select
            id="escalation-user"
            className="min-h-11 w-full rounded-lg border px-3 py-2"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          >
            <option value="">Sélectionner un agent</option>
            {users.data?.data
              .filter((candidate) => candidate.isActive && candidate.departmentId === departmentId)
              .map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.firstName} {candidate.lastName}
                </option>
              ))}
          </select>
        ) : (
          <input
            id="escalation-user"
            className="min-h-11 w-full rounded-lg border px-3 py-2"
            placeholder="UUID de l’agent de votre équipe"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            aria-describedby="escalation-help"
          />
        )}
        {!elevated ? (
          <p id="escalation-help" className="mt-1 text-xs text-slate-600">
            L’API ne fournit pas encore d’annuaire assignable aux agents ; saisissez l’identifiant communiqué par votre
            équipe.
          </p>
        ) : null}
        {validation ? (
          <p className="mt-1 text-sm text-red-700" role="alert">
            {validation}
          </p>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="escalation-reason">
          Raison (facultative)
        </label>
        <textarea
          id="escalation-reason"
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
          disabled={escalation.isPending}
          className="min-h-11 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {escalation.isPending ? 'Escalade…' : 'Confirmer l’escalade'}
        </button>
      </div>
    </form>
  );
}
