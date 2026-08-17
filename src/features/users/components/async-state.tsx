export function LoadingState({ label = 'Chargement…' }: { readonly label?: string }) {
  return (
    <p role="status" aria-live="polite" className="rounded-xl border bg-card p-6 text-muted-foreground">
      {label}
    </p>
  );
}

export function ErrorState({ message, retry }: { readonly message: string; readonly retry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200"
    >
      <p>{message}</p>
      {retry ? (
        <button
          className="mt-3 min-h-11 rounded-lg bg-red-900 px-4 text-white dark:bg-red-700 dark:hover:bg-red-600"
          onClick={retry}
        >
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { readonly children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">{children}</p>;
}
