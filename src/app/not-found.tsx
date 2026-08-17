import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main id="contenu" className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="font-mono text-sm text-primary">404</p>
        <h1 className="mt-2 text-3xl font-bold">Ressource introuvable</h1>
        <p className="mt-2 text-muted-foreground">Cette page ou ressource n’existe plus.</p>
        <Link
          href="/tickets"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
        >
          Revenir aux tickets
        </Link>
      </div>
    </main>
  );
}
