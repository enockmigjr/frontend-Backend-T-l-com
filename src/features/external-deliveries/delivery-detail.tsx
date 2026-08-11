'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { formatDate } from '@/features/tickets/presentation';
import type { ExternalDelivery } from './types';

function StatusBadge({ status }: { readonly status: string }) {
  const tone =
    status === 'DELIVERED'
      ? 'bg-emerald-100 text-emerald-900'
      : status === 'FAILED'
        ? 'bg-red-100 text-red-900'
        : status === 'DELIVERY_UNKNOWN'
          ? 'bg-amber-100 text-amber-900'
          : 'bg-slate-200 text-slate-800';
  return <Badge className={tone}>{status}</Badge>;
}

function Detail({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-2 text-sm">{value}</div>
    </div>
  );
}

export function DeliveryDetail({ delivery, open, onOpenChange }: { readonly delivery: ExternalDelivery; readonly open: boolean; readonly onOpenChange: (open: boolean) => void }) {
  return (
    <ResourceDialog open={open} onOpenChange={onOpenChange} title="Livraison externe" description="État observable de la notification, sans contenu ni secret." size="large">
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Canal" value={delivery.channel} />
        <Detail label="Statut" value={<StatusBadge status={delivery.status} />} />
        <Detail label="Tentatives" value={delivery.attemptCount} />
        <Detail label="Livrée le" value={delivery.deliveredAt ? formatDate(delivery.deliveredAt.toISOString()) : '—'} />
        <Detail label="Message fournisseur" value={delivery.providerMessageId ? <span className="font-mono text-xs">{delivery.providerMessageId}</span> : '—'} />
        <Detail label="Erreur" value={delivery.lastError ? <span className="text-red-700">{delivery.lastError}</span> : 'Aucune'} />
        <Detail label="Événement outbox" value={<span className="font-mono text-xs">{delivery.outboxEventId}</span>} />
        <Detail label="Intégration" value={<span className="font-mono text-xs">{delivery.supportIntegrationId}</span>} />
        <Detail label="Créée le" value={formatDate(delivery.createdAt.toISOString())} />
        <Detail label="Mise à jour" value={formatDate(delivery.updatedAt.toISOString())} />
      </div>
    </ResourceDialog>
  );
}
