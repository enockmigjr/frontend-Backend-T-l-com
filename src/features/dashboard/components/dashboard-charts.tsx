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
    </section>
  );
}
