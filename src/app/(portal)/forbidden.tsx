import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { Panel } from '@/components/ui/panel';

export default function ForbiddenPage() {
  return (
    <Panel className="mx-auto max-w-xl p-8 text-center">
      <ShieldX aria-hidden className="mx-auto size-10 text-amber-700 dark:text-amber-300" />
      <h1 className="mt-4 text-2xl font-bold">Accès non autorisé</h1>
      <p className="mt-2 text-muted-foreground">
        Votre rôle ou votre périmètre départemental ne permet pas d’ouvrir cette ressource.
      </p>
      <Link
        href="/tickets"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
      >
        Retour aux tickets
      </Link>
    </Panel>
  );
}
