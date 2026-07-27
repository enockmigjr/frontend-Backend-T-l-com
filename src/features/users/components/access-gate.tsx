'use client';
import { useEffect, useState } from 'react';
import { getCurrentUser, type CurrentUser } from '@/lib/auth/session';
import { ErrorState, LoadingState } from './async-state';

export function AccessGate({
  allow,
  children,
}: {
  readonly allow: (user: CurrentUser) => boolean;
  readonly children: React.ReactNode;
}) {
  const { user, failed } = useCurrentUser();
  if (failed) return <ErrorState message="Impossible de vérifier vos autorisations." />;
  if (!user) return <LoadingState label="Vérification des autorisations…" />;
  if (!allow(user))
    return (
      <section role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold">Accès interdit</h1>
        <p className="mt-2 text-amber-950">
          Votre rôle ne permet pas d’accéder à cette page. Le backend reste autoritaire.
        </p>
      </section>
    );
  return children;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void getCurrentUser(controller.signal)
      .then(setUser)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);
  return { user, failed } as const;
}

export const isAdmin = (user: CurrentUser) => user.role === 'ADMINISTRATOR';
export const isSupervisor = (user: CurrentUser) => user.role === 'ADMINISTRATOR' || user.role === 'SUPERVISOR';
