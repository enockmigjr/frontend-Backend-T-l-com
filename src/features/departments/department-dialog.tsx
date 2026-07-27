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
      description="Le contrat actuel permet de modifier l’identité. Les paramètres opérationnels sont visibles dans le détail."
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
        <DialogFooter>
          <Button type="submit" size="lg" disabled={props.pending}>
            {props.pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </form>
    </ResourceDialog>
  );
}
