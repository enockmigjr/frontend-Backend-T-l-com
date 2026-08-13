import { NextResponse } from 'next/server';

import { isKeycloakAuth, keycloakAccountUrl } from '@/lib/auth/keycloak';

/** Redirige vers la console de compte Keycloak (mot de passe, sessions, appareils). */
export async function GET(): Promise<NextResponse> {
  if (!isKeycloakAuth()) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(keycloakAccountUrl(), 302);
}
