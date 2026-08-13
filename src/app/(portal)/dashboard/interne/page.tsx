'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, ListChecks, RadioTower, RefreshCw, Users } from 'lucide-react';
import { loadDashboard } from '@/features/dashboard/api/dashboard-api';
import { DashboardTables } from '@/features/dashboard/components/dashboard-tables';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/features/users/components/async-state';

const DashboardCharts = dynamic(() => import('@/features/dashboard/components/dashboard-charts'), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-xl" />,
});

const date = (value: Date) => value.toISOString().slice(0, 10);

export default function InternalDashboardPage() {
  const today = new Date();
  const initialFrom = new Date(today);
  initialFrom.setDate(today.getDate() - 30);
  const [from, setFrom] = useState(date(initialFrom));
  const [to, setTo] = useState(date(today));
  const query = useQuery({
    queryKey: ['dashboard', 'interne', from, to],
    queryFn: ({ signal }) => loadDashboard(from, to, signal),
  });

  const data = query.data;
  const metrics = data
    ? [
        { label: 'Tickets sur la période', value: data.overview.ticketVolume.total, icon: ListChecks, tone: 'text-violet-700' },
        { label: 'Tickets ouverts', value: data.overview.ticketVolume.openTickets, icon: RadioTower, tone: 'text-blue-700' },
        { label: 'Résolus aujourd’hui', value: data.overview.ticketVolume.resolvedToday, icon: CheckCircle2, tone: 'text-emerald-700' },
        { label: 'SLA en retard', value: data.overview.sla.overdue ?? 0, icon: AlertTriangle, tone: 'text-red-700' },
        { label: 'Conformité SLA', value: `${data.overview.sla.complianceRate}%`, icon: CheckCircle2, tone: 'text-emerald-700' },
        { label: 'Agents actifs', value: data.workload.summary.totalAgents, icon: Users, tone: 'text-indigo-700' },
        {
          label: 'Résolution moyenne',
          value:
            (data.resolution.overall.resolvedCount ?? 0) === 0
              ? '—'
              : `${Math.round(data.resolution.overall.avgResolutionTimeMinutes)} min`,
          icon: Clock3,
          tone: 'text-amber-700',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Centre de supervision</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Tableau de bord interne</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Toutes les statistiques opérationnelles, sans l&apos;onglet support public.
          </p>
        </div>
        <form
          className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-2 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void query.refetch();
          }}
        >
          <label className="grid gap-1 px-1 text-xs font-medium text-muted-foreground">
            Du
            <Input className="h-9 w-36 bg-background" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="grid gap-1 px-1 text-xs font-medium text-muted-foreground">
            Au
            <Input className="h-9 w-36 bg-background" type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} />
          </label>
          <Button type="submit" size="sm" className="h-9" disabled={query.isFetching}>
            <RefreshCw aria-hidden className={query.isFetching ? 'animate-spin' : ''} />
            Actualiser
          </Button>
        </form>
      </header>

      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline">
        <ArrowLeft aria-hidden className="size-4" />
        Retour au tableau de bord
      </Link>

      {query.error ? (
        <ErrorState message={query.error.message} retry={() => void query.refetch()} />
      ) : !data ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            {metrics.map(({ label, value, icon: Icon, tone }) => (
              <Card key={label} className="gap-3 py-4 shadow-sm">
                <CardHeader className="flex-row items-center justify-between px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                  <Icon aria-hidden className={`size-4 ${tone}`} />
                </CardHeader>
                <CardContent className="px-4">
                  <p className="font-mono text-2xl font-semibold tracking-tight">{value}</p>
                </CardContent>
              </Card>
            ))}
          </section>
          <DashboardCharts data={data} />
          <DashboardTables data={data} showTabs={false} />
        </>
      )}
    </div>
  );
}
