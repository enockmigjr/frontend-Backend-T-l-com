'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Department } from '@/features/users/api/types';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { createDepartment, deleteDepartment, listDepartments, updateDepartment } from './api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';

export function DepartmentsPage() {
  const [editing, setEditing] = useState<Department>();
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['departments'],
    queryFn: ({ signal }) => listDepartments(signal).then((result) => result.data),
  });
  const items = query.data ?? [];

  async function save(formData: FormData) {
    setPending(true);
    setError('');
    const body = { name: String(formData.get('name')), description: String(formData.get('description')) || undefined };
    try {
      if (editing) await updateDepartment(editing.id, body);
      else await createDepartment(body);
      toast.add({ title: editing ? 'Département mis à jour' : 'Département créé', type: 'success' });
      setEditing(undefined);
      setCreating(false);
      await query.refetch();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Enregistrement impossible.');
    } finally {
      setPending(false);
    }
  }

  async function remove(item: Department) {
    setPending(true);
    try {
      await deleteDepartment(item.id);
      toast.add({ title: 'Département supprimé', description: item.name, type: 'success' });
      await query.refetch();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Suppression refusée. Vérifiez les dépendances actives.');
    } finally {
      setPending(false);
    }
  }

  const columns: readonly DataColumn<Department>[] = [
    { key: 'name', label: 'Département', cell: (item) => <strong>{item.name}</strong> },
    { key: 'description', label: 'Description', cell: (item) => item.description || <span className="text-muted-foreground">Sans description</span> },
    { key: 'strategy', label: 'Assignation', cell: (item) => item.autoAssignmentEnabled ? `${item.assignmentStrategy} · max ${item.maxWorkloadPerAgent}` : 'Manuelle' },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      cell: (item) => <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(item)}><Pencil />Modifier</Button>
        <ConfirmDialog
          trigger={<Button variant="ghost" size="sm" className="text-destructive"><Trash2 />Supprimer</Button>}
          title={`Supprimer ${item.name} ?`}
          description="Cette action est refusée par le serveur si des ressources actives dépendent encore de ce département."
          confirmLabel="Supprimer le département"
          pending={pending}
          onConfirm={() => void remove(item)}
        />
      </div>,
    },
  ];

  return (
    <AdminSection
      title="Départements"
      description="Structurez les équipes opérationnelles et leur stratégie d’assignation."
      action={<Button size="lg" onClick={() => setCreating(true)}><Plus />Nouveau département</Button>}
    >
      {error || query.error ? <ErrorState message={error || (query.error instanceof Error ? query.error.message : '')} retry={() => void query.refetch()} /> : null}
      {query.isPending ? <LoadingState /> : items.length === 0 ? <EmptyState>Aucun département.</EmptyState> : <DataTable rows={items} columns={columns} getRowKey={(item) => item.id} caption="Départements" />}
      <DepartmentDialog open={creating} onOpenChange={setCreating} pending={pending} onSubmit={save} />
      <DepartmentDialog item={editing} open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(undefined); }} pending={pending} onSubmit={save} />
    </AdminSection>
  );
}

function DepartmentDialog(props: Readonly<{ item?: Department; open: boolean; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (data: FormData) => Promise<void> }>) {
  return (
    <ResourceDialog open={props.open} onOpenChange={props.onOpenChange} title={props.item ? 'Modifier le département' : 'Créer un département'} description="Le nom et la description seront visibles dans les tickets et les sélecteurs.">
      <form action={props.onSubmit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm"><span className="font-medium">Nom</span><Input name="name" required defaultValue={props.item?.name} className="h-10" /></label>
        <label className="grid gap-1.5 text-sm"><span className="font-medium">Description</span><Input name="description" defaultValue={props.item?.description ?? ''} className="h-10" /></label>
        <DialogFooter><Button type="submit" size="lg" disabled={props.pending}>{props.pending ? 'Enregistrement…' : 'Enregistrer'}</Button></DialogFooter>
      </form>
    </ResourceDialog>
  );
}
