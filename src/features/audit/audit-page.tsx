'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { auditSchema } from '@/features/users/api/validation';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { getAudit, listAudit } from './api';
import { AuditPagination } from './audit-pagination';
import { AuditBlock } from './audit-detail';
import { redact } from './redact';

type Audit = z.infer<typeof auditSchema>;

export function AuditPage() {
  const [selected, setSelected] = useState<Audit>();
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(new URLSearchParams({ page: '1', limit: '50' }));
  const query = useQuery({
    queryKey: ['audit', filters.toString()],
    queryFn: ({ signal }) => listAudit(filters, signal),
  });

  function filter(formData: FormData) {
    const next = new URLSearchParams({ page: '1', limit: filters.get('limit') ?? '50' });
    for (const key of ['userId', 'action', 'entityType', 'from', 'to']) {
      const value = String(formData.get(key) ?? '');
      if (value) next.set(key, value);
    }
    setFilters(next);
  }

  function resetFilters(form: HTMLFormElement) {
    form.reset();
    setFilters(new URLSearchParams({ page: '1', limit: filters.get('limit') ?? '50' }));
  }

  function updatePagination(key: 'page' | 'limit', value: number) {
    setFilters((current) => {
      const next = new URLSearchParams(current);
      next.set(key, String(value));
      if (key === 'limit') next.set('page', '1');
      return next;
    });
  }

  async function detail(id: string) {
    try {
      setSelected((await getAudit(id)).data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Détail indisponible.');
    }
  }

  const columns: DataColumn<Audit>[] = [
    { key: 'date', label: 'Date', cell: (item) => new Date(item.createdAt).toLocaleString('fr-FR') },
    { key: 'action', label: 'Action', cell: (item) => <strong>{item.action}</strong> },
    {
      key: 'entity',
      label: 'Entité',
      cell: (item) => (
        <>
          <span>{item.entityType}</span>
          <br />
          <code className="text-xs text-muted-foreground">{item.entityId.slice(0, 8)}</code>
        </>
      ),
    },
    { key: 'user', label: 'Utilisateur', cell: (item) => <code className="text-xs">{item.userId.slice(0, 8)}</code> },
    {
      key: 'detail',
      label: '',
      className: 'w-24 text-right',
      cell: (item) => (
        <Button variant="outline" size="sm" onClick={() => void detail(item.id)}>
          Consulter
        </Button>
      ),
    },
  ];

  return (
    <AdminSection
      title="Journal d’audit"
      description="Suivez les changements sensibles avec une lecture structurée des valeurs avant et après."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          filter(new FormData(event.currentTarget));
        }}
        className="grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-5"
      >
        <label className="grid gap-2 text-sm font-medium">
          Utilisateur
          <Input name="userId" placeholder="Identifiant" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Action
          <Input name="action" placeholder="Ex. ticket.updated" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Entité
          <select name="entityType" className="h-10 w-full min-w-0 rounded-lg border bg-background px-3">
            <option value="">Toutes</option>
            {['ticket', 'user', 'department', 'sla_policy'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Du
          <Input name="from" type="date" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Au
          <Input name="to" type="date" />
        </label>
        <div className="flex justify-end gap-2 md:col-span-2 md:col-start-4">
          <Button type="button" variant="outline" onClick={(event) => resetFilters(event.currentTarget.form!)}>
            Réinitialiser
          </Button>
          <Button type="submit">Filtrer</Button>
        </div>
      </form>
      <ResourceDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        title={`Détail ${selected?.action ?? ''}`}
        description="Les valeurs sensibles ont été masquées."
        size="large"
      >
        {selected ? (
          <div className="grid gap-4">
            <AuditBlock title="Avant" value={redact(selected.oldValue)} />
            <AuditBlock title="Après" value={redact(selected.newValue)} />
            <div className="grid gap-3 rounded-lg bg-muted p-4 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Adresse IP</span>
                <br />
                {selected.ipAddress || 'Non renseignée'}
              </p>
              <p>
                <span className="text-muted-foreground">Client</span>
                <br />
                {selected.userAgent || 'Non renseigné'}
              </p>
            </div>
          </div>
        ) : null}
      </ResourceDialog>
      {error || query.error ? (
        <ErrorState message={error || String(query.error)} retry={() => void query.refetch()} />
      ) : null}
      {query.isPending ? (
        <LoadingState />
      ) : query.data?.data.length ? (
        <div className="grid gap-3">
          <DataTable rows={query.data.data} columns={columns} getRowKey={(item) => item.id} caption="Journal d’audit" />
          <AuditPagination
            page={query.data.meta.page}
            totalPages={query.data.meta.totalPages}
            total={query.data.meta.total}
            limit={query.data.meta.limit}
            onPageChange={(page) => updatePagination('page', page)}
            onLimitChange={(limit) => updatePagination('limit', limit)}
          />
        </div>
      ) : (
        <EmptyState>Aucun événement pour ces filtres.</EmptyState>
      )}
    </AdminSection>
  );
}
