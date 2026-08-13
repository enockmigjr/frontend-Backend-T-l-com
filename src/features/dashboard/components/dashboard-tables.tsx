import type { DashboardData } from '../api/dashboard-api';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function DashboardTables({
  data,
  showTabs = true,
}: Readonly<{ data: DashboardData; showTabs?: boolean }>) {
  const internal = (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <section className="min-w-0 overflow-x-auto rounded-xl border bg-white p-5">
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
      <section className="min-w-0 overflow-x-auto rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Charge des agents</h2>
        <p className="mt-1 text-sm text-zinc-600">
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
                <td className={item.slaAtRiskCount > 0 ? 'font-semibold text-red-700' : ''}>{item.slaAtRiskCount}</td>
                <td className={item.overdueTicketsCount ? 'font-semibold text-red-700' : ''}>
                  {item.overdueTicketsCount ?? 0}
                </td>
                <td>
                  {item.isAvailable === false
                    ? 'En pause'
                    : item.absenceEndsAt && new Date(item.absenceEndsAt) > new Date()
                      ? 'En absence'
                      : 'Disponible'}
                </td>
                <td className={isInactive(item.lastActivityAt) ? 'text-red-700' : ''}>
                  {formatLastActivity(item.lastActivityAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="min-w-0 overflow-x-auto rounded-xl border bg-white p-5 xl:col-span-2">
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
      <section className="min-w-0 overflow-x-auto rounded-xl border bg-white p-5 xl:col-span-2">
        <h2 className="font-semibold">Performance des agents</h2>
        <p className="mt-1 text-sm text-zinc-600">
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
                  {item.departmentName ? <p className="text-xs text-zinc-500">{item.departmentName}</p> : null}
                </td>
                <td>{item.openTicketsCount}</td>
                <td>{item.resolvedInPeriod}</td>
                <td className={item.slaBreachedCount > 0 ? 'font-semibold text-red-700' : ''}>
                  {item.slaBreachedCount}
                </td>
                <td>{item.resolvedInPeriod > 0 ? `${item.avgResolutionMinutes} min` : '—'}</td>
                <td className={item.overdueTicketsCount > 0 ? 'font-semibold text-red-700' : ''}>
                  {item.overdueTicketsCount}
                </td>
                <td className={isInactive(item.lastActivityAt) ? 'text-red-700' : ''}>
                  {formatLastActivity(item.lastActivityAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
        </div>
  );

  if (!showTabs) return internal;

  return (
    <Tabs defaultValue="interne">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <TabsList className="w-full justify-start bg-transparent p-0 sm:w-auto" variant="line">
          <TabsTrigger value="interne" className="min-h-9">Interne</TabsTrigger>
          <TabsTrigger value="public" className="min-h-9">Support public</TabsTrigger>
        </TabsList>
        <Link href="/dashboard/interne" className="text-sm font-medium text-blue-700 hover:underline">
          Vue interne complète →
        </Link>
      </div>
      <TabsContent value="interne">{internal}</TabsContent>
      <TabsContent value="public">
        <div className="grid gap-5">
          <section className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Support public</h2>
              <p className="text-xs text-zinc-500">
                Dernière consolidation : {new Date(data.publicSupport.generatedAt).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ['Conversations', data.publicSupport.summary.totalConversations],
                ['Ouvertes', data.publicSupport.summary.openConversations],
                ['Aujourd’hui', data.publicSupport.summary.conversationsToday],
                ['Demandeurs actifs', data.publicSupport.summary.activeRequesters],
                ['Tickets publics', data.publicSupport.summary.publicTickets],
                ['Réponses envoyées', data.publicSupport.summary.publicRepliesSent],
                ['Messages', data.publicSupport.summary.totalMessages],
                ['1re réponse moyenne', `${data.publicSupport.summary.avgFirstResponseMinutes} min`],
                ['Satisfaction moyenne', data.publicSupport.summary.satisfaction?.avgNote ? `${data.publicSupport.summary.satisfaction.avgNote}/5` : '—'],
                [
                  'Satisfactions reçues',
                  data.publicSupport.summary.satisfaction
                    ? `${data.publicSupport.summary.satisfaction.submitted}/${data.publicSupport.summary.satisfaction.invited}`
                    : '—',
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-slate-50 p-3">
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
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
                      <td className="py-2 text-zinc-500" colSpan={3}>
                        Aucune donnée publique.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function channelLabel(channel: string): string {
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
