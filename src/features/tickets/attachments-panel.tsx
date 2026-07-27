'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Paperclip, Upload } from 'lucide-react';
import { useRef } from 'react';
import { ErrorAlert } from '@/features/auth/error-alert';
import { ticketsApi } from './api';
import { formatBytes, formatDate } from './presentation';
import { ticketKeys } from './query-keys';

export function AttachmentsPanel({ ticketId }: Readonly<{ ticketId: string }>) {
  const client = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const attachments = useQuery({
    queryKey: ticketKeys.attachments(ticketId),
    queryFn: () => ticketsApi.attachments(ticketId),
  });
  const upload = useMutation({
    mutationFn: (file: File) => ticketsApi.upload(ticketId, file),
    onSuccess: async () => {
      if (input.current) input.current.value = '';
      await client.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) });
    },
  });

  return (
    <section className="rounded-xl border bg-white p-4" aria-labelledby="attachments-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="attachments-title" className="flex items-center gap-2 font-semibold">
          <Paperclip aria-hidden size={18} />
          Pièces jointes
        </h2>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
          <Upload aria-hidden size={17} />
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
        </label>
      </div>
      {attachments.error || upload.error ? (
        <div className="mt-3">
          <ErrorAlert error={attachments.error ?? upload.error} />
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
              <p className="text-xs text-slate-500">
                {formatBytes(file.fileSize)} · {formatDate(file.createdAt)}
              </p>
            </div>
            <a
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border p-2"
              aria-label={`Télécharger ${file.originalFilename}`}
              href={`/api/v1/attachments/${file.id}/download`}
            >
              <Download aria-hidden size={18} />
            </a>
          </li>
        ))}
      </ul>
      {attachments.data?.data.length === 0 ? <p className="mt-3 text-sm text-slate-600">Aucune pièce jointe.</p> : null}
    </section>
  );
}
