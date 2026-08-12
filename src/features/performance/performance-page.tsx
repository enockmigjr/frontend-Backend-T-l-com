'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowDownUp, Download } from 'lucide-react';
import { loadAgentPerformance, type AgentPerformanceData } from '@/features/dashboard/api/dashboard-api';
import { AdminSection } from '@/features/users/components/admin-section';
import { ErrorState, LoadingState } from '@/features/users/components/async-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const date = (value: Date) => value.toISOString().slice(0, 10);

export function PerformancePage() {
  const today = new Date();
  const initialFrom = new Date(today);
  initialFrom.setMonth(today.getMonth() - 1);
  const [from, setFrom] = useState(date(initialFrom));
  const [to, setTo] = useState(date(today));
  const [sortBy, setSortBy] = useState<'score' | 'openTicketsCount' | 'resolvedInPeriod'>('score');
  const query = useQuery({
    queryKey: ['agent-performance', from, to, sortBy],
    queryFn: ({ signal }) => loadAgentPerformance(from, to, signal),
  });

  if (query.error) return <ErrorState message={query.error.message} retry={() => void query.refetch()} />;
  if (query.isPending || !query.data) return <LoadingState label="Calcul des performances…" />;

  const rows = [...query.data.data].sort((a, b) => b[sortBy] - a[sortBy]);
  return (
    <AdminSection
      title="Performance des agents"
      description="Métriques d'activité, de SLA et d'efficacité avec score pondéré (40 % SLA, 30 % volume résolu, 20 % vitesse, 10 % réouvertures)."
      action={
        <Button variant="outline" onClick={() => exportCsv(rows)}>
          <Download />Exporter CSV
        </Button>
      }
    >
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
        <label className="grid gap-1 px-1 text-xs font-medium text-muted-foreground">
          Tri
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            className="h-9 rounded-lg border bg-background px-2 text-sm"
          >
            <option value="score">Score</option>
            <option value="resolvedInPeriod">Résolus</option>
            <option value="openTicketsCount">Ouverts</option>
          </select>
        </label>
        <Button type="submit" size="sm">
          <ArrowDownUp />Actualiser
        </Button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-3 pl-4 pr-3">Agent</th>
              <th className="px-3">Score</th>
              <th className="px-3">Ouverts</th>
              <th className="px-3">En retard</th>
              <th className="px-3">Résolus</th>
              <th className="px-3">Clôturés</th>
              <th className="px-3">Réouverts</th>
              <th className="px-3">SLA dépassés</th>
              <th className="px-3">1re réponse</th>
              <th className="px-3">Délai moyen</th>
              <th className="px-3">Médiane</th>
              <th className="px-3">Dernière activité</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr className="border-b last:border-0" key={item.agentId ?? item.email ?? ''}>
                <td className="py-3 pl-4 pr-3">
                  {[item.firstName, item.lastName].filter(Boolean).join(' ') || item.email || 'Agent'}
                  {item.departmentName ? <p className="text-xs text-zinc-500">{item.departmentName}</p> : null}
                </td>
                <td className="px-3">
                  <span className={`rounded-md px-2 py-0.5 font-mono font-semibold ${scoreTone(item.score)}`}>{item.score}</span>
                </td>
                <td className="px-3">{item.openTicketsCount}</td>
                <td className={`px-3 ${item.overdueTicketsCount > 0 ? 'font-semibold text-red-700' : ''}`}>{item.overdueTicketsCount}</td>
                <td className="px-3">{item.resolvedInPeriod}</td>
                <td className="px-3">{item.closedInPeriod}</td>
                <td className={`px-3 ${item.reopenedCount > 0 ? 'text-red-700' : ''}`}>{item.reopenedCount}</td>
                <td className={`px-3 ${item.slaBreachedCount > 0 ? 'font-semibold text-red-700' : ''}`}>{item.slaBreachedCount}</td>
                <td className="px-3">{item.firstResponseComplianceRate}%</td>
                <td className="px-3">{item.resolvedInPeriod > 0 ? `${item.avgResolutionMinutes} min` : '—'}</td>
                <td className="px-3">{item.resolvedInPeriod > 0 ? `${item.medianResolutionMinutes} min` : '—'}</td>
                <td className={`px-3 pr-4 ${isInactive(item.lastActivityAt) ? 'text-red-700' : ''}`}>{formatLastActivity(item.lastActivityAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSection>
  );
}

function scoreTone(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-900';
  if (score >= 50) return 'bg-amber-100 text-amber-900';
  return 'bg-red-100 text-red-900';
}

function formatLastActivity(value?: string | null): string {
  if (!value) return 'Aucune';
  const elapsedHours = (Date.now() - new Date(value).getTime()) / 3_600_000;
  if (elapsedHours < 24) return `Il y a ${Math.max(1, Math.round(elapsedHours))} h`;
  return `Il y a ${Math.round(elapsedHours / 24)} j`;
}

function isInactive(value?: string | null): boolean {
  return Boolean(value && Date.now() - new Date(value).getTime() > 48 * 3_600_000);
}

function exportCsv(rows: AgentPerformanceData['data']) {
  const header = [
    'Agent',
    'Score',
    'Ouverts',
    'En retard',
    'Résolus',
    'Clôturés',
    'Réouverts',
    'SLA dépassés',
    '1re réponse %',
    'Délai moyen (min)',
    'Dernière activité',
  ];
  const lines = rows.map((row) =>
    [
      `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
      row.score,
      row.openTicketsCount,
      row.overdueTicketsCount,
      row.resolvedInPeriod,
      row.closedInPeriod,
      row.reopenedCount,
      row.slaBreachedCount,
      row.firstResponseComplianceRate,
      row.avgResolutionMinutes,
      row.lastActivityAt ?? '',
    ].join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'performance-agents.csv';
  link.click();
  URL.revokeObjectURL(url);
}
