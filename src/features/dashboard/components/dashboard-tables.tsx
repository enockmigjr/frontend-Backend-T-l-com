import type { DashboardData } from '../api/dashboard-api';

export function DashboardTables({ data }: Readonly<{ data: DashboardData }>) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Vue d&apos;ensemble interne</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Statuts, charge des équipes, départements et performance des agents.
          </p>
        </div>
      </div>

      <section className="min-w-0 overflow-x-auto rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Répartition par statut</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2">Statut</th>
              <th>Tickets</th>
              <th>Âge moyen</th>
              <th>Part</th>
            </tr>
          </thead>
          <tbody>
            {data.statuses.data.map((item) => (
              <tr className="border-t" key={item.status}>
                <td className="py-2">{item.status}</td>
                <td>{item.count}</td>
                <td>{item.avgAgeMinutes} min</td>
                <td>{item.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="min-w-0 overflow-x-auto rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Charge des agents</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.workload.summary.unassignedTickets} ticket(s) non assigné(s) ·{' '}
          {data.workload.summary.absentAgentsCount ?? 0} agent(s) en pause ou en absence.
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2">Agent</th>
              <th>Ouverts</th>
              <th>Critiques</th>
              <th>À risque SLA</th>
              <th>En retard</th>
              <th>Disponibilité</th>
              <th>Dernière activité</th>
            </tr>
          </thead>
          <tbody>
            {data.workload.data.map((item) => (
              <tr className="border-t" key={item.agentId}>
                <td className="py-2">
                  {[item.firstName, item.lastName].filter(Boolean).join(' ') || item.email || item.agentId}
                </td>
                <td>{item.openTicketsCount}</td>
                <td>{item.criticalTicketsCount}</td>
                <td className={item.slaAtRiskCount > 0 ? 'font-semibold text-red-700 dark:text-red-300' : ''}>
                  {item.slaAtRiskCount}
                </td>
                <td className={item.overdueTicketsCount ? 'font-semibold text-red-700 dark:text-red-300' : ''}>
                  {item.overdueTicketsCount ?? 0}
                </td>
                <td>
                  {item.isAvailable === false
                    ? 'En pause'
                    : item.absenceEndsAt && new Date(item.absenceEndsAt) > new Date()
                      ? 'En absence'
                      : 'Disponible'}
                </td>
                <td className={isInactive(item.lastActivityAt) ? 'text-red-700 dark:text-red-300' : ''}>
                  {formatLastActivity(item.lastActivityAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="min-w-0 overflow-x-auto rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Performance des départements</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2">Département</th>
              <th>Total</th>
              <th>Ouverts</th>
              <th>Résolus</th>
              <th>Conformes SLA</th>
              <th>Violations SLA</th>
            </tr>
          </thead>
          <tbody>
            {data.departments.data.map((item) => (
              <tr className="border-t" key={item.departmentId}>
                <td className="py-2">{item.departmentName ?? item.departmentId}</td>
                <td>{item.total}</td>
                <td>{item.open}</td>
                <td>{item.resolved}</td>
                <td>{item.slaCompliant}</td>
                <td>{item.slaBreached}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="min-w-0 overflow-x-auto rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Performance des agents</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Résolutions et délais sur la période · violations SLA cumulées · dernière activité.
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2">Agent</th>
              <th>Ouverts</th>
              <th>Résolus</th>
              <th>SLA dépassés</th>
              <th>Délai moyen</th>
              <th>En retard</th>
              <th>Dernière activité</th>
            </tr>
          </thead>
          <tbody>
            {data.agentPerformance.data.map((item, index) => (
              <tr className="border-t" key={`${item.agentId ?? item.email ?? 'agent'}-${index}`}>
                <td className="py-2">
                  {[item.firstName, item.lastName].filter(Boolean).join(' ') || item.email || 'Agent'}
                  {item.departmentName ? <p className="text-xs text-muted-foreground">{item.departmentName}</p> : null}
                </td>
                <td>{item.openTicketsCount}</td>
                <td>{item.resolvedInPeriod}</td>
                <td className={item.slaBreachedCount > 0 ? 'font-semibold text-red-700 dark:text-red-300' : ''}>
                  {item.slaBreachedCount}
                </td>
                <td>{item.resolvedInPeriod > 0 ? `${item.avgResolutionMinutes} min` : '—'}</td>
                <td className={item.overdueTicketsCount > 0 ? 'font-semibold text-red-700 dark:text-red-300' : ''}>
                  {item.overdueTicketsCount}
                </td>
                <td className={isInactive(item.lastActivityAt) ? 'text-red-700 dark:text-red-300' : ''}>
                  {formatLastActivity(item.lastActivityAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export function channelLabel(channel: string): string {
  const labels: Record<string, string> = {
    INTERNAL: 'Interne',
    WEB_PORTAL: 'Portail web',
    WIDGET: 'Widget',
    WORDPRESS: 'WordPress',
    EMAIL: 'E-mail',
    WHATSAPP: 'WhatsApp',
    API: 'API',
  };
  return labels[channel] ?? channel;
}

function formatLastActivity(value?: string | null): string {
  if (!value) return 'Aucune activité';
  const elapsedHours = (Date.now() - new Date(value).getTime()) / 3_600_000;
  if (elapsedHours < 1) return 'À l’instant';
  if (elapsedHours < 24) return `Il y a ${Math.round(elapsedHours)} h`;
  return `Il y a ${Math.round(elapsedHours / 24)} j`;
}

function isInactive(value?: string | null): boolean {
  if (!value) return true;
  return Date.now() - new Date(value).getTime() > 48 * 3_600_000;
}
