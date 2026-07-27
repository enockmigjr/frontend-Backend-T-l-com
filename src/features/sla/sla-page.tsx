'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Pencil, Plus } from 'lucide-react';
import type { SlaPolicy } from '@/features/users/api/types';
import { listCategories } from '@/features/categories/api';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { toast } from '@/components/ui/toast';
import { createPolicy, listPolicies, updatePolicy } from './api';
import { SlaDetail } from './sla-detail';
import { SlaForm } from './sla-form';

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const labels = { LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Haute', CRITICAL: 'Critique' } as const;

export function SlaPage() {
  const [editing, setEditing] = useState<SlaPolicy | null>(null);
  const [selected, setSelected] = useState<SlaPolicy>();
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<unknown>();
  const policies = useQuery({
    queryKey: ['sla-policies'],
    queryFn: ({ signal }) => listPolicies(signal).then((result) => result.data),
  });
  const categories = useQuery({
    queryKey: ['categories', 'sla-select'],
    queryFn: ({ signal }) => listCategories(signal).then((result) => result.data),
  });

  function changeFormOpen(open: boolean) {
    setFormOpen(open);
    setError(undefined);
    if (!open) setEditing(null);
  }

  async function save(formData: FormData) {
    setError(undefined);
    const times = {
      firstResponseMinutes: Number(formData.get('firstResponseMinutes')),
      resolutionMinutes: Number(formData.get('resolutionMinutes')),
    };
    try {
      if (editing) {
        await updatePolicy(editing.id, times);
      } else {
        await createPolicy({
          ...times,
          categoryId: String(formData.get('categoryId')),
          priority: String(formData.get('priority')) as (typeof priorities)[number],
        });
      }
      await policies.refetch();
      setFormOpen(false);
      setEditing(null);
      toast.add({ title: editing ? 'Politique SLA mise à jour' : 'Politique SLA créée' });
    } catch (reason) {
      setError(reason);
    }
  }

  const columns: DataColumn<SlaPolicy>[] = [
    {
      key: 'category',
      label: 'Catégorie',
      sortValue: (item) => item.categoryName,
      cell: (item) => item.categoryName ?? 'Catégorie inconnue',
    },
    {
      key: 'priority',
      label: 'Priorité',
      sortValue: (item) => priorities.indexOf(item.priority),
      cell: (item) => (
        <Badge variant={item.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>{labels[item.priority]}</Badge>
      ),
    },
    {
      key: 'response',
      label: 'Première réponse',
      sortValue: (item) => item.firstResponseMinutes,
      cell: (item) => `${item.firstResponseMinutes} min`,
    },
    {
      key: 'resolution',
      label: 'Résolution',
      sortValue: (item) => item.resolutionMinutes,
      cell: (item) => `${item.resolutionMinutes} min`,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-28 text-right',
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Voir la politique" onClick={() => setSelected(item)}>
            <Eye />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Modifier la politique"
            onClick={() => {
              setError(undefined);
              setEditing(item);
              setFormOpen(true);
            }}
          >
            <Pencil />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminSection
      title="Politiques SLA"
      description="Définissez les engagements de première réponse et de résolution par catégorie et priorité."
      action={
        <Button
          onClick={() => {
            setEditing(null);
            setError(undefined);
            setFormOpen(true);
          }}
        >
          <Plus />
          Nouvelle politique
        </Button>
      }
    >
      <ResourceDialog
        open={formOpen}
        onOpenChange={changeFormOpen}
        title={editing ? 'Modifier les délais SLA' : 'Nouvelle politique SLA'}
        description={
          editing
            ? 'La catégorie et la priorité identifient la politique et ne sont pas modifiables par cette route.'
            : undefined
        }
      >
        <SlaForm editing={editing} categories={categories.data ?? []} error={error} onSubmit={save} />
      </ResourceDialog>
      <ResourceDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        title="Détail de la politique SLA"
        size="large"
      >
        {selected ? <SlaDetail id={selected.id} /> : null}
      </ResourceDialog>
      {policies.error ? <ErrorState message={policies.error.message} retry={() => void policies.refetch()} /> : null}
      {policies.isPending ? (
        <LoadingState />
      ) : policies.data?.length ? (
        <DataTable rows={policies.data} columns={columns} getRowKey={(item) => item.id} caption="Politiques SLA" />
      ) : (
        <EmptyState>Aucune politique SLA.</EmptyState>
      )}
    </AdminSection>
  );
}
