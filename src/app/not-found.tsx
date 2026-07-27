import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main id="contenu" className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="font-mono text-sm text-blue-700">404</p>
        <h1 className="mt-2 text-3xl font-bold">Ressource introuvable</h1>
        <p className="mt-2 text-slate-600">Cette page ou ressource n’existe plus.</p>
        <Link
          href="/tickets"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 font-semibold text-white"
        >
          Revenir aux tickets
        </Link>
      </div>
    </main>
  );
}
