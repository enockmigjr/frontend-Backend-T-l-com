'use client';

import { Button } from '@/components/ui/button';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { Textarea } from '@/components/ui/textarea';
import { ErrorAlert } from '@/features/auth/error-alert';

export type DialogAction =
  | 'pending-customer'
  | 'pending-third-party'
  | 'resolve'
  | 'reopen'
  | 'close';

interface TicketTransitionDialogProps {
  readonly action: DialogAction;
  readonly text: string;
  readonly busy: boolean;
  readonly error?: unknown;
  readonly onText: (value: string) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

const titles: Record<DialogAction, string> = {
  'pending-customer': 'Mettre en attente du client',
  'pending-third-party': 'Mettre en attente d’un tiers',
  resolve: 'Résoudre le ticket',
  reopen: 'Rouvrir le ticket',
  close: 'Clôturer le ticket',
};

export function TicketTransitionDialog({
  action,
  text,
  busy,
  error,
  onText,
  onCancel,
  onConfirm,
}: TicketTransitionDialogProps) {
  const requiresReason = action !== 'close';
  const minimum = action === 'resolve' ? 5 : action === 'reopen' ? 10 : 0;
  const invalid = requiresReason && text.trim().length < minimum;
  return (
    <ResourceDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={titles[action]}
      description={
        action === 'close'
          ? 'Le ticket quittera les files opérationnelles actives.'
          : 'Cette action sera enregistrée dans l’historique.'
      }
    >
      <div className="space-y-4">
        {error ? <ErrorAlert error={error} /> : null}
        {requiresReason ? (
          <label className="grid gap-1.5 text-sm font-medium">
            {action === 'resolve'
              ? 'Résumé de la résolution'
              : 'Raison'}
            <Textarea autoFocus rows={4} value={text} onChange={(event) => onText(event.target.value)} />
          </label>
        ) : (
          <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            Confirmez uniquement lorsque la résolution a été vérifiée et communiquée.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" disabled={invalid || busy} onClick={onConfirm}>
            {busy ? 'Traitement…' : 'Confirmer'}
          </Button>
        </div>
      </div>
    </ResourceDialog>
  );
}
