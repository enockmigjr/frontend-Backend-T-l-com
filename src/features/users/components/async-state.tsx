export function LoadingState({ label = 'Chargement…' }: { readonly label?: string }) {
  return (
    <p role="status" aria-live="polite" className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-600">
      {label}
    </p>
  );
}

export function ErrorState({ message, retry }: { readonly message: string; readonly retry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
      <p>{message}</p>
      {retry ? (
        <button className="mt-3 min-h-11 rounded-lg bg-red-900 px-4 text-white" onClick={retry}>
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { readonly children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600">{children}</p>;
}
