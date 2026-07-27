'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Pencil, Tickets } from 'lucide-react';
import type { Setting } from '@/features/users/api/types';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { toast } from '@/components/ui/toast';
import { listSettings, updateSetting } from './api';

const descriptions: Readonly<Record<string, { label: string; hint: string; icon: typeof Clock3; type?: string }>> = {
  BUSINESS_HOURS_START: { label: 'Début des heures ouvrées', hint: 'Heure utilisée par le moteur SLA.', icon: Clock3, type: 'time' },
  BUSINESS_HOURS_END: { label: 'Fin des heures ouvrées', hint: 'Heure de fin utilisée par le moteur SLA.', icon: Clock3, type: 'time' },
  BUSINESS_DAYS: { label: 'Jours ouvrés', hint: 'Numéros ISO séparés par des virgules, lundi = 1.', icon: Clock3 },
  MAX_CONCURRENT_TICKETS: { label: 'Charge maximale par agent', hint: 'Limite utilisée lors de l’assignation.', icon: Tickets, type: 'number' },
};

export function SystemSettingsPanel({ canEdit }: Readonly<{ canEdit: boolean }>) {
  const [editing, setEditing] = useState<Setting | null>(null);
  const [error, setError] = useState('');
  const query = useQuery({ queryKey: ['settings'], queryFn: ({ signal }) => listSettings(signal).then((result) => result.data) });

  async function save(formData: FormData) {
    if (!editing) return;
    try {
      await updateSetting(editing.key, String(formData.get('value')), editing.description ?? undefined);
      await query.refetch();
      setEditing(null);
      toast.add({ title: 'Paramètre système mis à jour' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Modification impossible.');
    }
  }

  if (query.isPending) return <LoadingState />;
  if (error || query.error) return <ErrorState message={error || String(query.error)} retry={() => void query.refetch()} />;
  if (!query.data?.length) return <EmptyState>Aucun paramètre système exposé.</EmptyState>;
  return (
    <>
      <ResourceDialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }} title={editing ? descriptions[editing.key]?.label ?? editing.key : ''}>
        {editing ? (
          <form action={save} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">Valeur
              <Input required name="value" type={descriptions[editing.key]?.type ?? 'text'} defaultValue={editing.value} />
            </label>
            <p className="text-sm text-muted-foreground">{descriptions[editing.key]?.hint ?? editing.description}</p>
            <Button type="submit" className="justify-self-end">Enregistrer</Button>
          </form>
        ) : null}
      </ResourceDialog>
      <div className="grid gap-4 md:grid-cols-2">
        {query.data.map((item) => {
          const metadata = descriptions[item.key];
          const Icon = metadata?.icon ?? Clock3;
          return (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Icon className="size-4" />{metadata?.label ?? item.key}</CardTitle>
                <CardDescription>{metadata?.hint ?? item.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <strong className="text-xl">{item.value}</strong>
                {canEdit ? <Button variant="outline" size="sm" onClick={() => setEditing(item)}><Pencil />Modifier</Button> : <span className="text-xs text-muted-foreground">Lecture seule</span>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
