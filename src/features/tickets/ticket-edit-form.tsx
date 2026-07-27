'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ErrorAlert } from '@/features/auth/error-alert';
import type { CurrentUser } from '@/lib/auth/session';
import { ticketsApi } from './api';
import { editableFields } from './permissions';
import { ticketKeys } from './query-keys';
import type { Ticket } from './schemas';

export function TicketEditForm({
  ticket,
  user,
  onClose,
}: Readonly<{ ticket: Ticket; user: CurrentUser; onClose: () => void }>) {
  const client = useQueryClient();
  const allowed = editableFields(ticket, user);
  const [values, setValues] = useState({
    title: ticket.title,
    description: ticket.description,
    categoryId: ticket.categoryId,
    priority: ticket.priority,
    severity: ticket.severity,
    tags: ticket.tags ?? '',
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: ticketsApi.categories,
    enabled: allowed.has('categoryId'),
  });
  const changes = changedValues(ticket, values, allowed);
  const update = useMutation({
    mutationFn: () => ticketsApi.update(ticket.id, changes),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ticketKeys.detail(ticket.id) }),
        client.invalidateQueries({ queryKey: ticketKeys.all }),
      ]);
      onClose();
    },
  });
  const set = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const field = 'min-h-11 w-full rounded-lg border px-3 py-2';
  return (
    <form
      className="mt-4 space-y-4 rounded-lg border bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate();
      }}
    >
      <h3 className="font-semibold">Modifier le ticket</h3>
      {update.error ? <ErrorAlert error={update.error} /> : null}
      {allowed.has('title') ? (
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="edit-title">
            Titre
          </label>
          <input
            id="edit-title"
            required
            maxLength={255}
            className={field}
            value={values.title}
            onChange={(event) => set('title', event.target.value)}
          />
        </div>
      ) : null}
      {allowed.has('description') ? (
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="edit-description">
            Description
          </label>
          <textarea
            id="edit-description"
            required
            rows={4}
            className={field}
            value={values.description}
            onChange={(event) => set('description', event.target.value)}
          />
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {allowed.has('categoryId') ? (
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="edit-category">
              Catégorie
            </label>
            <select
              id="edit-category"
              className={field}
              value={values.categoryId}
              onChange={(event) => set('categoryId', event.target.value)}
            >
              {categories.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {allowed.has('priority') ? (
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="edit-priority">
              Priorité
            </label>
            <select
              id="edit-priority"
              className={field}
              value={values.priority}
              onChange={(event) => set('priority', event.target.value)}
            >
              <option value="LOW">Basse</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Haute</option>
              <option value="CRITICAL">Critique</option>
            </select>
          </div>
        ) : null}
        {allowed.has('severity') ? (
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="edit-severity">
              Sévérité
            </label>
            <select
              id="edit-severity"
              className={field}
              value={values.severity}
              onChange={(event) => set('severity', event.target.value)}
            >
              {['S1', 'S2', 'S3', 'S4'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        ) : null}
        {allowed.has('tags') ? (
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="edit-tags">
              Tags
            </label>
            <input
              id="edit-tags"
              className={field}
              value={values.tags}
              onChange={(event) => set('tags', event.target.value)}
            />
          </div>
        ) : null}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="min-h-11 rounded-lg border px-3 py-2 text-sm" onClick={onClose}>
          Annuler
        </button>
        <button
          disabled={update.isPending || Object.keys(changes).length === 0}
          className="min-h-11 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

function changedValues(
  ticket: Ticket,
  values: Readonly<{
    title: string;
    description: string;
    categoryId: string;
    priority: string;
    severity: string;
    tags: string;
  }>,
  allowed: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  const changed: Record<string, string> = {};
  if (allowed.has('title') && values.title !== ticket.title) changed.title = values.title;
  if (allowed.has('description') && values.description !== ticket.description) changed.description = values.description;
  if (allowed.has('categoryId') && values.categoryId !== ticket.categoryId) changed.categoryId = values.categoryId;
  if (allowed.has('priority') && values.priority !== ticket.priority) changed.priority = values.priority;
  if (allowed.has('severity') && values.severity !== ticket.severity) changed.severity = values.severity;
  if (allowed.has('tags') && values.tags !== (ticket.tags ?? '')) changed.tags = values.tags;
  return changed;
}
