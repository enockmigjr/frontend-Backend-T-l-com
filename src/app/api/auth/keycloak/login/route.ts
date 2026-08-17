import { NextResponse } from 'next/server';

import { buildAuthorizeUrl, generatePkce } from '@/lib/auth/keycloak';

const KcCookie = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 600 };

export async function GET(): Promise<NextResponse> {
  const { verifier, challenge } = generatePkce();
  const state = verifier.slice(0, 32);
  const response = NextResponse.redirect(buildAuthorizeUrl(state, challenge), 302);
  response.cookies.set('kc_verifier', verifier, KcCookie);
  response.cookies.set('kc_state', state, KcCookie);
  return response;
}
