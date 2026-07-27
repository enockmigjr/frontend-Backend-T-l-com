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
const roleLabel = (role?: string | null) => (role ? (roles[role as Role] ?? role) : 'Aucune orientation');

export function CategoriesPage() {
  const [editing, setEditing] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Category>();
  const [pendingDelete, setPendingDelete] = useState<Category>();
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<unknown>();
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => listCategories(signal).then((result) => result.data),
  });
  const items = query.data ?? [];

  function changeFormOpen(open: boolean) {
    setFormOpen(open);
    setError(undefined);
    if (!open) setEditing(null);
  }

  async function save(formData: FormData) {
    setError(undefined);
    const body = {
      name: String(formData.get('name')).trim(),
      description: String(formData.get('description')).trim() || undefined,
      targetRole: String(formData.get('targetRole')).trim() || undefined,
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

  const columns: DataColumn<Category>[] = [
    { key: 'name', label: 'Catégorie', sortValue: (item) => item.name, cell: (item) => <strong>{item.name}</strong> },
    {
      key: 'description',
      label: 'Description',
      sortValue: (item) => item.description,
      cell: (item) => item.description || '—',
    },
    {
      key: 'role',
      label: 'Orientation',
      sortValue: (item) => item.targetRole,
      cell: (item) => roleLabel(item.targetRole),
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
        description="Le moteur d’assignation accepte actuellement un seul rôle cible par catégorie."
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
          <label className="grid min-w-0 gap-2 text-sm font-medium">
            Rôle d’orientation
            <select
              name="targetRole"
              defaultValue={editing?.targetRole ?? ''}
              className="h-10 w-full min-w-0 truncate rounded-lg border bg-background px-3"
            >
              <option value="">Aucun</option>
              {Object.entries(roles).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
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
