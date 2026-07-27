'use client';

import { useState } from 'react';
import { Button } from './button';
import { MutationError } from './mutation-error';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  open: controlledOpen,
  onOpenChange,
}: Readonly<{
  trigger?: React.ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
  pending?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const open = controlledOpen ?? internalOpen;

  function changeOpen(next: boolean) {
    if (pending) return;
    setInternalOpen(next);
    onOpenChange?.(next);
    setError(undefined);
  }

  async function confirm() {
    setPending(true);
    setError(undefined);
    try {
      await onConfirm();
      changeOpen(false);
    } catch (reason) {
      setError(reason);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <MutationError error={error} />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>Annuler</DialogClose>
          <Button variant="destructive" disabled={pending} onClick={() => void confirm()}>
            {pending ? 'Traitement…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
