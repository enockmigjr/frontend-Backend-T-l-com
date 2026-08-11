'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardData } from '../api/dashboard-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const statusColors = ['#1d4ed8', '#0f766e', '#b54708', '#64748b', '#7c3aed', '#b42318', '#0369a1'];

function ChartFrame({
  title,
  summary,
  children,
  className,
}: Readonly<{ title: string; summary: string; children: React.ReactNode; className?: string }>) {
  return (
    <Card className={`gap-0 overflow-hidden py-0 shadow-sm ${className ?? ''}`}>
      <CardHeader className="border-b px-5 py-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent className="h-72 p-4" aria-hidden="true">
        {children}
      </CardContent>
    </Card>
  );
}

export default function DashboardCharts({ data }: Readonly<{ data: DashboardData }>) {
  const statuses = data.statuses.data;
  const trend = data.resolution.trend.map((item) => ({
    ...item,
    label: new Date(item.period).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
  }));
  const priorities = data.priorities.data.map((item) => ({
    ...item,
    label: { LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Haute', CRITICAL: 'Critique' }[item.priority],
  }));
  const severities = Object.entries(data.overview.bySeverity).map(([severity, count]) => ({
    severity,
    count,
  }));
  const workload = [...data.workload.data]
    .sort((left, right) => right.openTicketsCount - left.openTicketsCount)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      agent: `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email || 'Agent',
    }));
  const slaTrend = (data.sla.trend ?? []).map((item) => ({
    ...item,
    label: new Date(item.period).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
  }));

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <ChartFrame
        className="xl:col-span-2"
        title="Temps moyen de résolution"
        summary={`Médiane ${Math.round(data.resolution.overall.medianResolutionTimeMinutes)} min · P90 ${Math.round(data.resolution.overall.p90ResolutionTimeMinutes)} min`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#dce3ea' }} />
            <Line
              type="monotone"
              dataKey="avgResolutionTimeMinutes"
              name="Temps moyen"
              stroke="#1d4ed8"
              strokeWidth={3}
              dot={{ r: 3, fill: '#1d4ed8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame
        title="Répartition par statut"
        summary={`${statuses.reduce((sum, item) => sum + item.count, 0)} tickets sur ${statuses.length} statuts actifs`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={statuses} dataKey="count" nameKey="status" innerRadius={58} outerRadius={92} paddingAngle={2}>
              {statuses.map((item, index) => <Cell key={item.status} fill={statusColors[index % statusColors.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#dce3ea' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame
        className="xl:col-span-2"
        title="Taux de conformité SLA par jour"
        summary={`${data.sla.summary.atRisk} ticket(s) à risque · ${data.sla.summary.overdue ?? 0} en retard`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={slaTrend} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} unit="%" />
            <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#dce3ea' }} />
            <Line
              type="monotone"
              dataKey="complianceRate"
              name="Conformité SLA"
              stroke="#0f766e"
              strokeWidth={3}
              dot={{ r: 3, fill: '#0f766e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame title="Priorités et violations SLA" summary="Comparez le volume et les dépassements par niveau de priorité">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={priorities} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#dce3ea' }} />
            <Bar dataKey="count" name="Tickets" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="slaBreaches" name="SLA dépassés" fill="#b42318" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame title="Répartition par sévérité" summary="Volume d’incidents selon leur impact opérationnel">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={severities} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="severity" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#dce3ea' }} />
            <Bar dataKey="count" name="Tickets" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame title="Charge des agents" summary="Les huit charges ouvertes les plus élevées">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={workload} layout="vertical" margin={{ top: 6, right: 12, left: 20, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="agent"
              width={92}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
            />
            <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#dce3ea' }} />
            <Bar dataKey="openTicketsCount" name="Tickets ouverts" fill="#0f766e" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </section>
  );
}
