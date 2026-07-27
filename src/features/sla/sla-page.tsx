'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import type { SlaPolicy } from '@/features/users/api/types';
import { listCategories } from '@/features/categories/api';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { toast } from '@/components/ui/toast';
import { createPolicy, listPolicies, updatePolicy } from './api';

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const labels = { LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Haute', CRITICAL: 'Critique' } as const;

export function SlaPage() {
  const [editing, setEditing] = useState<SlaPolicy | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const policies = useQuery({
    queryKey: ['sla-policies'],
    queryFn: ({ signal }) => listPolicies(signal).then((result) => result.data),
  });
  const categories = useQuery({
    queryKey: ['categories', 'sla-select'],
    queryFn: ({ signal }) => listCategories(signal).then((result) => result.data),
  });

  async function save(formData: FormData) {
    const body = {
      categoryId: String(formData.get('categoryId')),
      priority: String(formData.get('priority')) as (typeof priorities)[number],
      firstResponseMinutes: Number(formData.get('firstResponseMinutes')),
      resolutionMinutes: Number(formData.get('resolutionMinutes')),
    };
    try {
      if (editing) await updatePolicy(editing.id, body);
      else await createPolicy(body);
      await policies.refetch();
      setFormOpen(false);
      setEditing(null);
      toast.add({ title: editing ? 'Politique SLA mise à jour' : 'Politique SLA créée' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Enregistrement impossible.');
    }
  }

  const columns: DataColumn<SlaPolicy>[] = [
    { key: 'category', label: 'Catégorie', cell: (item) => item.categoryName ?? 'Catégorie inconnue' },
    { key: 'priority', label: 'Priorité', cell: (item) => <Badge variant={item.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>{labels[item.priority]}</Badge> },
    { key: 'response', label: 'Première réponse', cell: (item) => `${item.firstResponseMinutes} min` },
    { key: 'resolution', label: 'Résolution', cell: (item) => `${item.resolutionMinutes} min` },
    {
      key: 'actions', label: '', className: 'w-20 text-right', cell: (item) => (
        <Button variant="ghost" size="icon" aria-label="Modifier la politique" onClick={() => {
          setEditing(item);
          setFormOpen(true);
        }}><Pencil /></Button>
      ),
    },
  ];

  return (
    <AdminSection
      title="Politiques SLA"
      description="Définissez les engagements de première réponse et de résolution par catégorie et priorité."
      action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />Nouvelle politique</Button>}
    >
      <ResourceDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Modifier la politique SLA' : 'Nouvelle politique SLA'}>
        <form action={save} className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">Catégorie
            <select required name="categoryId" defaultValue={editing?.categoryId ?? ''} className="h-10 rounded-lg border bg-background px-3">
              <option value="" disabled>Sélectionner une catégorie</option>
              {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">Priorité
            <select name="priority" defaultValue={editing?.priority ?? 'MEDIUM'} className="h-10 rounded-lg border bg-background px-3">
              {priorities.map((priority) => <option key={priority} value={priority}>{labels[priority]}</option>)}
            </select>
          </label>
          <span />
          <label className="grid gap-2 text-sm font-medium">Première réponse (min)
            <Input required min="1" type="number" name="firstResponseMinutes" defaultValue={editing?.firstResponseMinutes} />
          </label>
          <label className="grid gap-2 text-sm font-medium">Résolution (min)
            <Input required min="1" type="number" name="resolutionMinutes" defaultValue={editing?.resolutionMinutes} />
          </label>
          <Button type="submit" className="justify-self-end sm:col-span-2">Enregistrer</Button>
        </form>
      </ResourceDialog>
      {error || policies.error ? <ErrorState message={error || String(policies.error)} retry={() => void policies.refetch()} /> : null}
      {policies.isPending ? <LoadingState /> : policies.data?.length ? (
        <DataTable rows={policies.data} columns={columns} getRowKey={(item) => item.id} caption="Politiques SLA" />
      ) : <EmptyState>Aucune politique SLA.</EmptyState>}
    </AdminSection>
  );
}
