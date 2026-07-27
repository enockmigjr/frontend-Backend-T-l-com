import { resetCsrfToken } from '@/lib/api/client';

const CHANNEL_NAME = 'itsm-session';

export type SessionSignal = 'session-updated' | 'logout';

function isSessionSignal(value: unknown): value is SessionSignal {
  return value === 'session-updated' || value === 'logout';
}

export function publishSessionSignal(signal: SessionSignal): void {
  resetCsrfToken();
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage(signal);
  channel.close();
}

export function subscribeSessionSignals(listener: (signal: SessionSignal) => void): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => undefined;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const onMessage = (event: MessageEvent<unknown>) => {
    if (!isSessionSignal(event.data)) return;
    resetCsrfToken();
    listener(event.data);
  };
  channel.addEventListener('message', onMessage);
  return () => {
    channel.removeEventListener('message', onMessage);
    channel.close();
  };
}
