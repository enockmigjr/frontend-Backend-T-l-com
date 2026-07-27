'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { generateSla, generateTicket, generateWeekly, listReports } from './api';
export function ReportsPage() {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['reports'],
    queryFn: ({ signal }) => listReports(signal).then((result) => result.data),
  });
  const items = query.data ?? [];
  const loading = query.isPending;
  const visibleError = error || (query.error instanceof Error ? query.error.message : '');
  const load = async () => {
    await query.refetch();
  };
  async function generate(formData: FormData) {
    setNotice('');
    try {
      const type = String(formData.get('type'));
      const result =
        type === 'weekly'
          ? await generateWeekly()
          : type === 'ticket'
            ? await generateTicket(String(formData.get('ticketId')))
            : await generateSla(String(formData.get('from')), String(formData.get('to')));
      setNotice(`Demande acceptée (${result.data.reportId}). Le statut réel sera affiché après actualisation.`);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Génération impossible.');
    }
  }
  return (
    <AdminSection
      title="Rapports"
      description="Les générations PDF sont asynchrones. Seuls les états backend pending, completed ou failed sont affichés; aucune progression n’est simulée."
    >
      <form action={generate} className="grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-4">
        <label className="grid gap-1 text-sm">
          Type
          <select name="type" className="min-h-11 rounded-lg border px-3">
            <option value="weekly">Hebdomadaire</option>
            <option value="sla">SLA</option>
            <option value="ticket">Ticket</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Ticket (UUID)
          <input name="ticketId" className="min-h-11 rounded-lg border px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          Du
          <input name="from" type="date" className="min-h-11 rounded-lg border px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          Au
          <input name="to" type="date" className="min-h-11 rounded-lg border px-3" />
        </label>
        <button className="min-h-11 rounded-lg bg-blue-700 px-4 text-white md:col-start-4">
          Demander la génération
        </button>
      </form>
      {notice ? (
        <p role="status" className="rounded-lg bg-blue-50 p-4 text-blue-950">
          {notice}
        </p>
      ) : null}
      {visibleError ? <ErrorState message={visibleError} retry={() => void load()} /> : null}
      <button className="min-h-11 rounded-lg border px-4" onClick={() => void load()}>
        Actualiser les statuts
      </button>
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>Aucun rapport demandé.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-3">Demandé le</th>
                <th className="p-3">Type</th>
                <th className="p-3">État</th>
                <th className="p-3">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-t" key={item.id}>
                  <td className="p-3">{new Date(item.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="p-3">{item.type}</td>
                  <td className="p-3">
                    <span className="rounded-full border px-2 py-1">{item.status}</span>
                  </td>
                  <td className="p-3">
                    {item.status === 'completed' ? (
                      <a
                        className="inline-flex min-h-11 items-center text-blue-700 underline"
                        href={`/api/v1/reports/${item.id}/download`}
                      >
                        Télécharger
                      </a>
                    ) : item.status === 'failed' ? (
                      item.errorMessage || 'Échec sans détail'
                    ) : (
                      'Traitement en attente'
                    )}
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
