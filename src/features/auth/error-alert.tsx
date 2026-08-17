import { ApiError, errorMessage } from './api-client';

export function ErrorAlert({ error }: Readonly<{ error: unknown }>) {
  const correlationId = error instanceof ApiError ? error.correlationId : undefined;
  return (
    <div
      className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200"
      role="alert"
    >
      <p>{errorMessage(error)}</p>
      {correlationId ? <p className="mt-1 font-mono text-xs">Référence : {correlationId}</p> : null}
    </div>
  );
}
