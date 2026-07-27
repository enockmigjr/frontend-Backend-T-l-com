'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Category } from '@/features/users/api/types';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { createCategory, deleteCategory, listCategories, updateCategory } from './api';
const targetRoles = [
  'CUSTOMER_SERVICE_AGENT',
  'NOC_ENGINEER',
  'BILLING_AGENT',
  'TECHNICAL_SUPPORT_ENGINEER',
  'FIELD_TECHNICIAN',
];
export function CategoriesPage() {
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => listCategories(signal).then((result) => result.data),
  });
  const items = query.data ?? [];
  const loading = query.isPending;
  const visibleError = error || (query.error instanceof Error ? query.error.message : '');
  const load = async () => {
    await query.refetch();
  };
  async function create(formData: FormData) {
    try {
      await createCategory({
        name: String(formData.get('name')),
        description: String(formData.get('description')) || undefined,
        targetRole: String(formData.get('targetRole')) || undefined,
      });
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Création impossible.');
    }
  }
  async function rename(item: Category) {
    const name = window.prompt('Nouveau nom', item.name);
    if (!name) return;
    try {
      await updateCategory(item.id, { name });
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Modification impossible.');
    }
  }
  async function remove(item: Category) {
    if (!window.confirm(`Supprimer ${item.name} ?`)) return;
    try {
      await deleteCategory(item.id);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Suppression refusée.');
    }
  }
  return (
    <AdminSection
      title="Catégories"
      description="Catégories dynamiques et rôle cible d’auto-assignation, tels qu’exposés par l’API."
    >
      <form action={create} className="grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          Nom
          <input required name="name" className="min-h-11 rounded-lg border px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          Description
          <input name="description" className="min-h-11 rounded-lg border px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          Rôle cible
          <select name="targetRole" className="min-h-11 rounded-lg border px-3">
            <option value="">Aucun</option>
            {targetRoles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </label>
        <button className="min-h-11 rounded-lg bg-blue-700 px-4 text-white md:col-start-3">Créer</button>
      </form>
      {visibleError ? <ErrorState message={visibleError} retry={() => void load()} /> : null}
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>Aucune catégorie.</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
            >
              <div>
                <strong>{item.name}</strong>
                <p className="text-sm text-zinc-600">
                  {item.description || 'Sans description'} · Cible : {item.targetRole || 'aucune'}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="min-h-11 rounded-lg border px-3" onClick={() => void rename(item)}>
                  Modifier
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
