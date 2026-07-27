'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Department } from '@/features/users/api/types';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { createDepartment, deleteDepartment, listDepartments, updateDepartment } from './api';
import { DepartmentDetail } from './department-detail';
import { DepartmentDialog } from './department-dialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { RowActionMenu } from '@/components/ui/row-action-menu';
import { toast } from '@/components/ui/toast';

export function DepartmentsPage() {
  const [editing, setEditing] = useState<Department>();
  const [selected, setSelected] = useState<Department>();
  const [pendingDelete, setPendingDelete] = useState<Department>();
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const query = useQuery({
    queryKey: ['departments'],
    queryFn: ({ signal }) => listDepartments(signal).then((result) => result.data),
  });
  const items = query.data ?? [];

  async function save(formData: FormData) {
    setPending(true);
    setError(undefined);
    const body = { name: String(formData.get('name')), description: String(formData.get('description')) || undefined };
    try {
      if (editing) await updateDepartment(editing.id, body);
      else await createDepartment(body);
      toast.add({ title: editing ? 'Département mis à jour' : 'Département créé', type: 'success' });
      await query.refetch();
      setEditing(undefined);
      setCreating(false);
    } catch (reason) {
      setError(reason);
    } finally {
      setPending(false);
    }
  }

  async function remove(item: Department) {
    await deleteDepartment(item.id);
    await query.refetch();
    toast.add({ title: 'Département supprimé', description: item.name, type: 'success' });
  }

  const columns: readonly DataColumn<Department>[] = [
    { key: 'name', label: 'Département', sortValue: (item) => item.name, cell: (item) => <strong>{item.name}</strong> },
    {
      key: 'description',
      label: 'Description',
      sortValue: (item) => item.description,
      cell: (item) => item.description || <span className="text-muted-foreground">Sans description</span>,
    },
    {
      key: 'strategy',
      label: 'Assignation',
      sortValue: (item) => item.assignmentStrategy,
      cell: (item) =>
        item.autoAssignmentEnabled ? `${item.assignmentStrategy} · max ${item.maxWorkloadPerAgent}` : 'Manuelle',
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
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
      title="Départements"
      description="Structurez les équipes opérationnelles et consultez leurs paramètres d’assignation."
      action={
        <Button
          size="lg"
          onClick={() => {
            setError(undefined);
            setCreating(true);
          }}
        >
          <Plus />
          Nouveau département
        </Button>
      }
    >
      {query.error ? <ErrorState message={query.error.message} retry={() => void query.refetch()} /> : null}
      {query.isPending ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>Aucun département.</EmptyState>
      ) : (
        <DataTable rows={items} columns={columns} getRowKey={(item) => item.id} caption="Départements" />
      )}
      <DepartmentDialog
        open={creating}
        onOpenChange={(open) => {
          setCreating(open);
          setError(undefined);
        }}
        error={error}
        pending={pending}
        onSubmit={save}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(undefined);
        }}
        title={`Supprimer ${pendingDelete?.name ?? 'ce département'} ?`}
        description="Le serveur refusera cette action si des ressources actives dépendent encore de ce département."
        confirmLabel="Supprimer le département"
        onConfirm={async () => {
          if (!pendingDelete) return;
          await remove(pendingDelete);
          setPendingDelete(undefined);
        }}
      />
      <DepartmentDialog
        item={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
          setError(undefined);
        }}
        error={error}
        pending={pending}
        onSubmit={save}
      />
      <ResourceDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        title="Détail du département"
        size="large"
      >
        {selected ? <DepartmentDetail id={selected.id} /> : null}
      </ResourceDialog>
    </AdminSection>
  );
}
