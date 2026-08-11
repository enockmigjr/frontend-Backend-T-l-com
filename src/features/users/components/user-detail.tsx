'use client';

import { useQuery } from '@tanstack/react-query';
import { getUser } from '../api/admin-api';
import { roleLabels } from './user-form';
import { Badge } from '@/components/ui/badge';
import { ErrorState, LoadingState } from './async-state';

export function UserDetail({ id }: Readonly<{ id: string }>) {
  const query = useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: ({ signal }) => getUser(id, signal).then((result) => result.data),
  });
  if (query.isPending) return <LoadingState label="Chargement du profil…" />;
  if (query.error) return <ErrorState message={query.error.message} retry={() => void query.refetch()} />;

  const user = query.data;
  const stats = user.ticketStats;
  return (
    <div className="grid gap-5">
      <section className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <Detail label="Nom" value={`${user.firstName} ${user.lastName}`} />
        <Detail label="E-mail" value={user.email} />
        <Detail label="Rôle" value={roleLabels[user.role]} />
        <Detail label="Département" value={user.department?.name ?? user.departmentName ?? 'Non renseigné'} />
        <Detail label="État" value={user.isActive ? 'Actif' : 'Désactivé'} />
        <Detail
          label="Disponibilité"
          value={
            !user.isActive
              ? 'Compte désactivé'
              : user.isAvailable === false
                ? 'En pause (indisponible)'
                : user.absenceEndsAt && new Date(user.absenceEndsAt) > new Date()
                  ? `En absence jusqu'au ${new Date(user.absenceEndsAt).toLocaleDateString('fr-FR')}`
                  : 'Disponible'
          }
        />
        <Detail label="Dernière connexion" value={formatDate(user.lastLoginAt)} />
      </section>
      {stats ? (
        <section className="grid gap-3 sm:grid-cols-5">
          {[
            ['Créés', stats.totalCreated],
            ['Assignés', stats.totalAssigned],
            ['Ouverts', stats.openTickets],
            ['Résolus', stats.resolvedTickets],
            ['SLA dépassés', stats.slaBreachedCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-mono text-xl font-semibold">{value}</p>
            </div>
          ))}
        </section>
      ) : null}
      {user.recentTickets?.length ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Tickets récemment assignés</h3>
          <div className="divide-y rounded-lg border">
            {user.recentTickets.map((ticket) => (
              <a
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="flex items-center gap-3 p-3 hover:bg-muted/50"
              >
                <span className="font-mono text-xs">{ticket.ticketNumber}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{ticket.title}</span>
                <Badge variant={ticket.slaBreached ? 'destructive' : 'outline'}>{ticket.status}</Badge>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}

function formatDate(value: unknown) {
  return typeof value === 'string' ? new Date(value).toLocaleString('fr-FR') : 'Jamais';
}
