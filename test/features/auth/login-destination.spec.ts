import { authenticatedDestination } from '@/features/auth/login-form';

describe('destination après connexion', () => {
  it.each([
    ['ADMINISTRATOR', '/dashboard'],
    ['SUPERVISOR', '/dashboard'],
    ['CUSTOMER_SERVICE_AGENT', '/tickets'],
    ['NOC_ENGINEER', '/tickets'],
    ['BILLING_AGENT', '/tickets'],
    ['TECHNICAL_SUPPORT_ENGINEER', '/tickets'],
    ['FIELD_TECHNICIAN', '/tickets'],
  ] as const)('redirige %s vers %s', (role, destination) => {
    expect(authenticatedDestination(role)).toBe(destination);
  });
});
