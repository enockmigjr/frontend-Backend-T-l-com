/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });

import { NextRequest, NextResponse } from 'next/server';

import { createCsrfToken, hasTrustedOrigin, setCsrfCookie, verifyCsrf } from '@/lib/auth/csrf';

const REFRESH_TOKEN = 'refresh-secret';

function mutationRequest(token: string, origin = 'http://localhost:3000'): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/tickets', {
    method: 'POST',
    headers: {
      host: 'localhost:3000',
      origin,
      cookie: `itsm-refresh-token=${REFRESH_TOKEN}; itsm-csrf-token=${token}`,
      'x-csrf-token': token,
    },
  });
}

describe('protection CSRF du BFF', () => {
  beforeEach(() => {
    delete process.env.PUBLIC_APP_ORIGIN;
    process.env.AUTH_CSRF_SECRET = 'a-secure-test-secret-with-at-least-32-characters';
  });

  it('accepte le double-submit lié au refresh et à la même origine', () => {
    const token = createCsrfToken(REFRESH_TOKEN);
    expect(hasTrustedOrigin(mutationRequest(token))).toBe(true);
    expect(verifyCsrf(mutationRequest(token))).toBe(true);
  });

  it('refuse une origine étrangère et un header différent', () => {
    const token = createCsrfToken(REFRESH_TOKEN);
    expect(verifyCsrf(mutationRequest(token, 'https://evil.example'))).toBe(false);
    const request = mutationRequest(token);
    request.headers.set('x-csrf-token', `${token}x`);
    expect(verifyCsrf(request)).toBe(false);
  });

  it('invalide le jeton après rotation du refresh', () => {
    const token = createCsrfToken('old-refresh');
    expect(verifyCsrf(mutationRequest(token))).toBe(false);
  });

  it('émet un cookie lisible par le client, Secure et SameSite', () => {
    process.env.AUTH_COOKIE_SECURE = 'true';
    const response = NextResponse.json({ ok: true });
    setCsrfCookie(response, 'csrf-value');
    const cookie = response.headers.get('set-cookie');
    expect(cookie).toContain('itsm-csrf-token=csrf-value');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=lax');
    expect(cookie).not.toContain('HttpOnly');
  });
});
