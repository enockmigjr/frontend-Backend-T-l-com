'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadDashboard, type DashboardData } from '../api/dashboard-api';
import { DashboardTables } from './dashboard-tables';
import { ErrorState, LoadingState } from '@/features/users/components/async-state';

const DashboardCharts = dynamic(() => import('./dashboard-charts'), {
  ssr: false,
  loading: () => <LoadingState label="Chargement des graphiques…" />,
});
const date = (value: Date) => value.toISOString().slice(0, 10);

export function DashboardPage() {
  const today = new Date();
  const initialFrom = new Date(today);
  initialFrom.setDate(today.getDate() - 30);
  const [from, setFrom] = useState(date(initialFrom));
  const [to, setTo] = useState(date(today));
  const query = useQuery({
    queryKey: ['dashboard', from, to],
    queryFn: ({ signal }) => loadDashboard(from, to, signal),
  });
  const data: DashboardData | undefined = query.data;
  const error = query.error instanceof Error ? query.error.message : '';
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Supervision opérationnelle</h1>
          <p className="text-zinc-600">Sept vues backend, avec période explicite et tableaux accessibles.</p>
        </div>
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void query.refetch();
          }}
        >
          <label className="grid gap-1 text-sm">
            Du
            <input
              className="min-h-11 rounded-lg border px-3"
              type="date"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Au
            <input
              className="min-h-11 rounded-lg border px-3"
              type="date"
              value={to}
              min={from}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          <button className="min-h-11 self-end rounded-lg bg-blue-700 px-4 text-white">Actualiser</button>
        </form>
      </header>
      {error ? (
        <ErrorState message={error} retry={() => void query.refetch()} />
      ) : !data ? (
        <LoadingState label="Chargement des sept indicateurs…" />
      ) : (
        <>
          <p role="status" className="text-sm text-zinc-600">
            Données générées à {new Date(data.workload.generatedAt).toLocaleString('fr-FR')}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Tickets ouverts', data.overview.ticketVolume.openTickets],
              ['Résolus aujourd’hui', data.overview.ticketVolume.resolvedToday],
              ['Conformité SLA', `${data.overview.sla.complianceRate}%`],
              ['Non assignés', data.workload.summary.unassignedTickets],
            ].map(([label, value]) => (
              <article className="rounded-xl border bg-white p-5" key={label}>
                <p className="text-sm text-zinc-600">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
              </article>
            ))}
          </div>
          <DashboardCharts data={data} />
          <DashboardTables data={data} />
        </>
      )}
    </div>
  );
}
