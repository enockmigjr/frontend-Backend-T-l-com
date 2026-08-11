'use client';

import { useQuery } from '@tanstack/react-query';
import { getCategory } from './api';
import { ErrorState, LoadingState } from '@/features/users/components/async-state';

export function CategoryDetail({
  id,
  roleLabel,
}: Readonly<{ id: string; roleLabel: (role?: string | null) => string }>) {
  const query = useQuery({
    queryKey: ['categories', 'detail', id],
    queryFn: ({ signal }) => getCategory(id, signal).then((result) => result.data),
  });
  if (query.isPending) return <LoadingState label="Chargement de la catégorie…" />;
  if (query.error) return <ErrorState message={query.error.message} retry={() => void query.refetch()} />;
  const item = query.data;
  const roles = Array.isArray(item.targetRoles) && item.targetRoles.length > 0 ? item.targetRoles : item.targetRole ? [item.targetRole] : [];
  return (
    <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
      <Detail label="Nom" value={item.name} />
      <Detail label="Rôles d'orientation" value={roles.length > 0 ? roles.map(roleLabel).join(', ') : 'Aucune orientation'} />
      <Detail label="Description" value={item.description || 'Aucune description'} wide />
      <Detail label="Créée le" value={new Date(item.createdAt).toLocaleString('fr-FR')} />
      <Detail label="Modifiée le" value={new Date(item.updatedAt).toLocaleString('fr-FR')} />
      <Detail label="Identifiant" value={item.id} wide />
    </dl>
  );
}

function Detail({ label, value, wide }: Readonly<{ label: string; value: string; wide?: boolean }>) {
  return (
    <div className={`min-w-0 bg-card p-4 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}
