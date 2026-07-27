import { expect, type Page } from '@playwright/test';

export type Credentials = Readonly<{ email: string; password: string }>;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function credentials(prefix: 'E2E_USER' | 'E2E_AGENT'): Credentials | undefined {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (email && password) return { email, password };
  if (process.env.CI) {
    throw new Error(`${prefix}_EMAIL et ${prefix}_PASSWORD sont obligatoires en CI pour les E2E réels.`);
  }
  return undefined;
}

export const adminCredentials = credentials('E2E_USER');
export const agentCredentials = credentials('E2E_AGENT');

export function requireLocalCredentials(value: Credentials | undefined, label: string): Credentials {
  if (value) return value;
  throw new Error(`Identifiants ${label} absents. Ce scénario ne peut être exécuté qu'avec un backend seedé.`);
}

export async function login(page: Page, account: Credentials): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Adresse email').fill(account.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(account.password);
  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/api/auth/login') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Se connecter' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(/\/(tickets|dashboard|change-password)/, { timeout: 15_000 });
  const cookieNames = (await page.context().cookies()).map((cookie) => cookie.name);
  expect(cookieNames).toContain('access_token');
  expect(cookieNames).toContain('itsm-refresh-token');
}

export function firstTicketId(value: unknown): string {
  if (typeof value !== 'object' || value === null || !('data' in value) || !Array.isArray(value.data)) {
    throw new Error('Liste de tickets backend invalide.');
  }
  const item = value.data[0];
  if (typeof item !== 'object' || item === null || !('id' in item) || typeof item.id !== 'string') {
    throw new Error('Aucun ticket seedé correspondant trouvé.');
  }
  return item.id;
}

export function responseDataId(value: unknown): string {
  if (typeof value !== 'object' || value === null || !('data' in value)) throw new Error('Enveloppe API invalide.');
  const data = value.data;
  if (typeof data !== 'object' || data === null || !('id' in data) || typeof data.id !== 'string') {
    throw new Error('Identifiant absent de la réponse API.');
  }
  return data.id;
}

export function responseData(value: unknown): Readonly<Record<string, unknown>> {
  if (!isRecord(value) || !('data' in value)) throw new Error('Enveloppe API invalide.');
  const data = value.data;
  if (!isRecord(data)) throw new Error('Données API invalides.');
  return data;
}

export function requiredString(data: Readonly<Record<string, unknown>>, key: string): string {
  const value = data[key];
  if (typeof value !== 'string') throw new Error(`Champ API ${key} invalide.`);
  return value;
}

export function isCsrfPayload(value: unknown): value is { data: { csrfToken: string } } {
  if (typeof value !== 'object' || value === null || !('data' in value)) return false;
  const data = value.data;
  return typeof data === 'object' && data !== null && 'csrfToken' in data && typeof data.csrfToken === 'string';
}
