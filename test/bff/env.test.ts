/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });

import { authEnvironment } from '@/lib/auth/env';

describe('configuration BFF de production', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('refuse de fonctionner sans Redis multi-instance', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'production');
    process.env.AUTH_CSRF_SECRET = 'a-secure-test-secret-with-at-least-32-characters';
    delete process.env.REDIS_URL;
    expect(() => authEnvironment()).toThrow('REDIS_URL is required in production');
  });
});
