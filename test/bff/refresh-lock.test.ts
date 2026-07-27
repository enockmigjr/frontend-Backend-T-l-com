/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });

import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';

import { runDistributedRefresh, withRefreshLock } from '@/lib/auth/refresh-lock';

const redisIntegrationTest = process.env.RUN_REDIS_INTEGRATION === '1' ? it : it.skip;

describe('single-flight de rotation', () => {
  beforeEach(() => {
    delete process.env.REDIS_URL;
    process.env.AUTH_CSRF_SECRET = 'a-secure-test-secret-with-at-least-32-characters';
  });

  it('ne consomme qu’une fois le même refresh dans une instance', async () => {
    let release: (() => void) | undefined;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    const operation = jest.fn(async () => {
      await barrier;
      return { accessToken: 'access', refreshToken: 'rotated', expiresIn: 900 };
    });
    const first = withRefreshLock('refresh', operation);
    const second = withRefreshLock('refresh', operation);
    release?.();
    await expect(Promise.all([first, second])).resolves.toEqual([
      { accessToken: 'access', refreshToken: 'rotated', expiresIn: 900 },
      { accessToken: 'access', refreshToken: 'rotated', expiresIn: 900 },
    ]);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  redisIntegrationTest('réutilise atomiquement le résultat Redis pour une requête retardée', async () => {
    const client = new Redis('redis://127.0.0.1:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    const key = `test-${randomUUID()}`;
    const firstOperation = jest.fn(async () => ({
      accessToken: 'access',
      refreshToken: 'rotated',
      expiresIn: 900,
    }));
    const delayedOperation = jest.fn(async () => ({
      accessToken: 'should-not-run',
      refreshToken: 'should-not-run',
      expiresIn: 900,
    }));

    try {
      const firstResult = await runDistributedRefresh(client, key, firstOperation);
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      expect(await client.exists(`bff:refresh:lock:${key}`)).toBe(0);
      const delayedResult = await runDistributedRefresh(client, key, delayedOperation);

      expect(firstResult).toEqual({ accessToken: 'access', refreshToken: 'rotated', expiresIn: 900 });
      expect(delayedResult).toEqual(firstResult);
      expect(firstOperation).toHaveBeenCalledTimes(1);
      expect(delayedOperation).not.toHaveBeenCalled();
    } finally {
      await client.del(`bff:refresh:lock:${key}`, `bff:refresh:result:${key}`);
      client.disconnect();
    }
  });
});
