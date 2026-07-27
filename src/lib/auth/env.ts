import 'server-only';

const HOST_COOKIE_PREFIX = '__Host-';

function requiredUrl(name: 'BACKEND_INTERNAL_URL'): URL {
  const raw = process.env[name];
  if (!raw) throw new Error(`${name} is required`);

  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must be an HTTP(S) origin without credentials, query, or fragment`);
  }
  return url;
}

function cookieName(envName: string, productionName: string, developmentName: string): string {
  const configured = process.env[envName];
  if (process.env.NODE_ENV === 'production') {
    const name = configured ?? productionName;
    if (!name.startsWith(HOST_COOKIE_PREFIX)) throw new Error(`${envName} must use the __Host- prefix in production`);
    return name;
  }
  return configured?.startsWith(HOST_COOKIE_PREFIX) ? developmentName : (configured ?? developmentName);
}

export function backendInternalUrl(): URL {
  return requiredUrl('BACKEND_INTERNAL_URL');
}

export function authEnvironment() {
  const production = process.env.NODE_ENV === 'production';
  const csrfSecret =
    process.env.AUTH_CSRF_SECRET ?? (production ? undefined : 'development-only-csrf-secret-change-me');
  if (!csrfSecret || csrfSecret.length < 32) throw new Error('AUTH_CSRF_SECRET must contain at least 32 characters');
  const refreshMaxAgeSeconds = Number(process.env.AUTH_REFRESH_MAX_AGE_SECONDS ?? 7 * 24 * 60 * 60);
  if (!Number.isSafeInteger(refreshMaxAgeSeconds) || refreshMaxAgeSeconds <= 0) {
    throw new Error('AUTH_REFRESH_MAX_AGE_SECONDS must be a positive integer');
  }
  if (production && !process.env.REDIS_URL) throw new Error('REDIS_URL is required in production');

  return {
    redisUrl: process.env.REDIS_URL,
    publicOrigin: process.env.PUBLIC_APP_ORIGIN ? new URL(process.env.PUBLIC_APP_ORIGIN).origin : undefined,
    csrfSecret,
    secureCookies: production || process.env.AUTH_COOKIE_SECURE === 'true',
    accessCookieName: cookieName('AUTH_ACCESS_COOKIE_NAME', '__Host-access-token', 'access_token'),
    refreshCookieName: cookieName('AUTH_REFRESH_COOKIE_NAME', '__Host-refresh-token', 'itsm-refresh-token'),
    csrfCookieName: cookieName('AUTH_CSRF_COOKIE_NAME', '__Host-csrf-token', 'itsm-csrf-token'),
    refreshMaxAgeSeconds,
  } as const;
}
