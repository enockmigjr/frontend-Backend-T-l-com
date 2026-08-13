import type { UserRole } from '@/lib/auth/session';

export function authenticatedDestination(role: UserRole): string {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR' ? '/dashboard' : '/tickets';
}

export function safeReturnPath(value: string | null): string | undefined {
  if (!value?.startsWith('/') || value.startsWith('//') || value.includes('\\')) return undefined;
  try {
    const parsed = new URL(value, 'https://local.invalid');
    if (parsed.origin !== 'https://local.invalid' || parsed.pathname === '/login') {
      return undefined;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return undefined;
  }
}
