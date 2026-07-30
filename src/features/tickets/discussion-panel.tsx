'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Paperclip, Pencil, Send, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { ErrorAlert } from '@/features/auth/error-alert';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { ticketsApi } from './api';
import { actorLabel } from './actor-label';
import { AttachmentPreview } from './attachment-preview';
import { formatBytes, formatDate } from './presentation';
import { ticketKeys } from './query-keys';
import type { z } from 'zod';
import { attachmentSchema } from './schemas';

type Mode = 'comments' | 'notes';
type Editing = { readonly id: string; readonly content: string } | null;
type Attachment = z.infer<typeof attachmentSchema>;

export function DiscussionPanel({ ticketId }: Readonly<{ ticketId: string }>) {
  const client = useQueryClient();
  const user = useCurrentUser();
  const messageFiles = useRef<HTMLInputElement>(null);
  const ticketFile = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('comments');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<readonly File[]>([]);
  const [editing, setEditing] = useState<Editing>(null);
  const canSeeNotes = user.data?.role !== 'FIELD_TECHNICIAN';
  const comments = useQuery({ queryKey: ticketKeys.comments(ticketId), queryFn: () => ticketsApi.comments(ticketId) });
  const notes = useQuery({
    queryKey: ticketKeys.notes(ticketId),
    queryFn: () => ticketsApi.notes(ticketId),
    enabled: canSeeNotes,
  });
  const attachments = useQuery({
    queryKey: ticketKeys.attachments(ticketId),
    queryFn: () => ticketsApi.attachments(ticketId),
  });
  const active = mode === 'comments' ? comments : notes;
  const activeKey = mode === 'comments' ? ticketKeys.comments(ticketId) : ticketKeys.notes(ticketId);
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: activeKey }),
      client.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) }),
      client.invalidateQueries({ queryKey: ticketKeys.history(ticketId) }),
    ]);

  const publish = useMutation({
    mutationFn: async () => {
      const entry =
        mode === 'comments'
          ? await ticketsApi.addComment(ticketId, content.trim())
          : await ticketsApi.addNote(ticketId, content.trim());
      const association = mode === 'comments' ? { commentId: entry.id } : { internalNoteId: entry.id };
      await Promise.all(files.map((file) => ticketsApi.upload(association, file)));
    },
    onSuccess: async () => {
      setContent('');
      setFiles([]);
      if (messageFiles.current) messageFiles.current.value = '';
      await refresh();
      toast.add({ title: mode === 'comments' ? 'Commentaire publié' : 'Note interne publiée' });
    },
  });
  const uploadTicketFile = useMutation({
    mutationFn: (file: File) => ticketsApi.upload({ ticketId }, file),
    onSuccess: async () => {
      if (ticketFile.current) ticketFile.current.value = '';
      await refresh();
      toast.add({ title: 'Pièce jointe ajoutée' });
    },
  });
  const update = useMutation({
    mutationFn: async (value: { id: string; content: string }) => {
      if (mode === 'comments') await ticketsApi.updateComment(value.id, value.content);
      else await ticketsApi.updateNote(value.id, value.content);
    },
    onSuccess: async () => {
      setEditing(null);
      await refresh();
      toast.add({ title: 'Contenu mis à jour' });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => (mode === 'comments' ? ticketsApi.removeComment(id) : ticketsApi.removeNote(id)),
    onSuccess: async () => {
      await refresh();
      toast.add({ title: 'Contenu supprimé' });
    },
  });
  const removeFile = useMutation({
    mutationFn: ticketsApi.removeAttachment,
    onSuccess: async () => {
      await refresh();
      toast.add({ title: 'Pièce jointe supprimée' });
    },
  });
  const error =
    active.error ??
    attachments.error ??
    publish.error ??
    uploadTicketFile.error ??
    update.error ??
    remove.error ??
    removeFile.error;

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="collaboration-title">
      <ResourceDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Modifier le contenu"
      >
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              update.mutate({ id: editing.id, content: String(data.get('content')).trim() });
            }}
            className="grid gap-4"
          >
            <Textarea required minLength={2} name="content" defaultValue={editing.content} rows={5} />
            <Button type="submit" className="justify-self-end" disabled={update.isPending}>
              Enregistrer
            </Button>
          </form>
        ) : null}
      </ResourceDialog>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 id="collaboration-title" className="font-semibold">
            Collaboration
          </h2>
          <p className="text-xs text-muted-foreground">Échanges, notes privées et fichiers au même endroit.</p>
        </div>
        <Button nativeButton={false} variant="outline" size="sm" render={<label className="cursor-pointer" />}>
          <Upload aria-hidden /> Ajouter un fichier
          <input
            ref={ticketFile}
            className="sr-only"
            type="file"
            accept={acceptedFiles}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && validFile(file)) uploadTicketFile.mutate(file);
            }}
          />
        </Button>
      </div>
      {error ? (
        <div className="m-4">
          <ErrorAlert error={error} />
        </div>
      ) : null}
      <div className="grid min-h-[520px] lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col border-r">
          <div className="flex gap-1 border-b bg-muted/30 p-2" role="tablist">
            <Tab selected={mode === 'comments'} onClick={() => setMode('comments')}>
              Commentaires
            </Tab>
            {canSeeNotes ? (
              <Tab selected={mode === 'notes'} onClick={() => setMode('notes')}>
                Notes internes
              </Tab>
            ) : null}
          </div>
          <div className="max-h-[420px] flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {active.isPending ? (
              <p className="text-sm text-muted-foreground" role="status">
                Chargement…
              </p>
            ) : null}
            {active.data?.data.map((entry) => {
              const entryFiles =
                attachments.data?.data.filter((file) =>
                  mode === 'comments' ? file.commentId === entry.id : file.internalNoteId === entry.id,
                ) ?? [];
              const canManage =
                entry.authorId === user.data?.id || ['SUPERVISOR', 'ADMINISTRATOR'].includes(user.data?.role ?? '');
              return (
                <article
                  key={entry.id}
                  className={`rounded-xl border p-3.5 ${mode === 'notes' ? 'border-amber-200 bg-amber-50/60' : 'bg-background'}`}
                >
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-sm">{entryAuthor(entry)}</strong>
                      <time className="ml-2 text-xs text-muted-foreground" dateTime={entry.createdAt}>
                        {formatDate(entry.createdAt)}
                      </time>
                    </div>
                    {canManage ? (
                      <MessageActions entry={entry} onEdit={setEditing} onRemove={(id) => remove.mutate(id)} />
                    ) : null}
                  </header>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{entry.content}</p>
                  {entryFiles.length > 0 ? <AttachmentChips files={entryFiles} /> : null}
                </article>
              );
            })}
            {active.data?.data.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Aucun échange pour le moment.</p>
            ) : null}
          </div>
          <form
            className="border-t bg-muted/20 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (content.trim().length >= 2) publish.mutate();
            }}
          >
            <Textarea
              rows={3}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={
                mode === 'comments'
                  ? 'Rédiger une réponse visible par les équipes…'
                  : 'Ajouter une note privée aux équipes internes…'
              }
            />
            {files.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{files.length} fichier(s) joint(s) au message</p>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-2">
              <Button nativeButton={false} variant="ghost" size="sm" render={<label className="cursor-pointer" />}>
                <Paperclip aria-hidden /> Joindre
                <input
                  ref={messageFiles}
                  className="sr-only"
                  type="file"
                  multiple
                  accept={acceptedFiles}
                  onChange={(event) => setFiles(validateFiles(Array.from(event.target.files ?? [])))}
                />
              </Button>
              <Button type="submit" disabled={content.trim().length < 2 || publish.isPending}>
                <Send aria-hidden /> {publish.isPending ? 'Publication…' : 'Publier'}
              </Button>
            </div>
          </form>
        </div>
        <FileLibrary
          files={attachments.data?.data ?? []}
          userId={user.data?.id}
          role={user.data?.role}
          onRemove={(id) => removeFile.mutate(id)}
        />
      </div>
    </section>
  );
}

