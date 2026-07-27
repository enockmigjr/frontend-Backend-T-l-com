'use client';

import { useQuery } from '@tanstack/react-query';
import { getDepartment } from './api';
import { Badge } from '@/components/ui/badge';
import { ErrorState, LoadingState } from '@/features/users/components/async-state';

export function DepartmentDetail({ id }: Readonly<{ id: string }>) {
  const query = useQuery({
    queryKey: ['departments', 'detail', id],
    queryFn: ({ signal }) => getDepartment(id, signal).then((result) => result.data),
  });
  if (query.isPending) return <LoadingState label="Chargement du département…" />;
  if (query.error) return <ErrorState message={query.error.message} retry={() => void query.refetch()} />;
  const item = query.data;
  return (
    <div className="grid gap-5">
      <section className="rounded-xl border p-4">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{item.description || 'Aucune description.'}</p>
      </section>
      <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
        <Detail
          label="Assignation automatique"
          value={
            <Badge variant={item.autoAssignmentEnabled ? 'secondary' : 'outline'}>
              {item.autoAssignmentEnabled ? 'Activée' : 'Désactivée'}
            </Badge>
          }
        />
        <Detail label="Stratégie" value={item.assignmentStrategy} />
        <Detail label="Charge maximale par agent" value={item.maxWorkloadPerAgent} />
        <Detail label="Créé le" value={new Date(item.createdAt).toLocaleString('fr-FR')} />
        <Detail label="Dernière modification" value={new Date(item.updatedAt).toLocaleString('fr-FR')} />
        <Detail label="Identifiant" value={item.id} />
      </dl>
    </div>
  );
}

function Detail({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="min-w-0 bg-card p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}
