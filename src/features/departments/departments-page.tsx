'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Department } from '@/features/users/api/types';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { createDepartment, deleteDepartment, listDepartments, updateDepartment } from './api';

export function DepartmentsPage() {
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['departments'],
    queryFn: ({ signal }) => listDepartments(signal).then((result) => result.data),
  });
  const items = query.data ?? [];
  const loading = query.isPending;
  const visibleError = error || (query.error instanceof Error ? query.error.message : '');
  const load = async () => {
    await query.refetch();
  };
  async function create(formData: FormData) {
    try {
      await createDepartment({
        name: String(formData.get('name')),
        description: String(formData.get('description')) || undefined,
      });
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Création impossible.');
    }
  }
  async function rename(item: Department) {
    const name = window.prompt('Nouveau nom', item.name);
    if (!name) return;
    try {
      await updateDepartment(item.id, { name });
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Modification impossible.');
    }
  }
  async function remove(item: Department) {
    if (!window.confirm(`Supprimer ${item.name} ?`)) return;
    try {
      await deleteDepartment(item.id);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Suppression refusée. Vérifiez les dépendances actives.');
    }
  }
  return (
    <AdminSection
      title="Départements"
      description="Référentiel global. Les mutations sont réservées à l’administrateur et les suppressions restent protégées par le backend."
    >
      <form action={create} className="flex flex-wrap gap-3 rounded-xl border bg-white p-5">
        <label className="grid flex-1 gap-1 text-sm">
          Nom
          <input required name="name" className="min-h-11 rounded-lg border px-3" />
        </label>
        <label className="grid flex-[2] gap-1 text-sm">
          Description
          <input name="description" className="min-h-11 rounded-lg border px-3" />
        </label>
        <button className="min-h-11 self-end rounded-lg bg-blue-700 px-4 text-white">Créer</button>
      </form>
      {visibleError ? <ErrorState message={visibleError} retry={() => void load()} /> : null}
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>Aucun département.</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
            >
              <div>
                <strong>{item.name}</strong>
                <p className="text-sm text-zinc-600">{item.description || 'Sans description'}</p>
              </div>
              <div className="flex gap-2">
                <button className="min-h-11 rounded-lg border px-3" onClick={() => void rename(item)}>
                  Renommer
                </button>
                <button
                  className="min-h-11 rounded-lg border border-red-300 px-3 text-red-800"
                  onClick={() => void remove(item)}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminSection>
  );
}