const acceptedFiles = '.pdf,.jpg,.jpeg,.png,.webp,.txt';
const validFile = (file: File) => file.size <= 10 * 1024 * 1024;
function validateFiles(files: readonly File[]): readonly File[] {
  const valid = files.filter(validFile).slice(0, 3);
  if (valid.length !== files.length)
    toast.add({ title: 'Certains fichiers ont été ignorés', description: 'Maximum 3 fichiers de 10 Mo.' });
  return valid;
}
function entryAuthor(entry: {
  actorType?: 'INTERNAL' | 'EXTERNAL_REQUESTER' | 'SYSTEM';
  authorId?: string | null;
  externalRequesterId?: string | null;
  authorFirstName?: string | null;
  authorLastName?: string | null;
  authorName?: string;
  requesterName?: string | null;
}) {
  const internalName = [entry.authorFirstName, entry.authorLastName].filter(Boolean).join(' ') || entry.authorName;
  return actorLabel(entry, internalName, entry.requesterName);
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
      className={`min-h-9 rounded-lg px-3 text-sm font-medium ${selected ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function MessageActions({
  entry,
  onEdit,
  onRemove,
}: Readonly<{
  entry: { id: string; content: string };
  onEdit: (entry: Editing) => void;
  onRemove: (id: string) => void;
}>) {
  return (
    <div className="flex">
      <Button type="button" variant="ghost" size="icon-xs" aria-label="Modifier" onClick={() => onEdit(entry)}>
        <Pencil />
      </Button>
      <ConfirmDialog
        trigger={
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Supprimer">
            <Trash2 />
          </Button>
        }
        title="Supprimer ce contenu ?"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        onConfirm={() => onRemove(entry.id)}
      />
    </div>
  );
}
function AttachmentChips({ files }: Readonly<{ files: readonly Attachment[] }>) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {files.map((file) => (
        <AttachmentPreview key={file.id} file={file} label />
      ))}
    </div>
  );
}
function FileLibrary({
  files,
  userId,
  role,
  onRemove,
}: Readonly<{ files: readonly Attachment[]; userId?: string; role?: string; onRemove: (id: string) => void }>) {
  return (
    <aside className="min-w-0 bg-muted/15 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <FileText className="size-4" />
        Fichiers <span className="text-muted-foreground">{files.length}</span>
      </h3>
      <div className="mt-3 space-y-2">
        {files.map((file) => (
          <div key={file.id} className="rounded-lg border bg-background p-2.5">
            <p className="truncate text-sm font-medium">{file.originalFilename}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatBytes(file.fileSize)} ·{' '}
              {file.commentId ? 'Commentaire' : file.internalNoteId ? 'Note interne' : 'Ticket'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Ajouté par {actorLabel(file)}</p>
            <div className="mt-2 flex justify-end gap-1">
              <AttachmentPreview file={file} />
              <Button
                nativeButton={false}
                variant="ghost"
                size="icon-xs"
                render={<a href={`/api/v1/attachments/${file.id}/download`} />}
                aria-label="Télécharger"
              >
                <Download />
              </Button>
              {file.uploadedBy === userId || ['SUPERVISOR', 'ADMINISTRATOR'].includes(role ?? '') ? (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="ghost" size="icon-xs" aria-label="Supprimer">
                      <Trash2 />
                    </Button>
                  }
                  title="Supprimer ce fichier ?"
                  description="Il ne sera plus disponible dans le ticket."
                  confirmLabel="Supprimer"
                  onConfirm={() => onRemove(file.id)}
                />
              ) : null}
            </div>
          </div>
        ))}
        {files.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Aucun fichier joint.</p>
        ) : null}
      </div>
    </aside>
  );
}
