/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });

import { NextResponse } from 'next/server';

import { clearSessionCookies, setSessionCookies } from '@/lib/auth/cookies';

describe('cookies de session du BFF', () => {
  beforeEach(() => {
    process.env.AUTH_COOKIE_SECURE = 'true';
    delete process.env.AUTH_ACCESS_COOKIE_NAME;
    delete process.env.AUTH_REFRESH_COOKIE_NAME;
    delete process.env.AUTH_CSRF_COOKIE_NAME;
    process.env.AUTH_CSRF_SECRET = 'a-secure-test-secret-with-at-least-32-characters';
  });

  it('garde access et refresh HttpOnly sans exposer leur valeur dans le corps', () => {
    const response = NextResponse.json({ success: true });
    setSessionCookies(response, { accessToken: 'access-secret', refreshToken: 'refresh-secret', expiresIn: 900 });
    const cookies = response.headers.getSetCookie().join('\n');
    expect(cookies).toContain('access_token=access-secret');
    expect(cookies).toContain('itsm-refresh-token=refresh-secret');
    expect(cookies.match(/HttpOnly/g)).toHaveLength(2);
    expect(cookies).toContain('Secure');
    expect(cookies).toContain('Path=/');
  });

  it('expire tous les cookies à la déconnexion', () => {
    const response = new NextResponse(null, { status: 204 });
    clearSessionCookies(response);
    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(4);
    expect(cookies).toContainEqual(expect.stringContaining('kc_id_token=;'));
    for (const cookie of cookies) expect(cookie).toContain('Max-Age=0');
  });
});
