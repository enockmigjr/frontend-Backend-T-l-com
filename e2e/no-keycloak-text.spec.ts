import { expect, test, type Page } from '@playwright/test';
import { adminCredentials, requireLocalCredentials } from './helpers';

test('aucune mention visible de Keycloak dans la console', async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!adminCredentials && !process.env.CI, 'Identifiants admin locaux non configurés.');
  await loginViaSso(page, requireLocalCredentials(adminCredentials, 'admin'));

  const surfaces = ['/tickets', '/dashboard', '/settings', '/admin/users', '/reports'];
  for (const path of surfaces) {
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.locator('body')).not.toContainText(/keycloak/i, { timeout: 20_000 });
  }

  await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Profil et paramètres' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Compte et sécurité' })).toBeVisible();
  await expect(page.getByText('gérés par votre compte professionnel', { exact: false })).toBeVisible();

  await page
    .locator('header')
    .getByRole('button', {
      name: /Administrateur|Superviseur|Service client|Agent NOC|Facturation|Support technique|Technicien terrain/,
    })
    .click();
  await expect(page.getByRole('menuitem', { name: 'Compte et sécurité' })).toBeVisible();
  await expect(page.getByRole('menu')).not.toContainText(/keycloak/i);
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
