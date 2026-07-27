'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/features/users/components/async-state';
import { getReport, getSlaReport, getTicketReport } from './api';

type Report = Awaited<ReturnType<typeof getReport>>['data'];

export function ReportDetail({ report }: Readonly<{ report: Report }>) {
  const metadata = report.metadata ?? {};
  const ticketId = typeof metadata.ticketId === 'string' ? metadata.ticketId : '';
  const from = typeof metadata.from === 'string' ? metadata.from : '';
  const to = typeof metadata.to === 'string' ? metadata.to : '';
  const detail = useQuery({
    queryKey: ['report-detail', report.id, ticketId, from, to],
    queryFn: async () => {
      if (report.type === 'ticket-report' && ticketId) return (await getTicketReport(ticketId)).data;
      if (report.type === 'sla-report' && from && to) return (await getSlaReport(from, to)).data;
      return (await getReport(report.id)).data;
    },
  });

  if (detail.isPending) return <LoadingState label="Chargement du rapport…" />;
  if (detail.error) return <ErrorState message={detail.error.message} retry={() => void detail.refetch()} />;

  return (
    <div className="grid max-h-[min(75vh,48rem)] gap-5 overflow-y-auto overscroll-contain pr-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={report.status === 'failed' ? 'destructive' : report.status === 'completed' ? 'default' : 'outline'}>
          {report.status}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Demandé le {new Date(report.createdAt).toLocaleString('fr-FR')}
        </span>
      </div>
      {report.status === 'failed' && report.errorMessage ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {report.errorMessage}
        </p>
      ) : null}
      <DetailValue value={detail.data} />
    </div>
  );
}

function DetailValue({ value }: Readonly<{ value: unknown }>) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">Non renseigné</span>;
  if (Array.isArray(value)) {
    return (
      <div className="grid gap-2">
        {value.map((item, index) => (
          <DetailValue key={index} value={item} />
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return (
      <dl className="grid overflow-hidden rounded-xl border bg-background sm:grid-cols-2">
        {Object.entries(value).map(([key, item]) => (
          <div key={key} className="min-w-0 border-b p-3 last:border-b-0 sm:border-r sm:even:border-r-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label(key)}</dt>
            <dd className="mt-1 break-words text-sm">
              <DetailValue value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  if (typeof value === 'string' && value.includes('T') && !Number.isNaN(Date.parse(value))) {
    return <>{new Date(value).toLocaleString('fr-FR')}</>;
  }
  return <>{String(value)}</>;
}

function label(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
}
