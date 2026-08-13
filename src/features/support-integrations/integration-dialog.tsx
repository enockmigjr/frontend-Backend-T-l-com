'use client';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MutationError } from '@/components/ui/mutation-error';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { Textarea } from '@/components/ui/textarea';
import { IntegrationPoliciesEditor } from './integration-policies-editor';
import type { SupportIntegration } from './types';

function toLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function IntegrationDialog(
  props: Readonly<{
    item?: SupportIntegration;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    error: unknown;
    pending: boolean;
    onSubmit: (data: FormData) => Promise<void>;
  }>,
) {
  const trustDays = String(props.item?.trustPolicy?.trustedDeviceDays ?? 90);
  const features = props.item?.features ?? {};

  return (
    <ResourceDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.item ? 'Modifier l’intégration' : 'Créer une intégration'}
      description="Les secrets ne sont jamais lus ni affichés : seule la rotation est possible, par un administrateur."
      size="large"
    >
      <form key={props.item?.id ?? 'new'} action={props.onSubmit} className="grid gap-4">
        <MutationError error={props.error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Nom</span>
            <Input name="name" required defaultValue={props.item?.name} />
          </label>
          {props.item ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Statut</span>
              <select
                name="status"
                defaultValue={props.item.status}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="DRAFT">Brouillon</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspendue</option>
              </select>
            </label>
          ) : null}
        </div>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Origines autorisées (une par ligne)</span>
          <Textarea
            name="allowedOrigins"
            required
            rows={3}
            placeholder="https://exemple.com"
            defaultValue={(props.item?.allowedOrigins ?? []).join('\n')}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Confiance de l’appareil (jours)</span>
            <Input name="trustedDeviceDays" type="number" min={1} max={3650} defaultValue={trustDays} />
          </label>
          <fieldset className="grid content-start gap-1.5 text-sm">
            <span className="font-medium">Fonctionnalités</span>
            {(['attachments', 'realtime', 'bot'] as const).map((feature) => (
              <label key={feature} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={`feature-${feature}`} defaultChecked={Boolean(features[feature])} className="size-4 accent-blue-700" />
                {feature === 'attachments' ? 'Pièces jointes publiques' : feature === 'realtime' ? 'Temps réel public' : 'Bot public'}
              </label>
            ))}
          </fieldset>
        </div>
        <IntegrationPoliciesEditor routingInitial={props.item?.routingPolicy} quotaInitial={props.item?.quotaPolicy} />
        <DialogFooter>
          <Button type="submit" size="lg" disabled={props.pending}>
            {props.pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </form>
    </ResourceDialog>
  );
}

export function parseOrigins(value: string): string[] {
  return toLines(value);
}
