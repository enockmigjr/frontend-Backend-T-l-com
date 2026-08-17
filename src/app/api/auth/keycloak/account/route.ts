import { NextResponse } from 'next/server';

import { keycloakAccountUrl } from '@/lib/auth/keycloak';

/** Redirige vers la console de compte Keycloak (mot de passe, sessions, appareils). */
export async function GET(): Promise<NextResponse> {
  return NextResponse.redirect(keycloakAccountUrl(), 302);
}
