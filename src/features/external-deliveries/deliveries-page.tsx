'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { RowActionMenu } from '@/components/ui/row-action-menu';
import { formatDate } from '@/features/tickets/presentation';
import { listDeliveries } from './api';
import { DeliveryDetail } from './delivery-detail';
import type { DeliveryStatus, ExternalDelivery } from './types';

const STATUSES = ['PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'DELIVERY_UNKNOWN'] as const;

function StatusBadge({ status }: { readonly status: string }) {
  const tone =
    status === 'DELIVERED'
      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
      : status === 'FAILED'
        ? 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200'
        : status === 'DELIVERY_UNKNOWN'
          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
          : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  return <Badge className={tone}>{status}</Badge>;
}

export function DeliveriesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<DeliveryStatus | ''>('');
  const [selected, setSelected] = useState<ExternalDelivery>();
  const query = useQuery({
    queryKey: ['external-deliveries', page, status],
    queryFn: ({ signal }) => listDeliveries(status ? { status } : {}, page, 20, signal),
  });
  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  const columns: readonly DataColumn<ExternalDelivery>[] = [
    {
      key: 'channel',
      label: 'Canal',
      sortValue: (item) => item.channel,
      cell: (item) => <strong>{item.channel}</strong>,
    },
    {
      key: 'status',
      label: 'Statut',
      sortValue: (item) => item.status,
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'attemptCount',
      label: 'Tentatives',
      sortValue: (item) => item.attemptCount,
      cell: (item) => <span className="text-sm">{item.attemptCount}</span>,
    },
    {
      key: 'deliveredAt',
      label: 'Livrée le',
      sortValue: (item) => item.deliveredAt?.getTime() ?? 0,
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.deliveredAt ? formatDate(item.deliveredAt.toISOString()) : '—'}
        </span>
      ),
    },
    {
      key: 'lastError',
      label: 'Erreur',
      sortValue: (item) => item.lastError ?? '',
      cell: (item) =>
        item.lastError ? (
          <span className="max-w-52 truncate text-xs text-red-700" title={item.lastError}>
            {item.lastError}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      cell: (item) => (
        <RowActionMenu
          label={`Actions pour la livraison ${item.id}`}
          actions={[{ label: 'Voir', icon: Eye, onSelect: () => setSelected(item) }]}
        />
      ),
    },
  ];

  return (
    <AdminSection
      eyebrow="Support public"
      title="Livraisons externes"
      description="Notifications sortantes envoyées aux demandeurs (email aujourd’hui, autres canaux ensuite). Aucun contenu ni secret n’est affiché."
      action={
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Statut</span>
          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as DeliveryStatus | '');
            }}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">Tous</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      }
    >
      {query.isLoading ? (
        <LoadingState label="Chargement des livraisons…" />
      ) : query.error ? (
        <ErrorState message={query.error.message} retry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState>
          Aucune livraison. Les notifications sortantes apparaîtront ici dès qu’un événement public sera émis.
        </EmptyState>
      ) : (
        <>
          <DataTable rows={items} columns={columns} getRowKey={(item) => item.id} caption="Livraisons externes" />
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Page {meta?.page ?? page} sur {meta?.totalPages ?? 1} · {meta?.total ?? items.length} livraisons
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft className="size-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                disabled={query.isFetching || (meta ? page >= meta.totalPages : items.length < 20)}
                onClick={() => setPage((value) => value + 1)}
              >
                Suivant
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
      {selected ? (
        <DeliveryDetail
          delivery={selected}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(undefined);
          }}
        />
      ) : null}
    </AdminSection>
  );
}
