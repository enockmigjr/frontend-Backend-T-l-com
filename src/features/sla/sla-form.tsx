import type { Category, SlaPolicy } from '@/features/users/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MutationError } from '@/components/ui/mutation-error';

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const labels = { LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Haute', CRITICAL: 'Critique' } as const;

export function SlaForm({
  editing,
  categories,
  error,
  onSubmit,
}: Readonly<{
  editing: SlaPolicy | null;
  categories: readonly Category[];
  error: unknown;
  onSubmit: (data: FormData) => Promise<void>;
}>) {
  return (
    <form key={editing?.id ?? 'new'} action={onSubmit} className="grid min-w-0 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <MutationError error={error} />
      </div>
      <label className="grid min-w-0 gap-2 text-sm font-medium sm:col-span-2">
        Catégorie
        <select
          required
          disabled={Boolean(editing)}
          name="categoryId"
          defaultValue={editing?.categoryId ?? ''}
          className="h-10 w-full min-w-0 truncate rounded-lg border bg-background px-3 disabled:opacity-70"
        >
          <option value="" disabled>
            Sélectionner une catégorie
          </option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid min-w-0 gap-2 text-sm font-medium">
        Priorité
        <select
          disabled={Boolean(editing)}
          name="priority"
          defaultValue={editing?.priority ?? 'MEDIUM'}
          className="h-10 w-full min-w-0 truncate rounded-lg border bg-background px-3 disabled:opacity-70"
        >
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {labels[priority]}
            </option>
          ))}
        </select>
      </label>
      <span />
      <label className="grid gap-2 text-sm font-medium">
        Première réponse (min)
        <Input
          required
          min="1"
          type="number"
          name="firstResponseMinutes"
          defaultValue={editing?.firstResponseMinutes}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Résolution (min)
        <Input required min="1" type="number" name="resolutionMinutes" defaultValue={editing?.resolutionMinutes} />
      </label>
      <Button type="submit" className="justify-self-end sm:col-span-2">
        Enregistrer
      </Button>
    </form>
  );
}
