import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react';
import { Button } from './button';
import { Panel } from './panel';
import { ApiError } from '@/lib/api/errors';

export function LoadingState({ label = 'Chargement…' }: { readonly label?: string }) {
  return (
    <div role="status" className="flex min-h-40 items-center justify-center gap-3 text-slate-600">
      <LoaderCircle aria-hidden className="size-5 animate-spin motion-reduce:animate-none" />
      {label}
    </div>
  );
}
export function EmptyState({ title, description }: { readonly title: string; readonly description: string }) {
  return (
    <Panel className="grid min-h-56 place-items-center p-8 text-center">
      <div>
        <Inbox aria-hidden className="mx-auto mb-3 size-8 text-slate-400" />
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </Panel>
  );
}
export function ErrorState({ error, retry }: { readonly error: unknown; readonly retry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
  const correlationId = error instanceof ApiError ? error.problem.correlationId : undefined;
  return (
    <Panel role="alert" className="border-red-200 p-5">
      <div className="flex gap-3">
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-red-700" />
        <div>
          <h2 className="font-semibold text-red-900">Impossible de charger ces données</h2>
          <p className="mt-1 text-sm text-red-800">{message}</p>
          {correlationId && <p className="mt-2 font-mono text-xs text-slate-600">Corrélation : {correlationId}</p>}
          {retry && (
            <Button variant="secondary" className="mt-4" onClick={retry}>
              Réessayer
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
