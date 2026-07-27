import { Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DataColumn } from '@/components/ui/data-table';
import { listReports } from './api';

export type Report = Awaited<ReturnType<typeof listReports>>['data'][number];

const typeLabels = { 'weekly-report': 'Hebdomadaire', 'sla-report': 'SLA', 'ticket-report': 'Ticket' } as const;
const statusLabels = { pending: 'En traitement', completed: 'Disponible', failed: 'Échec' } as const;

export function reportColumns(onSelect: (report: Report) => void): readonly DataColumn<Report>[] {
  return [
    {
      key: 'date',
      label: 'Demandé le',
      sortValue: (item) => new Date(item.createdAt),
      cell: (item) => new Date(item.createdAt).toLocaleString('fr-FR'),
    },
    { key: 'type', label: 'Type', sortValue: (item) => item.type, cell: (item) => typeLabels[item.type] },
    {
      key: 'status',
      label: 'État',
      sortValue: (item) => item.status,
      cell: (item) => (
        <Badge variant={item.status === 'failed' ? 'destructive' : item.status === 'completed' ? 'default' : 'secondary'}>
          {statusLabels[item.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => onSelect(item)}>
            <Eye />Consulter
          </Button>
          {item.status === 'completed' ? (
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              render={<a href={`/api/v1/reports/${item.id}/download`} />}
            >
              <Download />Télécharger
            </Button>
          ) : null}
        </div>
      ),
    },
  ];
}
