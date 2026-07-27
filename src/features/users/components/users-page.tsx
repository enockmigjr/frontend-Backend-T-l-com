'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Power, UserPen } from 'lucide-react';
import { createUser, listUsers, setUserActive, updateUser } from '../api/admin-api';
import type { CreateUser, UpdateUser, User } from '../api/types';
import { UserForm, roleLabels } from './user-form';
import { AdminSection } from './admin-section';
import { EmptyState, ErrorState, LoadingState } from './async-state';
import { useCurrentUser } from './access-gate';
import { listDepartments } from '@/features/departments/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { ResourceDialog } from '@/components/ui/resource-dialog';

export function UsersPage() {
  const { user: currentUser } = useCurrentUser();
  const isAdministrator = currentUser?.role === 'ADMINISTRATOR';
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [editing, setEditing] = useState<User>();
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['users', 'admin', page, limit],
    queryFn: ({ signal }) => listUsers(page, limit, signal),
  });
  const departments = useQuery({
    queryKey: ['departments', 'options'],
    queryFn: ({ signal }) => listDepartments(signal).then((result) => result.data),
  });
  const users = query.data?.data ?? [];

  async function save(body: CreateUser | UpdateUser) {
    setPending(true);
    setError('');
    try {
      if (editing) {
        await updateUser(editing.id, body as UpdateUser);
        setEditing(undefined);
      } else {
        const result = await createUser(body as CreateUser);
        setNotice(`Compte créé. Mot de passe temporaire : ${result.data.tempPassword}`);
        setCreating(false);
      }
      await query.refetch();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Enregistrement impossible.');
    } finally {
      setPending(false);
    }
  }

  async function toggle(user: User) {
    setPending(true);
    try {
      await setUserActive(user.id, !user.isActive);
      await query.refetch();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Action impossible.');
    } finally {
      setPending(false);
    }
  }

  const columns: readonly DataColumn<User>[] = [
    {
      key: 'name',
      label: 'Collaborateur',
      cell: (user) => <div><strong>{user.firstName} {user.lastName}</strong><p className="text-xs text-muted-foreground">{user.email}</p></div>,
    },
    { key: 'role', label: 'Rôle', cell: (user) => roleLabels[user.role] },
    { key: 'department', label: 'Département', cell: (user) => user.departmentName ?? 'Non renseigné' },
    { key: 'status', label: 'État', cell: (user) => <Badge variant={user.isActive ? 'secondary' : 'outline'}>{user.isActive ? 'Actif' : 'Désactivé'}</Badge> },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      cell: (user) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(user)}><UserPen />Modifier</Button>
          <Button variant="ghost" size="sm" disabled={!isAdministrator || pending} onClick={() => void toggle(user)}>
            <Power />{user.isActive ? 'Désactiver' : 'Activer'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminSection
      title="Utilisateurs"
      description="Gérez les rôles, départements et accès sans manipuler d’identifiants techniques."
      action={isAdministrator ? <Button size="lg" onClick={() => setCreating(true)}><Plus />Nouvel utilisateur</Button> : undefined}
    >
      {notice ? <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-950">{notice}</p> : null}
      {error || query.error ? <ErrorState message={error || (query.error instanceof Error ? query.error.message : '')} retry={() => void query.refetch()} /> : null}
      {query.isPending ? <LoadingState /> : users.length === 0 ? <EmptyState>Aucun utilisateur visible.</EmptyState> : <DataTable rows={users} columns={columns} getRowKey={(user) => user.id} caption="Utilisateurs visibles" />}
      <Pagination page={page} totalPages={query.data?.meta.totalPages ?? 1} limit={limit} onPage={setPage} onLimit={(value) => { setLimit(value); setPage(1); }} />
      <ResourceDialog open={creating} onOpenChange={setCreating} title="Créer un utilisateur" description="Un mot de passe temporaire sera affiché une seule fois." size="large">
        <UserForm departments={departments.data ?? []} pending={pending} onSubmit={save} />
      </ResourceDialog>
      <ResourceDialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(undefined); }} title="Modifier l’utilisateur" description="Les permissions seront recalculées à la prochaine requête." size="large">
        {editing ? <UserForm user={editing} departments={departments.data ?? []} pending={pending} onSubmit={save} /> : null}
      </ResourceDialog>
    </AdminSection>
  );
}

function Pagination(props: Readonly<{ page: number; totalPages: number; limit: number; onPage: (page: number) => void; onLimit: (limit: number) => void }>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <label className="flex items-center gap-2 text-muted-foreground">Lignes par page
        <select value={props.limit} onChange={(event) => props.onLimit(Number(event.target.value))} className="h-8 rounded-lg border bg-background px-2 text-foreground">
          {[10, 20, 50, 100].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-2"><Button variant="outline" disabled={props.page <= 1} onClick={() => props.onPage(props.page - 1)}>Précédent</Button><span>Page {props.page} sur {props.totalPages}</span><Button variant="outline" disabled={props.page >= props.totalPages} onClick={() => props.onPage(props.page + 1)}>Suivant</Button></div>
    </div>
  );
}
