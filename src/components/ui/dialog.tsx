'use client';

import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';

export function Modal({
  trigger,
  title,
  description,
  children,
}: {
  readonly trigger: React.ReactElement;
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={trigger} />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-slate-950/45 transition-opacity" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 max-h-[85dvh] w-[min(92vw,38rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
          <div className="pr-10">
            <Dialog.Title className="text-xl font-bold">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="mt-1 text-sm text-slate-600">{description}</Dialog.Description>
            )}
          </div>
          <Dialog.Close
            aria-label="Fermer"
            className="absolute right-4 top-4 grid size-11 cursor-pointer place-items-center rounded-lg hover:bg-slate-100"
          >
            <X aria-hidden className="size-5" />
          </Dialog.Close>
          <div className="mt-5">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
