'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { ErrorAlert } from '@/features/auth/error-alert';
import { ticketsApi } from './api';
import { formatDate } from './presentation';
import { ticketKeys } from './query-keys';

type Mode = 'comments' | 'notes';

export function DiscussionPanel({ ticketId }: Readonly<{ ticketId: string }>) {
  const client = useQueryClient();
  const user = useCurrentUser();
  const [mode, setMode] = useState<Mode>('comments');
  const [content, setContent] = useState('');
  const canSeeNotes = user.data?.role !== 'FIELD_TECHNICIAN';
  const comments = useQuery({ queryKey: ticketKeys.comments(ticketId), queryFn: () => ticketsApi.comments(ticketId) });
  const notes = useQuery({
    queryKey: ticketKeys.notes(ticketId),
    queryFn: () => ticketsApi.notes(ticketId),
    enabled: canSeeNotes,
  });
  const active = mode === 'comments' ? comments : notes;
  const add = useMutation({
    mutationFn: async () => {
      if (mode === 'comments') {
        await ticketsApi.addComment(ticketId, content.trim());
        return;
      }
      await ticketsApi.addNote(ticketId, content.trim());
    },
    onSuccess: async () => {
      setContent('');
      await client.invalidateQueries({
        queryKey: mode === 'comments' ? ticketKeys.comments(ticketId) : ticketKeys.notes(ticketId),
      });
    },
  });

  return (
    <section className="rounded-xl border bg-white" aria-labelledby="discussion-title">
      <div className="border-b p-4">
        <h2 id="discussion-title" className="font-semibold">
          Collaboration
        </h2>
        <div className="mt-3 flex gap-2" role="tablist" aria-label="Conversations du ticket">
          <Tab selected={mode === 'comments'} onClick={() => setMode('comments')}>
            Commentaires
          </Tab>
          {canSeeNotes ? (
            <Tab selected={mode === 'notes'} onClick={() => setMode('notes')}>
              Notes internes
            </Tab>
          ) : null}
        </div>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto p-4" aria-live="polite">
        {active.isPending ? <p role="status">Chargement…</p> : null}
        {active.error ? <ErrorAlert error={active.error} /> : null}
        {active.data?.data.map((entry) => (
          <article
            key={entry.id}
            className={`rounded-lg border p-3 ${mode === 'notes' ? 'border-amber-200 bg-amber-50' : 'bg-slate-50'}`}
          >
            <header className="flex flex-wrap justify-between gap-2 text-xs text-slate-600">
              <strong className="text-slate-900">
                {[entry.authorFirstName, entry.authorLastName].filter(Boolean).join(' ') || 'Utilisateur'}
              </strong>
              <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
            </header>
            <p className="mt-2 whitespace-pre-wrap text-sm">{entry.content}</p>
          </article>
        ))}
        {active.data?.data.length === 0 ? (
          <p className="py-5 text-center text-sm text-slate-600">
            Aucun {mode === 'comments' ? 'commentaire' : 'note interne'}.
          </p>
        ) : null}
      </div>
      <form
        className="border-t p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (content.trim().length >= 2) add.mutate();
        }}
      >
        {add.error ? (
          <div className="mb-3">
            <ErrorAlert error={add.error} />
          </div>
        ) : null}
        <label className="sr-only" htmlFor="discussion-content">
          Ajouter {mode === 'comments' ? 'un commentaire' : 'une note interne'}
        </label>
        <textarea
          id="discussion-content"
          rows={3}
          className="w-full rounded-lg border px-3 py-2"
          placeholder={
            mode === 'comments' ? 'Ajouter un commentaire public…' : 'Ajouter une note réservée aux équipes…'
          }
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            disabled={content.trim().length < 2 || add.isPending}
            className="min-h-11 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {add.isPending ? 'Envoi…' : 'Publier'}
          </button>
        </div>
      </form>
    </section>
  );
}

function Tab({
  selected,
  onClick,
  children,
}: Readonly<{ selected: boolean; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium ${selected ? 'bg-blue-100 text-blue-900' : 'hover:bg-slate-100'}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
