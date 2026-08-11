import type { DashboardData } from '../api/dashboard-api';

export function DashboardTables({ data }: { readonly data: DashboardData }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="overflow-x-auto rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Alternative tabulaire — statuts</h2>
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
      <section className="overflow-x-auto rounded-xl border bg-white p-5">
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
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="overflow-x-auto rounded-xl border bg-white p-5 xl:col-span-2">
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
    </div>
  );
}
