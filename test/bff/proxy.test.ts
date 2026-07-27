/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });

import { NextRequest } from 'next/server';

import { createCsrfToken } from '@/lib/auth/csrf';
import { proxyToBackend } from '@/lib/api/server-proxy';

const fetchMock = jest.fn<Promise<Response>, [Request | URL | string, RequestInit?]>();

function request(method: string, csrfToken?: string): NextRequest {
  const headers = new Headers({
    host: 'localhost:3000',
    origin: 'http://localhost:3000',
    cookie: `access_token=access-secret; itsm-refresh-token=refresh-secret${csrfToken ? `; itsm-csrf-token=${csrfToken}` : ''}`,
  });
  if (csrfToken) headers.set('x-csrf-token', csrfToken);
  if (method === 'POST') headers.set('content-type', 'application/json');
  return new NextRequest('http://localhost:3000/api/v1/tickets?page=2', {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify({ title: 'Incident' }) : undefined,
  });
}

describe('proxy HTTP du BFF', () => {
  beforeEach(() => {
    process.env.BACKEND_INTERNAL_URL = 'http://backend:3000';
    process.env.AUTH_CSRF_SECRET = 'a-secure-test-secret-with-at-least-32-characters';
    delete process.env.PUBLIC_APP_ORIGIN;
    global.fetch = fetchMock;
    fetchMock.mockReset();
  });

  it('injecte Bearer, conserve query/download et retire Set-Cookie upstream', async () => {
    fetchMock.mockResolvedValue(
      new Response('pdf', {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename=report.pdf',
          'set-cookie': 'leak=1',
        },
      }),
    );
    const response = await proxyToBackend(request('GET'), ['reports', 'report-id', 'download']);
    const upstreamRequest = fetchMock.mock.calls[0]?.[0];
    expect(upstreamRequest).toBeInstanceOf(Request);
    if (!(upstreamRequest instanceof Request)) throw new Error('Expected a Request');
    expect(upstreamRequest.url).toBe('http://backend:3000/api/v1/reports/report-id/download?page=2');
    expect(upstreamRequest.headers.get('authorization')).toBe('Bearer access-secret');
    expect(response.headers.get('content-disposition')).toContain('report.pdf');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('refuse une mutation sans CSRF avant tout appel backend', async () => {
    const response = await proxyToBackend(request('POST'), ['tickets']);
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ne rejoue jamais une mutation après un 401', async () => {
    const csrf = createCsrfToken('refresh-secret');
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
    const response = await proxyToBackend(request('POST', csrf), ['tickets']);
    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('bloque les routes capables d’exposer les jetons', async () => {
    const response = await proxyToBackend(request('GET'), ['auth', 'login']);
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
