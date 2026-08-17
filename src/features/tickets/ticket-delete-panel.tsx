'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ErrorAlert } from '@/features/auth/error-alert';
import { ticketsApi } from './api';

export function TicketDeletePanel({ ticketId, onClose }: Readonly<{ ticketId: string; onClose: () => void }>) {
  const router = useRouter();
  const removal = useMutation({
    mutationFn: () => ticketsApi.remove(ticketId),
    onSuccess: () => router.replace('/tickets'),
  });
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/30">
      <h3 className="font-semibold text-red-900 dark:text-red-200">Supprimer ce ticket ?</h3>
      <p className="mt-1 text-sm text-red-800 dark:text-red-300">
        La suppression est logique et retirera le ticket des vues opérationnelles.
      </p>
      {removal.error ? (
        <div className="mt-3">
          <ErrorAlert error={removal.error} />
        </div>
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        <button className="min-h-11 rounded-lg border bg-card px-3 py-2 text-sm font-medium" onClick={onClose}>
          Annuler
        </button>
        <button
          disabled={removal.isPending}
          className="min-h-11 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500 disabled:opacity-50"
          onClick={() => removal.mutate()}
        >
          {removal.isPending ? 'Suppression…' : 'Confirmer la suppression'}
        </button>
      </div>
    </div>
  );
}
