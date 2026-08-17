'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessagesSquare, RefreshCw, Star, Timer, Users } from 'lucide-react';
import { loadDashboard } from '@/features/dashboard/api/dashboard-api';
import { channelLabel } from '@/features/dashboard/components/dashboard-tables';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/features/users/components/async-state';

const PublicCharts = dynamic(() => import('./charts'), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-xl" />,
});

const date = (value: Date) => value.toISOString().slice(0, 10);

export default function PublicSupportDashboardPage() {
  const today = new Date();
  const initialFrom = new Date(today);
  initialFrom.setDate(today.getDate() - 30);
  const [from, setFrom] = useState(date(initialFrom));
  const [to, setTo] = useState(date(today));
  const query = useQuery({
    queryKey: ['dashboard', 'public-support', from, to],
    queryFn: ({ signal }) => loadDashboard(from, to, signal),
  });

  const data = query.data;
  const summary = data?.publicSupport.summary;
  const metrics = summary
    ? [
        {
          label: 'Conversations',
          value: summary.totalConversations,
          icon: MessagesSquare,
          tone: 'text-blue-700 dark:text-blue-300',
        },
        {
          label: 'Ouvertes',
          value: summary.openConversations,
          icon: MessagesSquare,
          tone: 'text-amber-700 dark:text-amber-300',
        },
        {
          label: "Aujourd'hui",
          value: summary.conversationsToday,
          icon: Timer,
          tone: 'text-slate-700 dark:text-slate-300',
        },
        {
          label: 'Demandeurs actifs',
          value: summary.activeRequesters,
          icon: Users,
          tone: 'text-indigo-700 dark:text-indigo-300',
        },
        {
          label: 'Tickets publics',
          value: summary.publicTickets,
          icon: MessagesSquare,
          tone: 'text-violet-700 dark:text-violet-300',
        },
        {
          label: 'Réponses envoyées',
          value: summary.publicRepliesSent,
          icon: MessagesSquare,
          tone: 'text-emerald-700 dark:text-emerald-300',
        },
        {
          label: 'Messages',
          value: summary.totalMessages,
          icon: MessagesSquare,
          tone: 'text-cyan-700 dark:text-cyan-300',
        },
        {
          label: '1re réponse moyenne',
          value: `${summary.avgFirstResponseMinutes} min`,
          icon: Timer,
          tone: 'text-amber-700 dark:text-amber-300',
        },
        {
          label: 'Satisfaction moyenne',
          value: summary.satisfaction?.avgNote ? `${summary.satisfaction.avgNote}/5` : '—',
          icon: Star,
          tone: 'text-emerald-700 dark:text-emerald-300',
        },
        {
          label: 'Satisfactions reçues',
          value: summary.satisfaction ? `${summary.satisfaction.submitted}/${summary.satisfaction.invited}` : '—',
          icon: Star,
          tone: 'text-slate-700 dark:text-slate-300',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Centre de supervision</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Support public &amp; externe</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Conversations, demandeurs, canaux et satisfaction des canaux publics.
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
            <Input
              className="h-9 w-36 bg-background"
              type="date"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="grid gap-1 px-1 text-xs font-medium text-muted-foreground">
            Au
            <Input
              className="h-9 w-36 bg-background"
              type="date"
              value={to}
              min={from}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          <Button type="submit" size="sm" className="h-9" disabled={query.isFetching}>
            <RefreshCw aria-hidden className={query.isFetching ? 'animate-spin' : ''} />
            Actualiser
          </Button>
        </form>
      </header>

      {query.error ? (
        <ErrorState message={query.error.message} retry={() => void query.refetch()} />
      ) : !data ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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

          <PublicCharts data={data} />

          <section className="min-w-0 overflow-x-auto rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Conversations par canal</h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="py-2">Canal</th>
                  <th>Conversations</th>
                  <th>Tickets</th>
                </tr>
              </thead>
              <tbody>
                {data.publicSupport.byChannel.length > 0 ? (
                  data.publicSupport.byChannel.map((row) => (
                    <tr className="border-t" key={row.channel}>
                      <td className="py-2">{channelLabel(row.channel)}</td>
                      <td>{row.conversations}</td>
                      <td>{row.tickets}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td className="py-2 text-muted-foreground" colSpan={3}>
                      Aucune donnée publique.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="min-w-0 overflow-x-auto rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Demandeurs récents</h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="py-2">Demandeur</th>
                  <th>Inscrit le</th>
                  <th>Dernière activité</th>
                </tr>
              </thead>
              <tbody>
                {data.publicSupport.recentRequesters.length > 0 ? (
                  data.publicSupport.recentRequesters.map((item) => (
                    <tr className="border-t" key={item.id}>
                      <td className="py-2">{item.displayName || 'Demandeur anonyme'}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td>
                        {item.lastSeenAt
                          ? new Date(item.lastSeenAt).toLocaleString('fr-FR', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'Jamais'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td className="py-2 text-muted-foreground" colSpan={3}>
                      Aucun demandeur pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
