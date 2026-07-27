import { departmentSchema, reportSchema } from '@/features/users/api/validation';

describe('validation des réponses administration', () => {
  it('refuse un département incomplet reçu de l’API', () => {
    expect(() => departmentSchema.parse({ id: 'pas-un-uuid', name: 'NOC' })).toThrow();
  });

  it('refuse un statut de rapport inventé', () => {
    expect(() =>
      reportSchema.parse({
        id: '019c1234-1234-7123-8123-123456789abc',
        type: 'sla-report',
        status: 'running',
        requestedBy: '019c1234-1234-7123-8123-123456789abc',
        createdAt: '2026-07-22T00:00:00Z',
      }),
    ).toThrow();
  });
});
