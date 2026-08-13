'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock3, Gauge, ListChecks, RadioTower, TicketCheck } from 'lucide-react';
import Link from 'next/link';
import { loadMyActivity } from '../api/dashboard-api';
import { ErrorState, LoadingState } from '@/features/users/components/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MyActivityPage() {
  const query = useQuery({ queryKey: ['my-activity'], queryFn: ({ signal }) => loadMyActivity(signal) });
  if (query.isPending) return <LoadingState label="Chargement de mon activité…" />;
  if (query.error) return <ErrorState message={query.error.message} retry={() => void query.refetch()} />;

  const { profile, summary } = query.data;
  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Agent';
  const metrics = [
    { label: 'Tickets assignés (total)', value: summary.totalAssigned, icon: ListChecks, tone: 'text-slate-700' },
    { label: 'Tickets ouverts', value: summary.openTicketsCount, icon: ListChecks, tone: 'text-blue-700' },
    { label: 'Critiques', value: summary.criticalTicketsCount, icon: RadioTower, tone: 'text-red-700' },
    { label: 'En retard', value: summary.overdueTicketsCount, icon: AlertTriangle, tone: 'text-red-700' },
    { label: 'À risque SLA', value: summary.atRiskTicketsCount, icon: Gauge, tone: 'text-amber-700' },
    { label: 'Résolus ce mois', value: summary.resolvedThisMonth, icon: CheckCircle2, tone: 'text-emerald-700' },
    { label: 'Clôturés ce mois', value: summary.closedThisMonth, icon: TicketCheck, tone: 'text-emerald-700' },
    { label: 'SLA dépassés', value: summary.slaBreachedCount, icon: AlertTriangle, tone: 'text-red-700' },
    {
      label: 'Conformité 1re réponse',
      value: `${summary.firstResponseComplianceRate} %`,
      icon: Gauge,
      tone: 'text-blue-700',
    },
    {
      label: 'Délai moyen',
      value: summary.resolvedThisMonth > 0 ? `${summary.avgResolutionMinutes} min` : '—',
      icon: Clock3,
      tone: 'text-amber-700',
    },
    {
      label: 'Délai médian',
      value: summary.resolvedThisMonth > 0 ? `${summary.medianResolutionMinutes} min` : '—',
      icon: Clock3,
      tone: 'text-slate-700',
    },
    { label: 'Réouvertures', value: summary.reopenedCount, icon: CheckCircle2, tone: 'text-red-700' },
    { label: 'Dernière activité', value: formatLastActivity(summary.lastActivityAt), icon: TicketCheck, tone: 'text-slate-700' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Mon activité</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile?.departmentName ?? 'Équipe non renseignée'} ·{' '}
          {profile?.isAvailable === false
            ? 'En pause'
            : profile?.absenceEndsAt && new Date(profile.absenceEndsAt) > new Date()
              ? 'En absence'
              : 'Disponible'}
        </p>
      </header>
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
      <div className="flex gap-3">
        <Link
          href="/tickets/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Nouveau ticket
        </Link>
        <Link
          href="/tickets"
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Mes tickets
        </Link>
      </div>
    </div>
  );
}

function formatLastActivity(value: string | null): string {
  if (!value) return 'Aucune activité';
  const elapsedHours = (Date.now() - new Date(value).getTime()) / 3_600_000;
  if (elapsedHours < 1) return 'À l’instant';
  if (elapsedHours < 24) return `Il y a ${Math.round(elapsedHours)} h`;
  return `Il y a ${Math.round(elapsedHours / 24)} j`;
}
