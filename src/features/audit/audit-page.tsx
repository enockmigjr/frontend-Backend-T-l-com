'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { auditSchema } from '@/features/users/api/validation';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { getAudit, listAudit } from './api';
import { redact } from './redact';
export function AuditPage() {
  const [selected, setSelected] = useState<z.infer<typeof auditSchema>>();
  const [error, setError] = useState('');
  const [query, setQuery] = useState(new URLSearchParams({ limit: '50' }));
  const auditQuery = useQuery({
    queryKey: ['audit', query.toString()],
    queryFn: ({ signal }) => listAudit(query, signal).then((result) => result.data),
  });
  const items = auditQuery.data ?? [];
  const loading = auditQuery.isPending;
  const visibleError = error || (auditQuery.error instanceof Error ? auditQuery.error.message : '');
  const load = async () => {
    await auditQuery.refetch();
  };
  function filter(formData: FormData) {
    const next = new URLSearchParams({ limit: '50' });
    for (const key of ['userId', 'action', 'entityType', 'from', 'to']) {
      const value = String(formData.get(key) ?? '');
      if (value) next.set(key, value);
    }
    setQuery(next);
  }
  async function detail(id: string) {
    try {
      setSelected((await getAudit(id)).data);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Détail indisponible.');
    }
  }
  return (
    <AdminSection
      title="Journal d’audit"
      description="Les filtres et le scope départemental sont appliqués par le backend. Les champs sensibles sont masqués dans le détail."
    >
      <form action={filter} className="grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-5">
        <label className="grid gap-1 text-sm">
          Utilisateur
          <input name="userId" className="min-h-11 rounded-lg border px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          Action
          <input name="action" className="min-h-11 rounded-lg border px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          Entité
          <select name="entityType" className="min-h-11 rounded-lg border px-3">
            <option value="">Toutes</option>
            {['ticket', 'user', 'department', 'sla_policy'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Du
          <input name="from" type="date" className="min-h-11 rounded-lg border px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          Au
          <input name="to" type="date" className="min-h-11 rounded-lg border px-3" />
        </label>
        <button className="min-h-11 rounded-lg bg-blue-700 px-4 text-white md:col-start-5">Filtrer</button>
      </form>
      {visibleError ? <ErrorState message={visibleError} retry={() => void load()} /> : null}
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>Aucun événement pour ces filtres.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entité</th>
                <th className="p-3">Utilisateur</th>
                <th className="p-3">Détail</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-t" key={item.id}>
                  <td className="p-3">{new Date(item.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="p-3">{item.action}</td>
                  <td className="p-3">
                    {item.entityType} · {item.entityId}
                  </td>
                  <td className="p-3">{item.userId}</td>
                  <td className="p-3">
                    <button className="min-h-11 rounded-lg border px-3" onClick={() => void detail(item.id)}>
                      Consulter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected ? (
        <section aria-labelledby="audit-detail" className="rounded-xl border bg-zinc-950 p-5 text-zinc-100">
          <div className="flex justify-between gap-3">
            <h2 id="audit-detail" className="font-semibold">
              Détail {selected.action}
            </h2>
            <button aria-label="Fermer le détail" className="min-h-11 px-3" onClick={() => setSelected(undefined)}>
              Fermer
            </button>
          </div>
          <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(
              {
                ancienneValeur: redact(selected.oldValue),
                nouvelleValeur: redact(selected.newValue),
                ip: selected.ipAddress,
                userAgent: selected.userAgent,
              },
              null,
              2,
            )}
          </pre>
        </section>
      ) : null}
    </AdminSection>
  );
}
