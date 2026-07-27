import type { NextRequest } from 'next/server';

import { proxyToBackend } from '@/lib/api/server-proxy';

interface RouteContext {
  readonly params: Promise<{ readonly path: readonly string[] }>;
}

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
