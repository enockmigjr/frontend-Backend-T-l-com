import { redact } from '@/features/audit/redact';

describe('redact', () => {
  it('masque les secrets imbriqués sans altérer les autres champs', () => {
    expect(
      redact({ email: 'agent@example.test', accessToken: 'secret', nested: { password: 'secret', state: 'active' } }),
    ).toEqual({
      email: 'agent@example.test',
      accessToken: '[MASQUÉ]',
      nested: { password: '[MASQUÉ]', state: 'active' },
    });
  });

  it('traite les tableaux et les valeurs primitives', () => {
    expect(redact([{ cookie: 'session' }, true])).toEqual([{ cookie: '[MASQUÉ]' }, true]);
  });
});
