'use client';

import { Clock3, PauseCircle, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProgressBar } from './ticket-sla-progress';
import { formatDate } from './presentation';
import type { Ticket } from './schemas';

export function TicketSlaCard({ ticket }: Readonly<{ ticket: Ticket }>) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const firstResponse = deadlineState(ticket.firstResponseDueAt, now, ticket.firstResponseAt);
  const resolution = deadlineState(ticket.resolutionDueAt, now, ticket.resolvedAt ?? ticket.closedAt);
  const paused = ticket.status === 'PENDING_CUSTOMER' || ticket.status === 'PENDING_THIRD_PARTY';
  const critical = ticket.slaBreached || resolution.overdue || firstResponse.overdue;

  return (
    <section
      className={`rounded-xl border p-4 shadow-sm ${critical ? 'border-red-200 bg-red-50/50 dark:border-red-900/70 dark:bg-red-950/30' : 'bg-card'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          {critical ? (
            <ShieldAlert className="text-red-600 dark:text-red-300" aria-hidden />
          ) : (
            <Clock3 className="text-primary" aria-hidden />
          )}
          Engagements SLA
        </h2>
        {paused ? (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <PauseCircle aria-hidden className="size-3.5" /> Suspendu
          </span>
        ) : null}
      </div>
      <div className="mt-4 space-y-4">
        <SlaLine label="Première réponse" state={firstResponse} />
        <SlaLine label="Résolution" state={resolution} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
        <Meta label="Pause cumulée" value={formatDuration(ticket.accumulatedPauseMs ?? 0)} />
        <Meta label="État du SLA" value={critical ? 'À risque ou dépassé' : paused ? 'Suspendu' : 'En cours'} />
      </dl>
    </section>
  );
}

type DeadlineState = Readonly<{
  label: string;
  deadline?: string;
  completedAt?: string;
  overdue: boolean;
  complete: boolean;
  progress: number;
}>;

function SlaLine({ label, state }: Readonly<{ label: string; state: DeadlineState }>) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <strong
          className={
            state.overdue
              ? 'text-red-700 dark:text-red-300'
              : state.complete
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-foreground'
          }
        >
          {state.label}
        </strong>
      </div>
      <ProgressBar value={state.progress} critical={state.overdue || state.progress > 85} complete={state.complete} />
      <p className="mt-1.5 text-xs text-muted-foreground">
        {state.completedAt
          ? `Réalisé le ${formatDate(state.completedAt)}`
          : state.deadline
            ? `Attendu le ${formatDate(state.deadline)}`
            : 'Aucune échéance configurée'}
      </p>
    </div>
  );
}

function deadlineState(
  value: string | null | undefined,
  now: number,
  completedAt: string | null | undefined,
): DeadlineState {
  if (completedAt) {
    return {
      label: 'Objectif atteint',
      deadline: value ?? undefined,
      completedAt,
      overdue: false,
      complete: true,
      progress: 100,
    };
  }
  if (!value) return { label: 'Non défini', overdue: false, complete: false, progress: 0 };
  const deadline = new Date(value).getTime();
  const remaining = deadline - now;
  const overdue = remaining < 0;
  const minutes = Math.max(1, Math.round(Math.abs(remaining) / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const minuteRemainder = minutes % 60;
  const duration =
    days > 0 ? `${days} j ${hours} h` : hours > 0 ? `${hours} h ${minuteRemainder} min` : `${minutes} min`;
  return {
    label: overdue ? `Dépassé de ${duration}` : `${duration} restant`,
    overdue,
    complete: false,
    deadline: value,
    progress: overdue ? 100 : Math.min(95, Math.max(12, 100 - (remaining / 86_400_000) * 25)),
  };
}

function Meta({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatDuration(milliseconds: number): string {
  if (milliseconds <= 0) return 'Aucune';
  const minutes = Math.round(milliseconds / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
}
