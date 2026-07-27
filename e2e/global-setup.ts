import type { FullConfig } from '@playwright/test';

const READY_TIMEOUT_MS = 60_000;
const POLL_MS = 250;

async function wait(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL;
  if (typeof baseURL !== 'string') throw new Error('baseURL Playwright requise.');

  const csrfUrl = new URL('/api/auth/csrf', baseURL);
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(csrfUrl, { cache: 'no-store' });
      if (response.ok) return;
    } catch {
      // Le serveur ou la route BFF peut encore être en compilation.
    }
    await wait(POLL_MS);
  }
  throw new Error(`La route BFF CSRF n'est pas prête après ${READY_TIMEOUT_MS} ms.`);
}
