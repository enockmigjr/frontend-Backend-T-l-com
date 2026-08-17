'use client';
import Link from 'next/link';
import { AccessGate, isSupervisor, useCurrentUser } from '@/features/users/components/access-gate';

const entries = [
  {
    title: 'Utilisateurs',
    href: '/admin/users',
    description: 'Comptes, rôles, disponibilité et activation.',
    adminOnly: false,
  },
  {
    title: 'Départements',
    href: '/admin/departments',
    description: 'Organisation et équipes propriétaires.',
    adminOnly: true,
  },
  { title: 'Catégories', href: '/admin/categories', description: 'Routage métier et rôles cibles.', adminOnly: true },
  { title: 'Politiques SLA', href: '/admin/sla', description: 'Délais de réponse et de résolution.', adminOnly: true },
  {
    title: 'Paramètres',
    href: '/admin/settings',
    description: 'Configuration exposée par le backend.',
    adminOnly: false,
  },
] as const;

function AdminLinks() {
  const { user } = useCurrentUser();
  const visible = entries.filter((entry) => !entry.adminOnly || user?.role === 'ADMINISTRATOR');
  return (
    <section>
      <h1 className="text-2xl font-semibold">Administration</h1>
      <p className="mt-1 text-muted-foreground">
        Les mutations sont contrôlées par le backend; le superviseur conserve uniquement son périmètre autorisé.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {visible.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className="min-h-28 rounded-xl border bg-card p-5 outline-offset-4 hover:border-primary"
          >
            <h2 className="font-semibold">{entry.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <AccessGate allow={isSupervisor}>
      <AdminLinks />
    </AccessGate>
  );
}
