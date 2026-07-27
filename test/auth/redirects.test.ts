import { authenticatedDestination, safeReturnPath } from '@/features/auth/redirects';

describe('redirections d’authentification', () => {
  it('conserve uniquement un retour interne', () => {
    expect(safeReturnPath('/tickets/123?tab=notes')).toBe('/tickets/123?tab=notes');
    expect(safeReturnPath('https://evil.example')).toBeUndefined();
    expect(safeReturnPath('//evil.example/path')).toBeUndefined();
    expect(safeReturnPath('/\\evil.example')).toBeUndefined();
    expect(safeReturnPath('/login')).toBeUndefined();
    expect(safeReturnPath('/change-password')).toBeUndefined();
  });

  it('choisit un accueil adapté au rôle', () => {
    expect(authenticatedDestination('ADMINISTRATOR')).toBe('/dashboard');
    expect(authenticatedDestination('SUPERVISOR')).toBe('/dashboard');
    expect(authenticatedDestination('NOC_ENGINEER')).toBe('/tickets');
  });
});
