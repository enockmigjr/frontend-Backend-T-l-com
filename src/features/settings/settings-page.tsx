'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Setting } from '@/features/users/api/types';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { listSettings, updateSetting } from './api';
import { useCurrentUser } from '@/features/users/components/access-gate';
export function SettingsPage() {
  const { user } = useCurrentUser();
  const canEdit = user?.role === 'ADMINISTRATOR';
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => listSettings(signal).then((result) => result.data),
  });
  const items = query.data ?? [];
  const loading = query.isPending;
  const visibleError = error || (query.error instanceof Error ? query.error.message : '');
  const load = async () => {
    await query.refetch();
  };
  async function edit(item: Setting) {
    const value = window.prompt(`Valeur de ${item.key}`, item.value);
    if (value === null) return;
    try {
      await updateSetting(item.key, value, item.description ?? undefined);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Modification impossible.');
    }
  }
  return (
    <AdminSection
      title="Paramètres"
      description="Lecture superviseur et administrateur; le backend refuse toute mutation non administrateur."
    >
      {visibleError ? <ErrorState message={visibleError} retry={() => void load()} /> : null}
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>Aucun paramètre exposé.</EmptyState>
      ) : (
        <dl className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
            >
              <div>
                <dt className="font-mono text-sm font-semibold">{item.key}</dt>
                <dd className="mt-1 text-zinc-700">{item.value}</dd>
                <dd className="text-sm text-zinc-500">{item.description || 'Sans description'}</dd>
              </div>
              {canEdit ? (
                <button onClick={() => void edit(item)} className="min-h-11 rounded-lg border px-3">
                  Modifier
                </button>
              ) : (
                <span className="text-sm text-zinc-500">Lecture seule</span>
              )}
            </div>
          ))}
        </dl>
      )}
    </AdminSection>
  );
}
