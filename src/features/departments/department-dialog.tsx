import type { Department } from '@/features/users/api/types';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MutationError } from '@/components/ui/mutation-error';
import { ResourceDialog } from '@/components/ui/resource-dialog';

export function DepartmentDialog(
  props: Readonly<{
    item?: Department;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    error: unknown;
    pending: boolean;
    onSubmit: (data: FormData) => Promise<void>;
  }>,
) {
  return (
    <ResourceDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.item ? 'Modifier le département' : 'Créer un département'}
      description="Configurez l'identité et les paramètres d'assignation automatique."
    >
      <form action={props.onSubmit} className="grid gap-4">
        <MutationError error={props.error} />
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Nom</span>
          <Input name="name" required defaultValue={props.item?.name} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Description</span>
          <Input name="description" defaultValue={props.item?.description ?? ''} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Algorithme d&apos;assignation</span>
          <select
            name="assignmentStrategy"
            defaultValue={props.item?.assignmentStrategy ?? 'LEAST_LOADED'}
            className="h-10 rounded-lg border bg-background px-3"
          >
            <option value="LEAST_LOADED">Charge la plus faible (LEAST_LOADED)</option>
            <option value="ROUND_ROBIN">Tourniquet (ROUND_ROBIN)</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm">
          <span className="font-medium">Assignation automatique active</span>
          <input
            type="checkbox"
            name="autoAssignmentEnabled"
            defaultChecked={props.item ? props.item.autoAssignmentEnabled : true}
            className="size-4"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Charge maximale par agent</span>
          <Input name="maxWorkloadPerAgent" type="number" min={1} defaultValue={props.item?.maxWorkloadPerAgent ?? 100} />
        </label>
        <DialogFooter>
          <Button type="submit" size="lg" disabled={props.pending}>
            {props.pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </form>
    </ResourceDialog>
  );
}
