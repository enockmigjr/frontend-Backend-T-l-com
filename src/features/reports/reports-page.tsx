'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FilePlus2, RefreshCw } from 'lucide-react';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { ticketsApi } from '@/features/tickets/api';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { MutationError } from '@/components/ui/mutation-error';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { toast } from '@/components/ui/toast';
import { generateSla, generateTicket, generateWeekly, listReports } from './api';
import { ReportDetail } from './report-detail';
import { reportColumns, type Report } from './report-columns';

type ReportType = 'weekly' | 'sla' | 'ticket';

export function ReportsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState<ReportType>('weekly');
  const [error, setError] = useState<unknown>();
  const [selected, setSelected] = useState<Report>();
  const query = useQuery({
    queryKey: ['reports'],
    queryFn: ({ signal }) => listReports(signal).then((result) => result.data),
    refetchInterval: (state) => (state.state.data?.some((item) => item.status === 'pending') ? 5_000 : false),
  });
  const tickets = useQuery({
    queryKey: ['tickets', 'report-select'],
    queryFn: () => ticketsApi.list({ page: 1, limit: 100, order: 'desc' }),
    enabled: formOpen && type === 'ticket',
  });

  function changeFormOpen(open: boolean) {
    setFormOpen(open);
    setError(undefined);
  }

  async function generate(formData: FormData) {
    setError(undefined);
    try {
      const result =
        type === 'weekly'
          ? await generateWeekly()
          : type === 'ticket'
            ? await generateTicket(String(formData.get('ticketId')))
            : await generateSla(String(formData.get('from')), String(formData.get('to')));
      await query.refetch();
      setFormOpen(false);
      toast.add({
        title: 'Rapport demandé',
        description: `Suivi automatique activé pour ${result.data.reportId.slice(0, 8)}.`,
      });
    } catch (reason) {
      setError(reason);
    }
  }

  const columns = reportColumns(setSelected);

  return (
    <AdminSection
      title="Rapports"
      description="Générez les exports utiles, consultez leur contenu puis suivez leur disponibilité en temps réel."
      action={
        <Button onClick={() => changeFormOpen(true)}>
          <FilePlus2 />
          Nouveau rapport
        </Button>
      }
    >
      <ResourceDialog
        open={formOpen}
        onOpenChange={changeFormOpen}
        title="Demander un rapport"
        description="Seuls les champs utiles au type sélectionné sont affichés."
      >
        <form action={generate} className="grid min-w-0 gap-4">
          <MutationError error={error} />
          <label className="grid min-w-0 gap-2 text-sm font-medium">
            Type de rapport
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as ReportType);
                setError(undefined);
              }}
              className="h-10 w-full min-w-0 truncate rounded-lg border bg-background px-3"
            >
              <option value="weekly">Synthèse hebdomadaire</option>
              <option value="sla">Conformité SLA</option>
              <option value="ticket">Détail d’un ticket</option>
            </select>
          </label>
          {type === 'ticket' ? (
            <label className="grid min-w-0 gap-2 text-sm font-medium">
              Ticket
              <select
                required
                name="ticketId"
                className="h-10 w-full min-w-0 truncate rounded-lg border bg-background px-3"
              >
                <option value="">Sélectionner un ticket</option>
                {tickets.data?.data.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.ticketNumber} — {ticket.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {type === 'sla' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Du
                <Input required name="from" type="date" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Au
                <Input required name="to" type="date" />
              </label>
            </div>
          ) : null}
          {type === 'weekly' ? (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              La synthèse couvre automatiquement la période configurée.
            </p>
          ) : null}
          <Button type="submit" className="justify-self-end">
            Lancer la génération
          </Button>
        </form>
      </ResourceDialog>
      <ResourceDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        title="Détail du rapport"
        size="wide"
      >
        {selected ? <ReportDetail report={selected} /> : null}
      </ResourceDialog>
      {query.error ? <ErrorState message={query.error.message} retry={() => void query.refetch()} /> : null}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
          <RefreshCw />
          Actualiser
        </Button>
      </div>
      {query.isPending ? (
        <LoadingState />
      ) : query.data?.length ? (
        <DataTable rows={query.data} columns={columns} getRowKey={(item) => item.id} caption="Rapports générés" />
      ) : (
        <EmptyState>Aucun rapport demandé.</EmptyState>
      )}
    </AdminSection>
  );
}
