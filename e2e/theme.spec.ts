import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { adminCredentials, requireLocalCredentials } from './helpers';

test('bascule clair/sombre/système avec persistance et contraste AA', async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!adminCredentials && !process.env.CI, 'Identifiants admin locaux non configurés.');
  await loginViaSso(page, requireLocalCredentials(adminCredentials, 'admin'));
  await page.goto('/settings?tab=interface', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Profil et paramètres' })).toBeVisible({ timeout: 20_000 });

  await page.getByRole('radio', { name: 'Sombre' }).check();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await page.screenshot({ path: 'e2e/screenshots/theme-dark.png', fullPage: true });
  expect((await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()).violations).toEqual([]);

  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === 'theme')?.value).toBe('dark');

  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.getByRole('radio', { name: 'Clair' }).check();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.screenshot({ path: 'e2e/screenshots/theme-light.png', fullPage: true });
  expect((await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()).violations).toEqual([]);

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'État des opérations' })).toBeVisible({ timeout: 20_000 });
  expect((await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()).violations).toEqual([]);

  await page.goto('/settings?tab=interface', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.getByRole('radio', { name: 'Sombre' }).check();
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'État des opérations' })).toBeVisible({ timeout: 20_000 });
  expect((await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()).violations).toEqual([]);

  await page.goto('/settings?tab=interface', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByRole('radio', { name: 'Système' }).check();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass(/dark/);
});

async function loginViaSso(page: Page, account: { email: string; password: string }): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.getByLabel('Adresse e-mail')).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Adresse e-mail').fill(account.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(account.password);
  await Promise.all([
    page.waitForURL(/\/(tickets|dashboard|settings|mon-activite)/, { waitUntil: 'domcontentloaded', timeout: 60_000 }),
    page.getByRole('button', { name: 'Se connecter' }).click(),
  ]);
}
