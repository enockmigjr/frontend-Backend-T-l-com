'use client';

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardData } from '../api/dashboard-api';

function ChartFrame({
  title,
  summary,
  children,
}: {
  readonly title: string;
  readonly summary: string;
  readonly children: React.ReactNode;
}) {
  return (
    <figure className="rounded-xl border border-zinc-200 bg-white p-5">
      <figcaption>
        <h2 className="font-semibold text-zinc-950">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600">{summary}</p>
      </figcaption>
      <div className="mt-5 h-64" aria-hidden="true">
        {children}
      </div>
    </figure>
  );
}

export default function DashboardCharts({ data }: { readonly data: DashboardData }) {
  const statuses = data.statuses.data;
  const trend = data.resolution.trend.map((item) => ({
    ...item,
    label: new Date(item.period).toLocaleDateString('fr-FR'),
  }));
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartFrame
        title="Tickets par statut"
        summary={`${statuses.reduce((sum, item) => sum + item.count, 0)} tickets répartis sur ${statuses.length} statuts.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statuses}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#1d4ed8" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame
        title="Temps moyen de résolution"
        summary={`Moyenne ${data.resolution.overall.avgResolutionTimeMinutes} min; médiane ${data.resolution.overall.medianResolutionTimeMinutes} min; P90 ${data.resolution.overall.p90ResolutionTimeMinutes} min.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="avgResolutionTimeMinutes" stroke="#b45309" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
