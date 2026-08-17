'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Power } from 'lucide-react';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { isAdmin, useCurrentUser } from '@/features/users/components/access-gate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { RowActionMenu } from '@/components/ui/row-action-menu';
import { toast } from '@/components/ui/toast';
import { formatDate } from '@/features/tickets/presentation';
import { createIntegration, listIntegrations, updateIntegration } from './api';
import { IntegrationDetail } from './integration-detail';
import { IntegrationDialog, parseOrigins } from './integration-dialog';
import type { SupportIntegration } from './types';

function tryJson(value: string): Record<string, unknown> | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed: unknown = JSON.parse(trimmed);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    throw new Error('La politique JSON doit être un objet.');
  return parsed as Record<string, unknown>;
}

function StatusBadge({ status }: { readonly status: string }) {
  const tone =
    status === 'ACTIVE'
      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
      : status === 'SUSPENDED'
        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
        : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  return (
    <Badge className={tone}>
      {status === 'ACTIVE' ? 'Active' : status === 'SUSPENDED' ? 'Suspendue' : 'Brouillon'}
    </Badge>
  );
}

export function IntegrationsPage() {
  const { user } = useCurrentUser();
  const canWrite = user ? isAdmin(user) : false;
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SupportIntegration>();
  const [selected, setSelected] = useState<SupportIntegration>();
  const [pendingStatus, setPendingStatus] = useState<SupportIntegration>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const query = useQuery({
    queryKey: ['support-integrations'],
    queryFn: ({ signal }) => listIntegrations(signal).then((result) => result.data),
  });
  const items = query.data ?? [];

  async function save(formData: FormData) {
    setPending(true);
    setError(undefined);
    try {
      const body: {
        name: string;
        allowedOrigins: string[];
        trustPolicy?: { trustedDeviceDays?: number };
        features?: { attachments?: boolean; realtime?: boolean; bot?: boolean };
        routingPolicy?: Record<string, unknown>;
        quotaPolicy?: Record<string, unknown>;
        status?: string;
      } = {
        name: String(formData.get('name')).trim(),
        allowedOrigins: parseOrigins(String(formData.get('allowedOrigins') ?? '')),
        trustPolicy: { trustedDeviceDays: Number(formData.get('trustedDeviceDays')) || undefined },
        features: {
          attachments: formData.get('feature-attachments') === 'on',
          realtime: formData.get('feature-realtime') === 'on',
          bot: formData.get('feature-bot') === 'on',
        },
      };
      const routing = tryJson(String(formData.get('routingPolicy') ?? ''));
      const quota = tryJson(String(formData.get('quotaPolicy') ?? ''));
      if (routing) body.routingPolicy = routing;
      if (quota) body.quotaPolicy = quota;
      if (editing) body.status = String(formData.get('status'));
      if (editing) await updateIntegration(editing.id, body);
      else await createIntegration(body);
      toast.add({ title: editing ? 'Intégration mise à jour' : 'Intégration créée', type: 'success' });
      await query.refetch();
      setEditing(undefined);
      setCreating(false);
    } catch (reason) {
      setError(reason);
    } finally {
      setPending(false);
    }
  }

  async function toggleStatus(item: SupportIntegration) {
    const next = item.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await updateIntegration(item.id, { name: item.name, allowedOrigins: item.allowedOrigins, status: next });
    await query.refetch();
    setPendingStatus(undefined);
    toast.add({
      title: next === 'ACTIVE' ? 'Intégration activée' : 'Intégration suspendue',
      description: item.name,
      type: 'success',
    });
  }

  const columns: readonly DataColumn<SupportIntegration>[] = [
    { key: 'name', label: 'Intégration', sortValue: (item) => item.name, cell: (item) => <strong>{item.name}</strong> },
    {
      key: 'status',
      label: 'Statut',
      sortValue: (item) => item.status,
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'origins',
      label: 'Origines',
      sortValue: (item) => item.allowedOrigins.length,
      cell: (item) => `${item.allowedOrigins.length}`,
    },
    {
      key: 'createdAt',
      label: 'Créée',
      sortValue: (item) => item.createdAt.getTime(),
      cell: (item) => <span className="text-sm text-muted-foreground">{formatDate(item.createdAt.toISOString())}</span>,
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      cell: (item) => (
        <RowActionMenu
          label={`Actions pour ${item.name}`}
          actions={[
            { label: 'Voir', icon: Eye, onSelect: () => setSelected(item) },
            ...(canWrite
              ? [
                  { label: 'Modifier', icon: Pencil, onSelect: () => setEditing(item) },
                  {
                    label: item.status === 'ACTIVE' ? 'Suspendre' : 'Activer',
                    icon: Power,
                    onSelect: () => setPendingStatus(item),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <AdminSection
      eyebrow="Support public"
      title="Intégrations"
      description="Sites et canaux autorisés à créer des demandes publiques. Les secrets ne sont jamais lisibles : seule la rotation est possible."
      action={
        canWrite ? (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Créer une intégration
          </Button>
        ) : undefined
      }
    >
      {query.isLoading ? (
        <LoadingState label="Chargement des intégrations…" />
      ) : query.error ? (
        <ErrorState message={query.error.message} retry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState>Aucune intégration. Créez une première intégration pour autoriser un site ou un canal.</EmptyState>
      ) : (
        <DataTable rows={items} columns={columns} getRowKey={(item) => item.id} caption="Intégrations de support" />
      )}
      <IntegrationDialog
        open={creating || Boolean(editing)}
        item={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(undefined);
            setError(undefined);
          }
        }}
        error={error}
        pending={pending}
        onSubmit={save}
      />
      {selected ? (
        <IntegrationDetail
          integration={selected}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(undefined);
          }}
          canWrite={canWrite}
        />
      ) : null}
      {pendingStatus ? (
        <ConfirmDialog
          open
          title={pendingStatus.status === 'ACTIVE' ? 'Suspendre cette intégration ?' : 'Activer cette intégration ?'}
          description={
            pendingStatus.status === 'ACTIVE'
              ? 'Les nouveaux accès seront refusés pendant la suspension.'
              : 'Le site pourra de nouveau créer des demandes.'
          }
          confirmLabel="Confirmer"
          onConfirm={() => toggleStatus(pendingStatus)}
          onOpenChange={(open) => {
            if (!open) setPendingStatus(undefined);
          }}
        />
      ) : null}
    </AdminSection>
  );
}
