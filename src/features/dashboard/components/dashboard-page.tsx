'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, CircleCheck, Clock3, RadioTower, RefreshCw, TicketCheck } from 'lucide-react';
import { loadDashboard, type DashboardData } from '../api/dashboard-api';
import { DashboardTables } from './dashboard-tables';
import { ErrorState } from '@/features/users/components/async-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardCharts = dynamic(() => import('./dashboard-charts'), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-xl" />,
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
  const data = query.data;
  const error = query.error instanceof Error ? query.error.message : '';

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Centre de supervision</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">État des opérations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Priorisez les incidents, les risques SLA et la charge des équipes.</p>
        </div>
        <form
          className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-2 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void query.refetch();
          }}
        >
          <DateField label="Du" value={from} max={to} onChange={setFrom} />
          <DateField label="Au" value={to} min={from} onChange={setTo} />
          <Button type="submit" size="lg" disabled={query.isFetching}>
            <RefreshCw aria-hidden className={query.isFetching ? 'animate-spin' : ''} />
            Actualiser
          </Button>
        </form>
      </header>

      {error ? (
        <ErrorState message={error} retry={() => void query.refetch()} />
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <DashboardContent data={data} />
      )}
    </div>
  );
}

function DashboardContent({ data }: Readonly<{ data: DashboardData }>) {
  const critical = data.overview.byPriority.CRITICAL ?? 0;
  const generatedAt = new Date(data.workload.generatedAt).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const metrics = [
    { label: 'Tickets ouverts', value: data.overview.ticketVolume.openTickets, icon: RadioTower, tone: 'text-blue-700' },
    { label: 'Créés aujourd’hui', value: data.overview.ticketVolume.createdToday, icon: TicketCheck, tone: 'text-slate-700' },
    { label: 'Conformité SLA', value: `${data.overview.sla.complianceRate}%`, icon: CircleCheck, tone: 'text-emerald-700' },
    {
      label: 'Résolution moyenne',
      value: `${Math.round(data.resolution.overall.avgResolutionTimeMinutes)} min`,
      icon: Clock3,
      tone: 'text-amber-700',
    },
  ];

  return (
    <>
      <section className="grid gap-px overflow-hidden rounded-xl border bg-border shadow-sm md:grid-cols-3">
        <Attention label="Tickets critiques" value={critical} description="À traiter en priorité" critical={critical > 0} />
        <Attention
          label="SLA dépassés"
          value={data.overview.sla.breached}
          description={`${data.overview.sla.atRisk} supplémentaires à risque`}
          critical={data.overview.sla.breached > 0}
        />
        <Attention
          label="Tickets non assignés"
          value={data.workload.summary.unassignedTickets}
          description="À distribuer aux équipes"
          critical={data.workload.summary.unassignedTickets > 0}
        />
      </section>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays aria-hidden className="size-3.5" />
        Dernière consolidation : {generatedAt}
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      <DashboardTables data={data} />
    </>
  );
}

function Attention(props: Readonly<{ label: string; value: number; description: string; critical: boolean }>) {
  return (
    <article className="flex items-center gap-4 bg-card p-4">
      <span className={`grid size-10 place-items-center rounded-lg ${props.critical ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
        <AlertTriangle aria-hidden className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium">{props.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{props.description}</p>
      </div>
      <strong className="ml-auto font-mono text-2xl">{props.value}</strong>
    </article>
  );
}

function DateField(props: Readonly<{ label: string; value: string; min?: string; max?: string; onChange: (value: string) => void }>) {
  return (
    <label className="grid gap-1 px-1 text-xs font-medium text-muted-foreground">
      {props.label}
      <Input
        className="h-9 w-36 bg-background"
        type="date"
        value={props.value}
        min={props.min}
        max={props.max}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
