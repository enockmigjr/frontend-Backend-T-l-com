import { NextResponse } from 'next/server';

import { clearSessionCookies } from '@/lib/auth/cookies';
import { endSessionUrl, isKeycloakAuth } from '@/lib/auth/keycloak';

export async function GET(): Promise<NextResponse> {
  if (!isKeycloakAuth()) return new NextResponse(null, { status: 404 });
  const response = NextResponse.redirect(endSessionUrl(), 302);
  clearSessionCookies(response);
  return response;
}
