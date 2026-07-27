'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category } from '@/features/users/api/types';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { createCategory, deleteCategory, listCategories, updateCategory } from './api';

const roles = {
  CUSTOMER_SERVICE_AGENT: 'Service client',
  NOC_ENGINEER: 'Ingénieur NOC',
  BILLING_AGENT: 'Facturation',
  TECHNICAL_SUPPORT_ENGINEER: 'Support technique',
  FIELD_TECHNICIAN: 'Technicien terrain',
} as const;

type Role = keyof typeof roles;

export function CategoriesPage() {
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => listCategories(signal).then((result) => result.data),
  });
  const items = query.data ?? [];

  async function save(formData: FormData) {
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
      setError(reason instanceof Error ? reason.message : 'Enregistrement impossible.');
    }
  }

  async function remove(item: Category) {
    try {
      await deleteCategory(item.id);
      await query.refetch();
      toast.add({ title: 'Catégorie supprimée' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Suppression refusée.');
    }
  }

  const columns: DataColumn<Category>[] = [
    { key: 'name', label: 'Catégorie', cell: (item) => <strong>{item.name}</strong> },
    { key: 'description', label: 'Description', cell: (item) => item.description || '—' },
    {
      key: 'role',
      label: 'Orientation',
      cell: (item) => (item.targetRole ? roles[item.targetRole as Role] ?? item.targetRole : 'Aucune'),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-28 text-right',
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label={`Modifier ${item.name}`} onClick={() => {
            setEditing(item);
            setFormOpen(true);
          }}>
            <Pencil />
          </Button>
          <ConfirmDialog
            trigger={<Button variant="ghost" size="icon" aria-label={`Supprimer ${item.name}`}><Trash2 /></Button>}
            title="Supprimer cette catégorie ?"
            description="La suppression sera refusée si la catégorie reste utilisée."
            confirmLabel="Supprimer"
            onConfirm={() => void remove(item)}
          />
        </div>
      ),
    },
  ];

  return (
    <AdminSection
      title="Catégories"
      description="Structurez les incidents et orientez automatiquement chaque catégorie vers un rôle opérationnel."
      action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />Nouvelle catégorie</Button>}
    >
      <ResourceDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        description="Une catégorie cible un seul rôle, conformément au modèle backend."
      >
        <form action={save} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">Nom
            <Input required name="name" defaultValue={editing?.name} />
          </label>
          <label className="grid gap-2 text-sm font-medium">Description
            <Textarea name="description" defaultValue={editing?.description ?? ''} />
          </label>
          <label className="grid gap-2 text-sm font-medium">Rôle d’orientation
            <select name="targetRole" defaultValue={editing?.targetRole ?? ''} className="h-10 rounded-lg border bg-background px-3">
              <option value="">Aucun</option>
              {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <Button type="submit" className="justify-self-end">Enregistrer</Button>
        </form>
      </ResourceDialog>
      {error || query.error ? <ErrorState message={error || String(query.error)} retry={() => void query.refetch()} /> : null}
      {query.isPending ? <LoadingState /> : items.length ? (
        <DataTable rows={items} columns={columns} getRowKey={(item) => item.id} caption="Liste des catégories" />
      ) : <EmptyState>Aucune catégorie.</EmptyState>}
    </AdminSection>
  );
}
