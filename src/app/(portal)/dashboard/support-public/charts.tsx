'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardData } from '@/features/dashboard/api/dashboard-api';
import { channelLabel } from '@/features/dashboard/components/dashboard-tables';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const palette = ['#1d4ed8', '#0f766e', '#b54708', '#64748b', '#7c3aed', '#b42318', '#0369a1'];

function Frame({
  title,
  summary,
  children,
}: Readonly<{ title: string; summary: string; children: React.ReactNode }>) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
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

export default function PublicSupportCharts({ data }: Readonly<{ data: DashboardData }>) {
  const channels = data.publicSupport.byChannel.map((row) => ({
    name: channelLabel(row.channel),
    value: row.conversations,
  }));
  const statuses = data.publicSupport.byStatus.map((row) => ({
    name: row.status,
    count: row.count,
  }));
  const totalConversations = data.publicSupport.summary.totalConversations;

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <Frame title="Répartition par canal" summary={`${totalConversations} conversations sur la période`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={channels} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
              {channels.map((entry, index) => (
                <Cell key={entry.name} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#dce3ea' }} />
          </PieChart>
        </ResponsiveContainer>
      </Frame>
      <Frame title="Conversations par statut" summary="État des conversations publiques">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statuses} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#dce3ea' }} />
            <Bar dataKey="count" name="Conversations" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Frame>
    </section>
  );
}
