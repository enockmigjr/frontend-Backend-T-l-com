/** @jest-environment node */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const nginx = readFileSync(join(root, 'deploy', 'nginx-edge.conf'), 'utf8');
const envExample = readFileSync(join(root, '.env.example'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');

function socketIoBlock(): string {
  const block = nginx.match(/location \/socket\.io\/ \{([\s\S]*?)\n  \}/)?.[1];
  if (!block) throw new Error('Bloc Nginx /socket.io/ introuvable');
  return block;
}

function proxyHeader(header: string): string {
  const value = socketIoBlock().match(new RegExp(`proxy_set_header\\s+${header}\\s+([^;]+);`))?.[1];
  if (!value) throw new Error(`Directive proxy_set_header ${header} introuvable`);
  return value.trim();
}

function forwarded(value: string, request: Readonly<Record<string, string>>): string {
  return value.replace(/\$([a-z_]+)/g, (_, variable: string) => request[variable] ?? '');
}

function documentedCookieName(scope: 'Frontend/BFF' | 'Backend Nest'): string {
  const section = readme.split(`${scope} :`)[1]?.split('```dotenv')[1]?.split('```')[0];
  const name = section?.match(/^AUTH_ACCESS_COOKIE_NAME=(.+)$/m)?.[1];
  if (!name) throw new Error(`Nom du cookie access non documenté pour ${scope}`);
  return name.trim();
}

describe('proxy edge Socket.IO', () => {
  it.each([
    ['origine publique légitime', 'https://itsm.example.com'],
    ['origine hostile', 'https://attaquant.example'],
  ])('préserve %s afin que Nest effectue la validation', (_, browserOrigin) => {
    const origin = forwarded(proxyHeader('Origin'), { http_origin: browserOrigin });
    expect(origin).toBe(browserOrigin);
  });

  it('ne synthétise pas une origine de confiance et transmet le cookie HttpOnly', () => {
    expect(proxyHeader('Origin')).toBe('$http_origin');
    expect(proxyHeader('Origin')).not.toContain('$scheme');
    expect(proxyHeader('Cookie')).toBe('$http_cookie');

    const cookie = '__Host-access-token=jwt-test; autre=valeur';
    expect(forwarded(proxyHeader('Cookie'), { http_cookie: cookie })).toBe(cookie);
  });
});

describe('contrat du cookie access WebSocket', () => {
  it('emploie le même nom en production pour le BFF et Nest', () => {
    const example = envExample.match(/^AUTH_ACCESS_COOKIE_NAME=(.+)$/m)?.[1]?.trim();
    expect(example).toBe('__Host-access-token');
    expect(documentedCookieName('Frontend/BFF')).toBe(example);
    expect(documentedCookieName('Backend Nest')).toBe(example);
  });
});
