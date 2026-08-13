import 'server-only';

import { backendInternalUrl } from '@/lib/auth/env';

/**
 * URL interne de l'API pour les appels BFF. Les anciens helpers locaux
 * (login, refresh, logout, change-password) ont été supprimés : l'authentification
 * est exclusivement gérée par Keycloak (voir lib/auth/keycloak.ts).
 */
export function backendUrl(pathname: string, search = ''): URL {
  if (!pathname.startsWith('/api/v1/') || pathname.includes('\\')) throw new Error('Invalid backend path');
  const base = backendInternalUrl();
  const url = new URL(pathname, `${base.origin}/`);
  url.search = search;
  return url;
}
