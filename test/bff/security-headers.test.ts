/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });

import { NextRequest } from 'next/server';

import { GET as health } from '@/app/api/health/route';
import { proxy } from '@/proxy';

describe('en-têtes de sécurité et liveness', () => {
  it('produit une CSP restrictive avec nonce par requête', () => {
    const first = proxy(new NextRequest('http://localhost:3000/login'));
    const second = proxy(new NextRequest('http://localhost:3000/login'));
    const firstPolicy = first.headers.get('content-security-policy');
    const secondPolicy = second.headers.get('content-security-policy');
    expect(firstPolicy).toContain("script-src 'self' 'nonce-");
    expect(firstPolicy).toContain("'strict-dynamic'");
    expect(firstPolicy).toContain("object-src 'none'");
    expect(firstPolicy).toContain("base-uri 'self'");
    expect(firstPolicy).toContain("frame-ancestors 'none'");
    expect(firstPolicy).not.toBe(secondPolicy);
    expect(first.headers.get('x-middleware-request-x-nonce')).toBeTruthy();
  });

  it('redirige une page protégée sans session', () => {
    const response = proxy(new NextRequest('http://localhost:3000/dashboard'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?retour=%2Fdashboard');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
  });

  it('expose un healthcheck minimal non mis en cache', async () => {
    const response = health();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
