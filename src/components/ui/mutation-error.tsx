import { ApiError } from '@/lib/api/errors';

export function MutationError({ error }: Readonly<{ error: unknown }>) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
  const correlationId = error instanceof ApiError ? error.problem.correlationId : undefined;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200"
    >
      <p>{message}</p>
      {correlationId ? <p className="mt-1 font-mono text-xs">Référence : {correlationId}</p> : null}
    </div>
  );
}
