import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  adminCredentials,
  agentCredentials,
  firstTicketId,
  login,
  requireLocalCredentials,
  requiredString,
  responseData,
} from './helpers';

test('@critical-3 impose le périmètre départemental à un agent Customer Care', async ({ browser, page }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(
    (!adminCredentials || !agentCredentials) && !process.env.CI,
    'Identifiants admin/agent locaux non configurés.',
  );
  const baseURL = testInfo.project.use.baseURL;
  if (typeof baseURL !== 'string') throw new Error('baseURL Playwright requise.');

  const adminContext = await browser.newContext({ baseURL });
  const adminPage = await adminContext.newPage();
  await login(adminPage, requireLocalCredentials(adminCredentials, 'admin'));
  const seeded = await adminPage.request.get(
    '/api/v1/tickets?search=Interf%C3%A9rence%20r%C3%A9seau%20mobile&limit=10',
  );
  expect(seeded.status()).toBe(200);
  const ticketId = firstTicketId(await seeded.json());
  const ticketDetails = await adminPage.request.get(
    `/api/v1/tickets/${ticketId}?detail=full&assignmentPage=1&assignmentLimit=20`,
  );
  expect(ticketDetails.status()).toBe(200);
  const outOfScopeTicket = responseData(await ticketDetails.json());
  expect(requiredString(outOfScopeTicket, 'departmentName')).toBe('NOC');
  expect(requiredString(outOfScopeTicket, 'creatorName')).not.toBe('Alice Dupont');
  await adminContext.close();

  await login(page, requireLocalCredentials(agentCredentials, 'agent Customer Care'));
  const me = await page.request.get('/api/v1/users/me');
  expect(me.status()).toBe(200);
  const identity = responseData(await me.json());
  expect(requiredString(identity, 'email')).toBe('agent-cc1@telecom.local');
  expect(`${requiredString(identity, 'firstName')} ${requiredString(identity, 'lastName')}`).toBe('Alice Dupont');
  expect(requiredString(identity, 'role')).toBe('CUSTOMER_SERVICE_AGENT');
  const department = await page.request.get(`/api/v1/departments/${requiredString(identity, 'departmentId')}`);
  expect(department.status()).toBe(200);
  expect(requiredString(responseData(await department.json()), 'name')).toBe('Customer Care');
  await page.goto('/tickets');
  await expect(page).toHaveURL(/\/tickets$/);
  await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const forbiddenResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === `/api/v1/tickets/${ticketId}` && response.request().method() === 'GET';
  });
  await page.goto(`/tickets/${ticketId}`);
  expect((await forbiddenResponse).status()).toBe(403);
  await expect(page.getByRole('heading', { name: 'Accès refusé' })).toBeVisible();

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Accès interdit' })).toBeVisible();
});
