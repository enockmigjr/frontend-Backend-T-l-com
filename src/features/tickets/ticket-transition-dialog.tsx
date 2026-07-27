'use client';

export type DialogAction = 'pending-customer' | 'pending-third-party' | 'resolve' | 'reopen';

interface TicketTransitionDialogProps {
  readonly action: DialogAction;
  readonly text: string;
  readonly busy: boolean;
  readonly onText: (value: string) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function TicketTransitionDialog({
  action,
  text,
  busy,
  onText,
  onCancel,
  onConfirm,
}: TicketTransitionDialogProps) {
  const invalid = (action === 'reopen' && text.trim().length < 10) || (action === 'resolve' && text.trim().length < 5);
  return (
    <div className="mt-4 rounded-lg border bg-white p-4">
      <label className="mb-1 block text-sm font-medium" htmlFor="action-detail">
        {action === 'resolve' ? 'Résumé de la résolution' : 'Raison'}
      </label>
      <textarea
        id="action-detail"
        autoFocus
        rows={3}
        className="w-full rounded-lg border px-3 py-2"
        value={text}
        onChange={(event) => onText(event.target.value)}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button className="min-h-11 rounded-lg border px-3 py-2 text-sm font-medium" onClick={onCancel}>
          Annuler
        </button>
        <button
          className="min-h-11 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={invalid || busy}
          onClick={onConfirm}
        >
          Confirmer
        </button>
      </div>
    </div>
  );
}
