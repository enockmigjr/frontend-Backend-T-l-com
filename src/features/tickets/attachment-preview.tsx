'use client';

import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { formatBytes } from './presentation';
import type { z } from 'zod';
import { attachmentSchema } from './schemas';

type Attachment = z.infer<typeof attachmentSchema>;

export function AttachmentPreview({ file, label = false }: Readonly<{ file: Attachment; label?: boolean }>) {
  const url = `/api/v1/attachments/${file.id}/preview`;
  const image = file.mimeType.startsWith('image/');
  const previewable = image || file.mimeType === 'application/pdf' || file.mimeType === 'text/plain';

  if (!previewable) return null;
  return (
    <ResourceDialog
      size="large"
      title={file.originalFilename}
      description={`${formatBytes(file.fileSize)} · ${file.mimeType}`}
      trigger={
        <Button type="button" variant={label ? 'outline' : 'ghost'} size={label ? 'sm' : 'icon-xs'}>
          <Eye aria-hidden />
          {label ? file.originalFilename : null}
          <span className="sr-only">{label ? '' : `Prévisualiser ${file.originalFilename}`}</span>
        </Button>
      }
    >
      <div className="grid min-h-80 place-items-center overflow-hidden rounded-lg border bg-muted/30">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated dynamic attachment
          <img src={url} alt={file.originalFilename} className="max-h-[70vh] max-w-full object-contain" />
        ) : (
          <iframe
            src={url}
            title={`Prévisualisation de ${file.originalFilename}`}
            className="h-[70vh] w-full bg-white"
          />
        )}
      </div>
    </ResourceDialog>
  );
}
