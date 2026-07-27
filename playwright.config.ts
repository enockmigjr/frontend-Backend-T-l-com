import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

function localServer(): { readonly origin: string; readonly hostname: string; readonly port: number } {
  const url = new URL(process.env.PUBLIC_APP_ORIGIN ?? 'http://127.0.0.1:3301');
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error('PUBLIC_APP_ORIGIN doit cibler localhost en HTTP pour le serveur Playwright local.');
  }
  const port = Number(url.port || '80');
  if (!Number.isSafeInteger(port) || port < 1024 || port > 49151) throw new Error('Port Playwright local invalide.');
  return { origin: url.origin, hostname: url.hostname, port };
}

const server = localServer();

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  // Les parcours réels partagent des comptes seedés et doivent rester sérialisés.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? server.origin,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `pnpm dev --hostname ${server.hostname} --port ${server.port}`,
        url: server.origin,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
