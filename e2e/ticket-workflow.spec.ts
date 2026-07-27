import { expect, test, type Page } from '@playwright/test';
import { adminCredentials, agentCredentials, login, requireLocalCredentials, responseDataId } from './helpers';

async function selectAssignee(page: Page, label: string): Promise<void> {
  const select = page.locator('section[aria-labelledby="actions-title"] select');
  const responsePromise = page.waitForResponse((response) => {
    const path = new URL(response.url()).pathname;
    return /\/api\/v1\/tickets\/[^/]+\/(assign|reassign)$/.test(path) && response.request().method() === 'POST';
  });
  await select.selectOption({ label });
  expect((await responsePromise).status()).toBe(200);
}

async function transition(page: Page, button: string, action: string): Promise<void> {
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith(`/${action}`) && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: button, exact: true }).click();
  expect((await responsePromise).status()).toBe(200);
}

test('@critical-4 exécute le cycle ticket complet et livre une notification', async ({ browser, page }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(
    (!adminCredentials || !agentCredentials) && !process.env.CI,
    'Identifiants admin/agent locaux non configurés.',
  );
  const admin = requireLocalCredentials(adminCredentials, 'admin');
  const agent = requireLocalCredentials(agentCredentials, 'agent');
  const title = `E2E incident fibre ${Date.now()}`;
  await login(page, admin);
  await page.goto('/tickets/new');
  await expect(page).toHaveURL(/\/tickets\/new$/);
  await page.getByLabel("Titre de l’incident").fill(title);
  await page.getByLabel('Description détaillée').fill('Incident créé par Playwright pour valider le parcours réel complet.');
  await page.getByLabel('Catégorie').selectOption({ index: 1 });
  await page.getByLabel('Département propriétaire').selectOption({ label: 'Customer Care' });
  await page.getByLabel('Équipe assignée').selectOption({ label: 'Customer Care' });
  const createResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/v1/tickets' && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Créer le ticket' }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);
  const ticketId = responseDataId(await createResponse.json());
  await expect(page).toHaveURL(new RegExp(`/tickets/${ticketId}$`));

  const agentInfo = page.getByText('Agent', { exact: true }).locator('..').locator('dd');
  if ((await agentInfo.textContent())?.includes('Alice Dupont')) await selectAssignee(page, 'Thomas Lebrun');
  await selectAssignee(page, 'Alice Dupont');
  await expect(agentInfo).toContainText('Alice Dupont');
  await transition(page, 'Démarrer le traitement', 'start');

  const comment = `Commentaire E2E ${ticketId}`;
  await page.getByPlaceholder('Ajouter un commentaire public…').fill(comment);
  const commentResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/comments') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Publier' }).click();
  expect((await commentResponse).status()).toBe(201);
  await expect(page.getByText(comment)).toBeVisible();

  await page.getByRole('tab', { name: 'Notes internes' }).click();
  const note = `Note interne E2E ${ticketId}`;
  await page.getByPlaceholder('Ajouter une note réservée aux équipes…').fill(note);
  const noteResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/internal-notes') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Publier' }).click();
  expect((await noteResponse).status()).toBe(201);
  await expect(page.getByText(note)).toBeVisible();

  const uploadResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/v1/attachments' && response.request().method() === 'POST',
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: `preuve-${ticketId}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from(`Preuve réelle du ticket ${ticketId}.`, 'utf8'),
  });
  expect((await uploadResponse).status()).toBe(201);
  await expect(page.getByText(`preuve-${ticketId}.txt`)).toBeVisible();

  await page.getByRole('button', { name: 'Résoudre', exact: true }).click();
  await page.getByLabel('Résumé de la résolution').fill('Liaison fibre rétablie et contrôlée.');
  await transition(page, 'Confirmer', 'resolve');
  await transition(page, 'Clôturer', 'close');
  await expect(page.getByText('Clôturé', { exact: true })).toBeVisible();

  const baseURL = testInfo.project.use.baseURL;
  if (typeof baseURL !== 'string') throw new Error('baseURL Playwright requise.');
  const agentContext = await browser.newContext({ baseURL });
  const agentPage = await agentContext.newPage();
  await login(agentPage, agent);
  await agentPage.goto('/notifications');
  await expect(agentPage.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  const notification = agentPage.locator(`a[href="/tickets/${ticketId}"]`);
  await expect(notification).toHaveCount(1, { timeout: 20_000 });
  await expect(notification.first()).toContainText('Nouveau ticket assigné');
  await agentContext.close();

  await page.getByRole('button', { name: 'Supprimer' }).click();
  const deleteResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === `/api/v1/tickets/${ticketId}` && response.request().method() === 'DELETE',
  );
  await page.getByRole('button', { name: 'Confirmer la suppression' }).click();
  expect((await deleteResponse).status()).toBe(204);
  await expect(page).toHaveURL(/\/tickets$/);
});
