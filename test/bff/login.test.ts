/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });

import { NextRequest } from 'next/server';

import { POST } from '@/app/api/auth/login/route';
import { createCsrfToken } from '@/lib/auth/csrf';

const fetchMock = jest.fn<Promise<Response>, [Request | URL | string, RequestInit?]>();

describe('route BFF de connexion', () => {
  beforeEach(() => {
    process.env.BACKEND_INTERNAL_URL = 'http://backend:3000';
    process.env.AUTH_COOKIE_SECURE = 'true';
    process.env.AUTH_CSRF_SECRET = 'a-secure-test-secret-with-at-least-32-characters';
    delete process.env.PUBLIC_APP_ORIGIN;
    global.fetch = fetchMock;
    fetchMock.mockReset();
  });

  it('place les jetons en cookies HttpOnly et ne les renvoie jamais au JavaScript', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            accessToken: 'access-secret',
            refreshToken: 'refresh-secret',
            expiresIn: 900,
            user: {
              id: 'user-id',
              email: 'agent@telecom.local',
              firstName: 'Ada',
              lastName: 'Lovelace',
              role: 'NOC_ENGINEER',
              departmentId: 'department-id',
              departmentName: null,
              mustChangePassword: false,
            },
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const csrf = createCsrfToken();
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        'content-type': 'application/json',
        cookie: `itsm-csrf-token=${csrf}`,
        'x-csrf-token': csrf,
      },
      body: JSON.stringify({ email: 'agent@telecom.local', password: 'Secret@123' }),
    });
    const response = await POST(request);
    const body = await response.text();
    const cookies = response.headers.getSetCookie().join('\n');
    expect(response.status).toBe(200);
    expect(body).not.toContain('access-secret');
    expect(body).not.toContain('refresh-secret');
    expect(body).toContain('agent@telecom.local');
    expect(body).toContain('"departmentName":null');
    expect(cookies).toContain('access-secret');
    expect(cookies).toContain('refresh-secret');
    expect(cookies.match(/HttpOnly/g)).toHaveLength(2);
  });
});
