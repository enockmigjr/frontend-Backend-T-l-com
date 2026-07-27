import { createEventDeduplicator, reconnectQueryKeys } from '@/features/realtime/use-realtime-sync';

describe('synchronisation temps réel', () => {
  it('resynchronise les collections et le ticket actif après reconnexion', () => {
    const ticketId = '019c1234-5678-7000-8000-000000000001';

    expect(reconnectQueryKeys(ticketId)).toEqual([
      ['tickets'],
      ['notifications'],
      ['tickets', 'detail', ticketId],
      ['tickets', ticketId, 'comments'],
      ['tickets', ticketId, 'history'],
    ]);
  });

  it('déduplique seulement les événements identifiés avec une mémoire bornée', () => {
    const accept = createEventDeduplicator(2);

    expect(accept()).toBe(true);
    expect(accept('event-a')).toBe(true);
    expect(accept('event-a')).toBe(false);
    expect(accept('event-b')).toBe(true);
    expect(accept('event-c')).toBe(true);
    expect(accept('event-a')).toBe(true);
  });
});
