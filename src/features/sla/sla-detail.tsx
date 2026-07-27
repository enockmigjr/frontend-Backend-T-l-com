'use client';

import { useQuery } from '@tanstack/react-query';
import { getPolicy } from './api';
import { Badge } from '@/components/ui/badge';
import { ErrorState, LoadingState } from '@/features/users/components/async-state';

const labels = { LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Haute', CRITICAL: 'Critique' } as const;

export function SlaDetail({ id }: Readonly<{ id: string }>) {
  const query = useQuery({
    queryKey: ['sla-policies', 'detail', id],
    queryFn: ({ signal }) => getPolicy(id, signal).then((result) => result.data),
  });
  if (query.isPending) return <LoadingState label="Chargement de la politique…" />;
  if (query.error) return <ErrorState message={query.error.message} retry={() => void query.refetch()} />;
  const policy = query.data;
  return (
    <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
      <Detail label="Catégorie" value={policy.categoryName ?? 'Catégorie inconnue'} />
      <Detail
        label="Priorité"
        value={
          <Badge variant={policy.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>
            {labels[policy.priority]}
          </Badge>
        }
      />
      <Detail label="Délai de première réponse" value={`${policy.firstResponseMinutes} minutes`} />
      <Detail label="Délai de résolution" value={`${policy.resolutionMinutes} minutes`} />
      <Detail label="Identifiant" value={policy.id} wide />
    </dl>
  );
}

function Detail({ label, value, wide }: Readonly<{ label: string; value: React.ReactNode; wide?: boolean }>) {
  return (
    <div className={`min-w-0 bg-card p-4 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}
