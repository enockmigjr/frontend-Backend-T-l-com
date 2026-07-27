'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FilePlus2, RefreshCw } from 'lucide-react';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { ticketsApi } from '@/features/tickets/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { toast } from '@/components/ui/toast';
import { generateSla, generateTicket, generateWeekly, listReports } from './api';

type ReportType = 'weekly' | 'sla' | 'ticket';
type Report = Awaited<ReturnType<typeof listReports>>['data'][number];
const typeLabels = { 'weekly-report': 'Hebdomadaire', 'sla-report': 'SLA', 'ticket-report': 'Ticket' } as const;
const statusLabels = { pending: 'En traitement', completed: 'Disponible', failed: 'Échec' } as const;

export function ReportsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState<ReportType>('weekly');
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['reports'],
    queryFn: ({ signal }) => listReports(signal).then((result) => result.data),
    refetchInterval: (state) => state.state.data?.some((item) => item.status === 'pending') ? 5_000 : false,
  });
  const tickets = useQuery({
    queryKey: ['tickets', 'report-select'],
    queryFn: () => ticketsApi.list({ page: 1, limit: 100, order: 'desc' }),
    enabled: formOpen && type === 'ticket',
  });

  async function generate(formData: FormData) {
    try {
      const result = type === 'weekly'
        ? await generateWeekly()
        : type === 'ticket'
          ? await generateTicket(String(formData.get('ticketId')))
          : await generateSla(String(formData.get('from')), String(formData.get('to')));
      setFormOpen(false);
      await query.refetch();
      toast.add({ title: 'Rapport demandé', description: `Suivi automatique activé pour ${result.data.reportId.slice(0, 8)}.` });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Génération impossible.');
    }
  }

  const columns: DataColumn<Report>[] = [
    { key: 'date', label: 'Demandé le', cell: (item) => new Date(item.createdAt).toLocaleString('fr-FR') },
    { key: 'type', label: 'Type', cell: (item) => typeLabels[item.type] },
    {
      key: 'status', label: 'État', cell: (item) => (
        <Badge variant={item.status === 'failed' ? 'destructive' : item.status === 'completed' ? 'default' : 'secondary'}>
          {statusLabels[item.status]}
        </Badge>
      ),
    },
    {
      key: 'result', label: 'Résultat', cell: (item) => item.status === 'completed' ? (
        <Button nativeButton={false} variant="outline" size="sm" render={<a href={`/api/v1/reports/${item.id}/download`} />}>
          <Download />Télécharger
        </Button>
      ) : item.status === 'failed' ? (item.errorMessage || 'Échec sans détail') : 'Le statut est actualisé automatiquement',
    },
  ];

  return (
    <AdminSection
      title="Rapports"
      description="Générez les exports utiles sans saisir d’identifiant technique, puis suivez leur disponibilité en temps réel."
      action={<Button onClick={() => setFormOpen(true)}><FilePlus2 />Nouveau rapport</Button>}
    >
      <ResourceDialog open={formOpen} onOpenChange={setFormOpen} title="Demander un rapport" description="Seuls les champs utiles au type sélectionné sont affichés.">
        <form action={generate} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">Type de rapport
            <select value={type} onChange={(event) => setType(event.target.value as ReportType)} className="h-10 rounded-lg border bg-background px-3">
              <option value="weekly">Synthèse hebdomadaire</option>
              <option value="sla">Conformité SLA</option>
              <option value="ticket">Détail d’un ticket</option>
            </select>
          </label>
          {type === 'ticket' ? (
            <label className="grid gap-2 text-sm font-medium">Ticket
              <select required name="ticketId" className="h-10 rounded-lg border bg-background px-3">
                <option value="">Sélectionner un ticket</option>
                {tickets.data?.data.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>{ticket.ticketNumber} — {ticket.title}</option>
                ))}
              </select>
            </label>
          ) : null}
          {type === 'sla' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">Du<Input required name="from" type="date" /></label>
              <label className="grid gap-2 text-sm font-medium">Au<Input required name="to" type="date" /></label>
            </div>
          ) : null}
          {type === 'weekly' ? <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">La synthèse couvre automatiquement la période hebdomadaire configurée.</p> : null}
          <Button type="submit" className="justify-self-end">Lancer la génération</Button>
        </form>
      </ResourceDialog>
      {error || query.error ? <ErrorState message={error || String(query.error)} retry={() => void query.refetch()} /> : null}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw />Actualiser</Button>
      </div>
      {query.isPending ? <LoadingState /> : query.data?.length ? (
        <DataTable rows={query.data} columns={columns} getRowKey={(item) => item.id} caption="Rapports générés" />
      ) : <EmptyState>Aucun rapport demandé.</EmptyState>}
    </AdminSection>
  );
}
