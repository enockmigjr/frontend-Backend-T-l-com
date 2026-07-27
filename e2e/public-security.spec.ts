import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { isCsrfPayload } from './helpers';

test('@critical-1 protège les accès publics et la mutation de connexion', async ({ page, request }) => {
  await page.goto('/tickets');
  await expect(page).toHaveURL(/\/login\?retour=/);
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();

  const csrf = await request.get('/api/auth/csrf');
  const payload: unknown = await csrf.json();
  if (!isCsrfPayload(payload)) throw new Error('Réponse CSRF invalide.');
  const rejected = await request.post('/api/auth/login', {
    headers: { origin: 'https://attaque.example', 'x-csrf-token': payload.data.csrfToken },
    data: { email: 'attacker@example.com', password: 'Invalid@123' },
  });
  expect(rejected.status()).toBe(403);

  await page.goto('/login');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
