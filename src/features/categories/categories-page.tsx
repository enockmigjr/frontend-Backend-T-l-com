'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category } from '@/features/users/api/types';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { MutationError } from '@/components/ui/mutation-error';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { RowActionMenu } from '@/components/ui/row-action-menu';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { createCategory, deleteCategory, listCategories, updateCategory } from './api';
import { CategoryDetail } from './category-detail';

const roles = {
  CUSTOMER_SERVICE_AGENT: 'Service client',
  NOC_ENGINEER: 'Ingénieur NOC',
  BILLING_AGENT: 'Facturation',
  TECHNICAL_SUPPORT_ENGINEER: 'Support technique',
  FIELD_TECHNICIAN: 'Technicien terrain',
} as const;
type Role = keyof typeof roles;
type CategoryWithRoles = Category & { targetRoles?: string[] };
const roleLabel = (role?: string | null) => (role ? (roles[role as Role] ?? role) : 'Aucune orientation');

function categoryRoles(item: CategoryWithRoles): string[] {
  if (Array.isArray(item.targetRoles) && item.targetRoles.length > 0) return item.targetRoles;
  return item.targetRole ? [item.targetRole] : [];
}

export function CategoriesPage() {
  const [editing, setEditing] = useState<CategoryWithRoles | null>(null);
  const [selected, setSelected] = useState<Category>();
  const [pendingDelete, setPendingDelete] = useState<Category>();
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<unknown>();
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => listCategories(signal).then((result) => result.data),
  });
  const items = (query.data ?? []) as CategoryWithRoles[];

  function changeFormOpen(open: boolean) {
    setFormOpen(open);
    setError(undefined);
    if (!open) setEditing(null);
  }

  async function save(formData: FormData) {
    setError(undefined);
    const targetRoles = formData.getAll('targetRoles').map(String).filter(Boolean);
    const body = {
      name: String(formData.get('name')).trim(),
      description: String(formData.get('description')).trim() || undefined,
      targetRole: targetRoles[0] ?? undefined,
      targetRoles: targetRoles.length > 0 ? targetRoles : undefined,
    };
    try {
      if (editing) await updateCategory(editing.id, body);
      else await createCategory(body);
      await query.refetch();
      setFormOpen(false);
      setEditing(null);
      toast.add({ title: editing ? 'Catégorie mise à jour' : 'Catégorie créée' });
    } catch (reason) {
      setError(reason);
    }
  }

  async function remove(item: Category) {
    await deleteCategory(item.id);
    await query.refetch();
    toast.add({ title: 'Catégorie supprimée' });
  }

  const columns: DataColumn<CategoryWithRoles>[] = [
    { key: 'name', label: 'Catégorie', sortValue: (item) => item.name, cell: (item) => <strong>{item.name}</strong> },
    {
      key: 'description',
      label: 'Description',
      sortValue: (item) => item.description,
      cell: (item) => item.description || '—',
    },
    {
      key: 'role',
      label: 'Rôles d’orientation',
      sortValue: (item) => categoryRoles(item).join(', '),
      cell: (item) =>
        categoryRoles(item).length > 0 ? categoryRoles(item).map(roleLabel).join(', ') : 'Aucune orientation',
    },
    {
      key: 'actions',
      label: '',
      className: 'w-40 text-right',
      cell: (item) => (
        <RowActionMenu
          label={`Actions pour ${item.name}`}
          actions={[
            { label: 'Voir', icon: Eye, onSelect: () => setSelected(item) },
            {
              label: 'Modifier',
              icon: Pencil,
              onSelect: () => {
                setError(undefined);
                setEditing(item);
                setFormOpen(true);
              },
            },
            { label: 'Supprimer', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(item) },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminSection
      title="Catégories"
      description="Structurez les incidents et orientez chaque catégorie vers le rôle opérationnel prévu par le backend."
      action={
        <Button
          onClick={() => {
            setEditing(null);
            setError(undefined);
            setFormOpen(true);
          }}
        >
          <Plus />
          Nouvelle catégorie
        </Button>
      }
    >
      <ResourceDialog
        open={formOpen}
        onOpenChange={changeFormOpen}
        title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        description="Orientez la catégorie vers un ou plusieurs rôles opérationnels pour l'auto-assignation."
      >
        <form action={save} className="grid min-w-0 gap-4">
          <MutationError error={error} />
          <label className="grid gap-2 text-sm font-medium">
            Nom
            <Input required name="name" defaultValue={editing?.name} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Description
            <Textarea name="description" defaultValue={editing?.description ?? ''} />
          </label>
          <fieldset className="grid gap-2 text-sm">
            <legend className="font-medium">Rôles d&apos;orientation</legend>
            <p className="text-xs text-muted-foreground">Plusieurs rôles peuvent être sélectionnés.</p>
            <div className="grid gap-1.5">
              {Object.entries(roles).map(([value, label]) => {
                const checked = editing ? categoryRoles(editing).includes(value) : false;
                return (
                  <label key={value} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <input type="checkbox" name="targetRoles" value={value} defaultChecked={checked} />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <Button type="submit" className="justify-self-end">
            Enregistrer
          </Button>
        </form>
      </ResourceDialog>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(undefined);
        }}
        title="Supprimer cette catégorie ?"
        description="La suppression sera refusée si un ticket ou une politique SLA est encore lié. Le détail de l’erreur restera visible ici."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          if (!pendingDelete) return;
          await remove(pendingDelete);
          setPendingDelete(undefined);
        }}
      />
      <ResourceDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        title="Détail de la catégorie"
        size="large"
      >
        {selected ? <CategoryDetail id={selected.id} roleLabel={roleLabel} /> : null}
      </ResourceDialog>
      {query.error ? <ErrorState message={query.error.message} retry={() => void query.refetch()} /> : null}
      {query.isPending ? (
        <LoadingState />
      ) : items.length ? (
        <DataTable rows={items} columns={columns} getRowKey={(item) => item.id} caption="Liste des catégories" />
      ) : (
        <EmptyState>Aucune catégorie.</EmptyState>
      )}
    </AdminSection>
  );
}
