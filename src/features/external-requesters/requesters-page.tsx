'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react';
import { AdminSection } from '@/features/users/components/admin-section';
import { EmptyState, ErrorState, LoadingState } from '@/features/users/components/async-state';
import { isAdmin, useCurrentUser } from '@/features/users/components/access-gate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { RowActionMenu } from '@/components/ui/row-action-menu';
import { formatDate } from '@/features/tickets/presentation';
import { getRequester, listRequesters } from './api';
import { RequesterDetail } from './requester-detail';
import type { ExternalRequester, ExternalRequesterDetail } from './types';

export function RequestersPage() {
  const { user } = useCurrentUser();
  const canWrite = user ? isAdmin(user) : false;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [anonymized, setAnonymized] = useState<'' | 'true' | 'false'>('');
  const [selected, setSelected] = useState<ExternalRequesterDetail>();
  const query = useQuery({
    queryKey: ['external-requesters', page, submittedSearch, anonymized],
    queryFn: ({ signal }) =>
      listRequesters(
        { search: submittedSearch || undefined, anonymized: anonymized || undefined },
        page,
        20,
        signal,
      ),
  });
  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  const columns: readonly DataColumn<ExternalRequester>[] = [
    {
      key: 'displayName',
      label: 'Demandeur',
      sortValue: (item) => item.displayName ?? '',
      cell: (item) => (item.displayName ? <strong>{item.displayName}</strong> : <span className="text-muted-foreground">Anonyme</span>),
    },
    { key: 'locale', label: 'Langue', sortValue: (item) => item.locale, cell: (item) => <span className="text-sm">{item.locale}</span> },
    {
      key: 'lastSeenAt',
      label: 'Dernière activité',
      sortValue: (item) => item.lastSeenAt?.getTime() ?? 0,
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.lastSeenAt ? formatDate(item.lastSeenAt.toISOString()) : '—'}
        </span>
      ),
    },
    {
      key: 'anonymizedAt',
      label: 'Profil',
      sortValue: (item) => item.anonymizedAt?.getTime() ?? 0,
      cell: (item) => (item.anonymizedAt ? <Badge className="bg-slate-200 text-slate-800">Anonymisé</Badge> : <Badge className="bg-emerald-100 text-emerald-900">Actif</Badge>),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      cell: (item) => (
        <RowActionMenu
          label={`Actions pour ${item.displayName ?? 'le demandeur anonyme'}`}
          actions={[
            {
              label: 'Voir',
              icon: Eye,
              onSelect: () => {
                void getRequester(item.id).then((detail) => setSelected(detail.data));
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminSection
      eyebrow="Support public"
      title="Demandeurs publics"
      description="Personnes ayant déposé une demande sans compte interne. Les adresses et téléphones restent chiffrés : seuls les types d’identité et les impacts sont visibles."
      action={
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSubmittedSearch(search);
          }}
        >
          <label className="flex items-center gap-2 rounded-lg border bg-background px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un nom…"
              className="h-9 w-48 bg-transparent text-sm outline-none"
            />
          </label>
          <select
            value={anonymized}
            onChange={(event) => {
              setPage(1);
              setAnonymized(event.target.value as '' | 'true' | 'false');
            }}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">Tous les profils</option>
            <option value="false">Actifs uniquement</option>
            <option value="true">Anonymisés</option>
          </select>
        </form>
      }
    >
      {query.isLoading ? (
        <LoadingState label="Chargement des demandeurs…" />
      ) : query.error ? (
        <ErrorState message={query.error.message} retry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState>Aucun demandeur. Les profils publics apparaîtront dès qu’un contact sera vérifié.</EmptyState>
      ) : (
        <>
          <DataTable rows={items} columns={columns} getRowKey={(item) => item.id} caption="Demandeurs publics" />
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Page {meta?.page ?? page} sur {meta?.totalPages ?? 1} · {meta?.total ?? items.length} demandeurs
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1 || query.isFetching} onClick={() => setPage((value) => value - 1)}>
                <ChevronLeft className="size-4" />Précédent
              </Button>
              <Button
                variant="outline"
                disabled={query.isFetching || (meta ? page >= meta.totalPages : items.length < 20)}
                onClick={() => setPage((value) => value + 1)}
              >
                Suivant<ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
      {selected ? (
        <RequesterDetail
          requester={selected}
          open
          onOpenChange={(open) => { if (!open) setSelected(undefined); }}
          canWrite={canWrite}
          onMerged={() => {
            setSelected(undefined);
            void query.refetch();
          }}
        />
      ) : null}
    </AdminSection>
  );
}
