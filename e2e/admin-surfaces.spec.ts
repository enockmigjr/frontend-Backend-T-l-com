import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { adminCredentials, login, requireLocalCredentials } from './helpers';

test('@critical-2 charge les surfaces dashboard, utilisateurs et rapports avec les APIs réelles', async ({ page }) => {
  test.skip(!adminCredentials && !process.env.CI, 'Identifiants admin locaux non configurés.');
  await login(page, requireLocalCredentials(adminCredentials, 'admin'));

  const dashboardPaths = [
    '/api/v1/dashboard/overview',
    '/api/v1/dashboard/tickets-by-status',
    '/api/v1/dashboard/tickets-by-priority',
    '/api/v1/dashboard/sla-compliance',
    '/api/v1/dashboard/workload',
    '/api/v1/dashboard/resolution-time',
    '/api/v1/dashboard/departments',
  ];
  const dashboardResponses = Promise.all(
    dashboardPaths.map((path) => page.waitForResponse((response) => response.url().includes(path))),
  );
  await page.goto('/dashboard');
  for (const response of await dashboardResponses) expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Supervision opérationnelle' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const usersResponse = page.waitForResponse((response) => response.url().includes('/api/v1/users?limit=100'));
  await page.goto('/admin/users');
  expect((await usersResponse).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Utilisateurs' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Utilisateurs visibles' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const reportsResponse = page.waitForResponse((response) => response.url().includes('/api/v1/reports?limit=50'));
  await page.goto('/reports');
  expect((await reportsResponse).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Rapports' })).toBeVisible();

  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(JSON.stringify(storage)).not.toMatch(/accessToken|refreshToken|eyJ[A-Za-z0-9_-]+\./);
});
