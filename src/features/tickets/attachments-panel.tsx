'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Paperclip, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';
import { ErrorAlert } from '@/features/auth/error-alert';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';
import { ticketsApi } from './api';
import { actorLabel } from './actor-label';
import { formatBytes, formatDate } from './presentation';
import { ticketKeys } from './query-keys';

export function AttachmentsPanel({ ticketId }: Readonly<{ ticketId: string }>) {
  const client = useQueryClient();
  const user = useCurrentUser();
  const input = useRef<HTMLInputElement>(null);
  const attachments = useQuery({
    queryKey: ticketKeys.attachments(ticketId),
    queryFn: () => ticketsApi.attachments(ticketId),
  });
  const upload = useMutation({
    mutationFn: (file: File) => ticketsApi.upload({ ticketId }, file),
    onSuccess: async () => {
      if (input.current) input.current.value = '';
      await client.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) });
      toast.add({ title: 'Pièce jointe ajoutée' });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => ticketsApi.removeAttachment(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) });
      toast.add({ title: 'Pièce jointe supprimée' });
    },
  });

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="attachments-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="attachments-title" className="flex items-center gap-2 font-semibold">
          <Paperclip />
          Pièces jointes
        </h2>
        <Button nativeButton={false} variant="outline" size="sm" render={<label className="cursor-pointer" />}>
          <Upload />
          {upload.isPending ? 'Envoi…' : 'Ajouter'}
          <input
            ref={input}
            className="sr-only"
            type="file"
            disabled={upload.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload.mutate(file);
            }}
          />
        </Button>
      </div>
      {attachments.error || upload.error || remove.error ? (
        <div className="mt-3">
          <ErrorAlert error={attachments.error ?? upload.error ?? remove.error} />
        </div>
      ) : null}
      {attachments.isPending ? (
        <p className="mt-4 text-sm" role="status">
          Chargement…
        </p>
      ) : null}
      <ul className="mt-3 divide-y">
        {attachments.data?.data.map((file) => (
          <li key={file.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{file.originalFilename}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.fileSize)} · {formatDate(file.createdAt)}
              </p>
              <p className="text-xs text-muted-foreground">Ajouté par {actorLabel(file)}</p>
            </div>
            <div className="flex gap-1">
              <Button
                nativeButton={false}
                variant="outline"
                size="icon"
                render={<a href={`/api/v1/attachments/${file.id}/download`} />}
                aria-label={`Télécharger ${file.originalFilename}`}
              >
                <Download />
              </Button>
              {file.uploadedBy === user.data?.id ||
              user.data?.role === 'SUPERVISOR' ||
              user.data?.role === 'ADMINISTRATOR' ? (
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" aria-label={`Supprimer ${file.originalFilename}`}>
                      <Trash2 />
                    </Button>
                  }
                  title="Supprimer cette pièce jointe ?"
                  description="Le fichier ne sera plus disponible dans le ticket."
                  confirmLabel="Supprimer"
                  onConfirm={() => remove.mutate(file.id)}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {attachments.data?.data.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Aucune pièce jointe.</p>
      ) : null}
    </section>
  );
}
