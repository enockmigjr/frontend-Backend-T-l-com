'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { ErrorAlert } from '@/features/auth/error-alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { ticketsApi } from './api';
import { formatDate } from './presentation';
import { ticketKeys } from './query-keys';

type Mode = 'comments' | 'notes';
type Editing = { readonly id: string; readonly content: string } | null;

export function DiscussionPanel({ ticketId }: Readonly<{ ticketId: string }>) {
  const client = useQueryClient();
  const user = useCurrentUser();
  const [mode, setMode] = useState<Mode>('comments');
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState<Editing>(null);
  const canSeeNotes = user.data?.role !== 'FIELD_TECHNICIAN';
  const comments = useQuery({ queryKey: ticketKeys.comments(ticketId), queryFn: () => ticketsApi.comments(ticketId) });
  const notes = useQuery({ queryKey: ticketKeys.notes(ticketId), queryFn: () => ticketsApi.notes(ticketId), enabled: canSeeNotes });
  const active = mode === 'comments' ? comments : notes;
  const activeKey = mode === 'comments' ? ticketKeys.comments(ticketId) : ticketKeys.notes(ticketId);
  const refresh = () => client.invalidateQueries({ queryKey: activeKey });
  const add = useMutation({
    mutationFn: async () => {
      if (mode === 'comments') await ticketsApi.addComment(ticketId, content.trim());
      else await ticketsApi.addNote(ticketId, content.trim());
    },
    onSuccess: async () => { setContent(''); await refresh(); toast.add({ title: 'Message publié' }); },
  });
  const update = useMutation({
    mutationFn: async (value: { id: string; content: string }) => {
      if (mode === 'comments') await ticketsApi.updateComment(value.id, value.content);
      else await ticketsApi.updateNote(value.id, value.content);
    },
    onSuccess: async () => { setEditing(null); await refresh(); toast.add({ title: 'Message mis à jour' }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => mode === 'comments' ? ticketsApi.removeComment(id) : ticketsApi.removeNote(id),
    onSuccess: async () => { await refresh(); toast.add({ title: 'Message supprimé' }); },
  });

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="discussion-title">
      <ResourceDialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }} title="Modifier le message">
        {editing ? (
          <form action={(formData) => update.mutate({ id: editing.id, content: String(formData.get('content')).trim() })} className="grid gap-4">
            <Textarea required minLength={2} name="content" defaultValue={editing.content} rows={5} />
            <Button type="submit" className="justify-self-end" disabled={update.isPending}>Enregistrer</Button>
          </form>
        ) : null}
      </ResourceDialog>
      <div className="border-b p-4">
        <h2 id="discussion-title" className="font-semibold">Activité</h2>
        <div className="mt-3 flex gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Conversations du ticket">
          <Tab selected={mode === 'comments'} onClick={() => setMode('comments')}>Commentaires</Tab>
          {canSeeNotes ? <Tab selected={mode === 'notes'} onClick={() => setMode('notes')}>Notes internes</Tab> : null}
        </div>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto p-4" aria-live="polite">
        {active.isPending ? <p role="status">Chargement…</p> : null}
        {active.error ? <ErrorAlert error={active.error} /> : null}
        {active.data?.data.map((entry) => {
          const canManage =
            entry.authorId === user.data?.id ||
            user.data?.role === 'SUPERVISOR' ||
            user.data?.role === 'ADMINISTRATOR';
          return (
            <article key={entry.id} className={`rounded-lg border p-3 ${mode === 'notes' ? 'border-amber-200 bg-amber-50' : 'bg-muted/45'}`}>
              <header className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <strong className="text-foreground">{[entry.authorFirstName, entry.authorLastName].filter(Boolean).join(' ') || 'Utilisateur'}</strong>
                <div className="flex items-center gap-1">
                  <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
                  {canManage ? (
                    <>
                      <Button variant="ghost" size="icon-xs" aria-label="Modifier" onClick={() => setEditing({ id: entry.id, content: entry.content })}><Pencil /></Button>
                      <ConfirmDialog
                        trigger={<Button variant="ghost" size="icon-xs" aria-label="Supprimer"><Trash2 /></Button>}
                        title="Supprimer ce message ?"
                        description="Cette action retire définitivement le contenu du ticket."
                        confirmLabel="Supprimer"
                        onConfirm={() => remove.mutate(entry.id)}
                      />
                    </>
                  ) : null}
                </div>
              </header>
              <p className="mt-2 whitespace-pre-wrap text-sm">{entry.content}</p>
            </article>
          );
        })}
        {active.data?.data.length === 0 ? <p className="py-5 text-center text-sm text-muted-foreground">Aucun contenu.</p> : null}
      </div>
      <form className="border-t p-4" onSubmit={(event) => {
        event.preventDefault();
        if (content.trim().length >= 2) add.mutate();
      }}>
        {add.error ? <div className="mb-3"><ErrorAlert error={add.error} /></div> : null}
        <Textarea
          aria-label={mode === 'comments' ? 'Ajouter un commentaire' : 'Ajouter une note interne'}
          rows={3}
          placeholder={mode === 'comments' ? 'Ajouter un commentaire public…' : 'Ajouter une note réservée aux équipes…'}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <Button disabled={content.trim().length < 2 || add.isPending}>{add.isPending ? 'Envoi…' : 'Publier'}</Button>
        </div>
      </form>
    </section>
  );
}

function Tab({ selected, onClick, children }: Readonly<{ selected: boolean; onClick: () => void; children: React.ReactNode }>) {
  return <button type="button" role="tab" aria-selected={selected} className={`min-h-9 flex-1 rounded-md px-3 text-sm font-medium ${selected ? 'bg-background shadow-sm' : 'text-muted-foreground'}`} onClick={onClick}>{children}</button>;
}
