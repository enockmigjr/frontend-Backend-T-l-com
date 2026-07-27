'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createUser, listUsers, setUserActive, updateUser } from '../api/admin-api';
import type { CreateUser, User } from '../api/types';
import { AdminSection } from './admin-section';
import { EmptyState, ErrorState, LoadingState } from './async-state';
import { useCurrentUser } from './access-gate';
import { createUserInputSchema } from '../api/validation';

const roles = [
  'CUSTOMER_SERVICE_AGENT',
  'NOC_ENGINEER',
  'BILLING_AGENT',
  'TECHNICAL_SUPPORT_ENGINEER',
  'FIELD_TECHNICIAN',
  'SUPERVISOR',
  'ADMINISTRATOR',
] as const;

export function UsersPage() {
  const { user: currentUser } = useCurrentUser();
  const isAdministrator = currentUser?.role === 'ADMINISTRATOR';
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: ({ signal }) => listUsers(signal).then((result) => result.data),
  });
  const users = query.data ?? [];
  const loading = query.isPending;
  const visibleError = error || (query.error instanceof Error ? query.error.message : '');
  const load = async () => {
    await query.refetch();
  };

  async function submit(formData: FormData) {
    setNotice('');
    const body: CreateUser = createUserInputSchema.parse({
      email: String(formData.get('email')),
      firstName: String(formData.get('firstName')),
      lastName: String(formData.get('lastName')),
      role: formData.get('role'),
      departmentId: String(formData.get('departmentId')),
    });
    try {
      const result = await createUser(body);
      setNotice(`Compte créé. Mot de passe temporaire (affiché une seule fois) : ${result.data.tempPassword}`);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Création impossible.');
    }
  }
  async function toggle(user: User) {
    if (!isAdministrator) {
      setError('Seul un administrateur peut activer ou désactiver un compte.');
      return;
    }
    try {
      await setUserActive(user.id, !user.isActive);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Action impossible.');
    }
  }
  async function rename(user: User) {
    const firstName = window.prompt('Prénom', user.firstName);
    if (!firstName) return;
    try {
      await updateUser(user.id, { firstName });
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Modification impossible.');
    }
  }

  return (
    <AdminSection
      title="Utilisateurs"
      description="Le superviseur ne reçoit que son département. Les actions d’activation et de création restent réservées à l’administrateur."
    >
      {isAdministrator ? (
        <form
          action={submit}
          className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-5 md:grid-cols-3"
          aria-label="Créer un utilisateur"
        >
          <label className="grid gap-1 text-sm">
            Prénom
            <input required name="firstName" className="min-h-11 rounded-lg border px-3" />
          </label>
          <label className="grid gap-1 text-sm">
            Nom
            <input required name="lastName" className="min-h-11 rounded-lg border px-3" />
          </label>
          <label className="grid gap-1 text-sm">
            E-mail
            <input required type="email" name="email" className="min-h-11 rounded-lg border px-3" />
          </label>
          <label className="grid gap-1 text-sm">
            Rôle
            <select name="role" className="min-h-11 rounded-lg border px-3">
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Département (UUID)
            <input required name="departmentId" className="min-h-11 rounded-lg border px-3" />
          </label>
          <button className="min-h-11 self-end rounded-lg bg-blue-700 px-4 font-medium text-white">Créer</button>
        </form>
      ) : (
        <p className="rounded-lg border bg-zinc-50 p-4 text-sm text-zinc-600">
          Mode superviseur : périmètre départemental, sans création ni activation.
        </p>
      )}
      {notice ? (
        <p role="status" className="rounded-lg bg-amber-50 p-4 font-medium text-amber-950">
          {notice}
        </p>
      ) : null}
      {visibleError ? <ErrorState message={visibleError} retry={() => void load()} /> : null}
      {loading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState>Aucun utilisateur visible.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Utilisateurs visibles</caption>
            <thead className="bg-zinc-50">
              <tr>
                <th className="p-3">Nom</th>
                <th className="p-3">Rôle</th>
                <th className="p-3">Département</th>
                <th className="p-3">État</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-3">
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    <br />
                    {user.email}
                  </td>
                  <td className="p-3">{user.role}</td>
                  <td className="p-3">{user.departmentName ?? user.departmentId}</td>
                  <td className="p-3">{user.isActive ? 'Actif' : 'Désactivé'}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => void rename(user)} className="min-h-11 rounded-lg border px-3">
                        Modifier
                      </button>
                      <button
                        disabled={!isAdministrator}
                        title={isAdministrator ? undefined : 'Réservé aux administrateurs'}
                        onClick={() => void toggle(user)}
                        className="min-h-11 rounded-lg border px-3 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {user.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminSection>
  );
}
