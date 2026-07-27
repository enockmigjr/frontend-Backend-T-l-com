'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SlaPolicy } from '@/features/users/api/types';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { createPolicy, listPolicies, updatePolicy } from './api';
import { z } from 'zod';
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const prioritySchema = z.enum(priorities);
export function SlaPage() {
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['sla-policies'],
    queryFn: ({ signal }) => listPolicies(signal).then((result) => result.data),
  });
  const items = query.data ?? [];
  const loading = query.isPending;
  const visibleError = error || (query.error instanceof Error ? query.error.message : '');
  const load = async () => {
    await query.refetch();
  };
  async function create(formData: FormData) {
    try {
      await createPolicy({
        categoryId: String(formData.get('categoryId')),
        priority: prioritySchema.parse(formData.get('priority')),
        firstResponseMinutes: Number(formData.get('firstResponseMinutes')),
        resolutionMinutes: Number(formData.get('resolutionMinutes')),
      });
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Création impossible.');
    }
  }
  async function edit(item: SlaPolicy) {
    const resolution = window.prompt('Délai de résolution (minutes)', String(item.resolutionMinutes));
    if (!resolution) return;
    try {
      await updatePolicy(item.id, { resolutionMinutes: Number(resolution) });
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Modification impossible.');
    }
  }
  return (
    <AdminSection
      title="Politiques SLA"
      description="La lecture est disponible aux rôles concernés; création et modification restent administrateur uniquement. L’API ne prévoit pas de suppression."
    >
      <form action={create} className="grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-4">
        <label className="grid gap-1 text-sm">
          Catégorie (UUID)
          <input required name="categoryId" className="min-h-11 rounded-lg border px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          Priorité
          <select name="priority" className="min-h-11 rounded-lg border px-3">
            {priorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Première réponse (min)
          <input
            required
            min="1"
            type="number"
            name="firstResponseMinutes"
            className="min-h-11 rounded-lg border px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Résolution (min)
          <input required min="1" type="number" name="resolutionMinutes" className="min-h-11 rounded-lg border px-3" />
        </label>
        <button className="min-h-11 rounded-lg bg-blue-700 px-4 text-white md:col-start-4">Créer</button>
      </form>
      {visibleError ? <ErrorState message={visibleError} retry={() => void load()} /> : null}
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>Aucune politique SLA.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Priorité</th>
                <th className="p-3">Première réponse</th>
                <th className="p-3">Résolution</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-t" key={item.id}>
                  <td className="p-3">{item.categoryName ?? item.categoryId}</td>
                  <td className="p-3">{item.priority}</td>
                  <td className="p-3">{item.firstResponseMinutes} min</td>
                  <td className="p-3">{item.resolutionMinutes} min</td>
                  <td className="p-3">
                    <button onClick={() => void edit(item)} className="min-h-11 rounded-lg border px-3">
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminSection>
  );
}
