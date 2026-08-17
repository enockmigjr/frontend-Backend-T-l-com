import type { RealtimeConnection } from './use-realtime-sync';

const labels: Record<RealtimeConnection, string> = {
  connected: 'Temps réel connecté',
  reconnecting: 'Reconnexion en cours',
  offline: 'Hors ligne',
};

export function RealtimeStatus({
  connection,
  lastSyncedAt,
}: Readonly<{ connection: RealtimeConnection; lastSyncedAt?: Date }>) {
  const color =
    connection === 'connected' ? 'bg-emerald-500' : connection === 'reconnecting' ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
      <span>{labels[connection]}</span>
      {lastSyncedAt ? (
        <span>
          · dernière synchro {lastSyncedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ) : null}
    </div>
  );
}
