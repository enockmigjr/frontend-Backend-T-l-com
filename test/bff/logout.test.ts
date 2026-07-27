/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });

import { NextRequest } from 'next/server';

import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as logoutAll } from '@/app/api/auth/logout-all/route';
import { PUT as changePassword } from '@/app/api/auth/change-password/route';
import { createCsrfToken } from '@/lib/auth/csrf';

const fetchMock = jest.fn<Promise<Response>, [Request | URL | string, RequestInit?]>();
const rotatedPair = {
  success: true,
  data: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh', expiresIn: 900 },
};

function authRequest(path: string, method: 'POST' | 'PUT', accessToken?: string): NextRequest {
  const csrf = createCsrfToken('old-refresh');
  const cookie = [
    accessToken ? `access_token=${accessToken}` : undefined,
    'itsm-refresh-token=old-refresh',
    `itsm-csrf-token=${csrf}`,
  ]
    .filter(Boolean)
    .join('; ');
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: {
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
      cookie,
      'x-csrf-token': csrf,
      ...(method === 'PUT' ? { 'content-type': 'application/json' } : {}),
    },
    body: method === 'PUT' ? JSON.stringify({ currentPassword: 'Old@1234', newPassword: 'New@12345' }) : undefined,
  });
}

function tokenResponse(): Response {
  return new Response(JSON.stringify(rotatedPair), { status: 200, headers: { 'content-type': 'application/json' } });
}

describe('terminaison de session avec access absent ou expiré', () => {
  beforeEach(() => {
    process.env.BACKEND_INTERNAL_URL = 'http://backend:3000';
    process.env.AUTH_CSRF_SECRET = 'a-secure-test-secret-with-at-least-32-characters';
    delete process.env.REDIS_URL;
    delete process.env.PUBLIC_APP_ORIGIN;
    global.fetch = fetchMock;
    fetchMock.mockReset();
  });

  it('rotate puis révoque le nouveau refresh si access manque, sans persister les nouveaux jetons', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await logout(authRequest('/api/auth/logout', 'POST'));
    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const revokeInit = fetchMock.mock.calls[1]?.[1];
    expect(revokeInit?.headers).toBeInstanceOf(Headers);
    if (!(revokeInit?.headers instanceof Headers)) throw new Error('Expected Headers');
    expect(revokeInit.headers.get('authorization')).toBe('Bearer fresh-access');
    expect(revokeInit.body).toBe(JSON.stringify({ refreshToken: 'fresh-refresh' }));
    const cookies = response.headers.getSetCookie().join('\n');
    expect(cookies).not.toContain('fresh-access');
    expect(cookies).not.toContain('fresh-refresh');
    expect(cookies).toContain('Max-Age=0');
  });

  it('sur access expiré, rotate puis retente seulement la révocation', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await logout(authRequest('/api/auth/logout', 'POST', 'expired-access'));
    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(response.headers.getSetCookie().join('\n')).not.toContain('fresh-refresh');
  });

  it('logout-all obtient un access frais puis révoque toutes les sessions', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await logoutAll(authRequest('/api/auth/logout-all', 'POST'));
    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.headers.getSetCookie().join('\n')).not.toContain('fresh-access');
  });

  it('change-password rafraîchit avant l’unique mutation et conserve la session tournée', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const response = await changePassword(authRequest('/api/auth/change-password', 'PUT', 'expired-access'));
    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const mutationInit = fetchMock.mock.calls[1]?.[1];
    if (!(mutationInit?.headers instanceof Headers)) throw new Error('Expected Headers');
    expect(mutationInit.headers.get('authorization')).toBe('Bearer fresh-access');
    expect(response.headers.getSetCookie().join('\n')).toContain('fresh-refresh');
  });
});
