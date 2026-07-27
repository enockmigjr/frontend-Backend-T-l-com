'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import type { Setting } from '@/features/users/api/types';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { useCurrentUser } from '@/features/users/components/access-gate';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { listSettings, updateSetting } from './api';

export function SettingsPage() {
  const { user } = useCurrentUser();
  const canEdit = user?.role === 'ADMINISTRATOR';
  const [editing, setEditing] = useState<Setting | null>(null);
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => listSettings(signal).then((result) => result.data),
  });

  async function save(formData: FormData) {
    if (!editing) return;
    try {
      await updateSetting(
        editing.key,
        String(formData.get('value')),
        String(formData.get('description')).trim() || undefined,
      );
      await query.refetch();
      setEditing(null);
      toast.add({ title: 'Paramètre mis à jour' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Modification impossible.');
    }
  }

  const columns: DataColumn<Setting>[] = [
    { key: 'key', label: 'Clé', cell: (item) => <code className="text-xs font-semibold">{item.key}</code> },
    { key: 'value', label: 'Valeur', cell: (item) => <span className="font-medium">{item.value}</span> },
    { key: 'description', label: 'Description', cell: (item) => item.description || '—' },
    {
      key: 'action', label: '', className: 'w-20 text-right', cell: (item) => canEdit ? (
        <Button variant="ghost" size="icon" aria-label={`Modifier ${item.key}`} onClick={() => setEditing(item)}><Pencil /></Button>
      ) : <span className="text-xs text-muted-foreground">Lecture seule</span>,
    },
  ];

  return (
    <AdminSection title="Paramètres" description="Configuration système exposée par le backend, avec modification réservée aux administrateurs.">
      <ResourceDialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }} title={`Modifier ${editing?.key ?? ''}`}>
        {editing ? (
          <form action={save} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">Valeur
              <Input required name="value" defaultValue={editing.value} />
            </label>
            <label className="grid gap-2 text-sm font-medium">Description
              <Textarea name="description" defaultValue={editing.description ?? ''} />
            </label>
            <Button type="submit" className="justify-self-end">Enregistrer</Button>
          </form>
        ) : null}
      </ResourceDialog>
      {error || query.error ? <ErrorState message={error || String(query.error)} retry={() => void query.refetch()} /> : null}
      {query.isPending ? <LoadingState /> : query.data?.length ? (
        <DataTable rows={query.data} columns={columns} getRowKey={(item) => item.id} caption="Paramètres système" />
      ) : <EmptyState>Aucun paramètre exposé.</EmptyState>}
    </AdminSection>
  );
}
