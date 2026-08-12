'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { createUser, listUsers, setUserActive, updateUser } from '../api/admin-api';
import type { CreateUser, Department, UpdateUser, User } from '../api/types';
import { UserForm } from './user-form';
import { UserDetail } from './user-detail';
import { UsersPagination } from './users-pagination';
import { userColumns } from './users-columns';
import { AdminSection } from './admin-section';
import { EmptyState, ErrorState, LoadingState } from './async-state';
import { useCurrentUser } from './access-gate';
import { listDepartments } from '@/features/departments/api';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { MutationError } from '@/components/ui/mutation-error';
import { ResourceDialog } from '@/components/ui/resource-dialog';

export function UsersPage() {
  const { user: currentUser } = useCurrentUser();
  const isAdministrator = currentUser?.role === 'ADMINISTRATOR';
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [editing, setEditing] = useState<User>();
  const [selected, setSelected] = useState<User>();
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<unknown>();
  const [pageError, setPageError] = useState<unknown>();
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['users', 'admin', page, limit, order],
    queryFn: ({ signal }) => listUsers(page, limit, order, signal),
  });
  const departments = useQuery({
    queryKey: ['departments', 'options'],
    queryFn: ({ signal }) => listDepartments(signal).then((result) => result.data),
  });
  const users = query.data?.data ?? [];

  function openCreate() {
    setFormError(undefined);
    setCreating(true);
  }

  function openEdit(user: User) {
    setFormError(undefined);
    setEditing(user);
  }

  async function save(body: CreateUser | UpdateUser) {
    setPending(true);
    setFormError(undefined);
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
    } catch (reason) {
      setFormError(reason);
    } finally {
      setPending(false);
    }
  }

  async function toggle(user: User) {
    setPending(true);
    setPageError(undefined);
    try {
      await setUserActive(user.id, !user.isActive);
      await query.refetch();
    } catch (reason) {
      setPageError(reason);
    } finally {
      setPending(false);
    }
  }

  const columns = userColumns({
    isAdministrator,
    pending,
    onSelect: setSelected,
    onEdit: openEdit,
    onToggle: (user) => void toggle(user),
  });

  return (
    <AdminSection
      title="Utilisateurs"
      description="Gérez les rôles, départements et accès sans manipuler d’identifiants techniques."
      action={
        isAdministrator ? (
          <Button size="lg" onClick={openCreate}>
            <Plus />
            Nouvel utilisateur
          </Button>
        ) : undefined
      }
    >
      {notice ? (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-950"
        >
          {notice}
        </p>
      ) : null}
      {pageError || query.error ? (
        <ErrorState
          message={pageError instanceof Error ? pageError.message : (query.error?.message ?? '')}
          retry={() => {
            setPageError(undefined);
            void query.refetch();
          }}
        />
      ) : null}
      <div className="flex justify-end">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Création
          <select
            value={order}
            onChange={(event) => {
              setOrder(event.target.value as 'asc' | 'desc');
              setPage(1);
            }}
            className="h-8 rounded-lg border bg-background px-2 text-foreground"
          >
            <option value="desc">Plus récents</option>
            <option value="asc">Plus anciens</option>
          </select>
        </label>
      </div>
      {query.isPending ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState>Aucun utilisateur visible.</EmptyState>
      ) : (
        <DataTable rows={users} columns={columns} getRowKey={(user) => user.id} caption="Utilisateurs visibles" />
      )}
      <UsersPagination
        page={page}
        totalPages={query.data?.meta.totalPages ?? 1}
        limit={limit}
        onPage={setPage}
        onLimit={(value) => {
          setLimit(value);
          setPage(1);
        }}
      />
      <ResourceDialog
        open={creating}
        onOpenChange={(open) => {
          setCreating(open);
          setFormError(undefined);
        }}
        title="Créer un utilisateur"
        description="Un mot de passe temporaire sera affiché une seule fois."
        size="large"
      >
        <>
          <MutationError error={formError} />
          <UserForm departments={(departments.data ?? []) as Department[]} pending={pending} onSubmit={save} />
        </>
      </ResourceDialog>
      <ResourceDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
          setFormError(undefined);
        }}
        title="Modifier l’utilisateur"
        size="large"
      >
        {editing ? (
          <>
            <MutationError error={formError} />
            <UserForm user={editing} departments={(departments.data ?? []) as Department[]} pending={pending} onSubmit={save} />
          </>
        ) : null}
      </ResourceDialog>
      <ResourceDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        title="Détail de l’utilisateur"
        size="large"
      >
        {selected ? <UserDetail id={selected.id} /> : null}
      </ResourceDialog>
    </AdminSection>
  );
}
