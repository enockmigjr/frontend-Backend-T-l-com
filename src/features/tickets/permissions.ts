import type { CurrentUser } from '@/features/auth/schemas';
import type { Ticket } from './schemas';

export function isElevated(user?: CurrentUser): boolean {
  return user?.role === 'SUPERVISOR' || user?.role === 'ADMINISTRATOR';
}

export function isAssigned(ticket: Ticket, user?: CurrentUser): boolean {
  return Boolean(user && ticket.assignedTo === user.id);
}

export function canOperate(ticket: Ticket, user?: CurrentUser): boolean {
  return isElevated(user) || isAssigned(ticket, user);
}

export function canEditTicket(ticket: Ticket, user?: CurrentUser): boolean {
  if (!user) return false;
  return isElevated(user) || isAssigned(ticket, user) || (ticket.createdBy === user.id && ticket.status === 'NEW');
}

export function canReopenTicket(ticket: Ticket, user?: CurrentUser, now = Date.now()): boolean {
  if (!user || ticket.status !== 'CLOSED') return false;
  if (isElevated(user)) return true;
  if (user.role !== 'CUSTOMER_SERVICE_AGENT' || ticket.createdBy !== user.id || !ticket.closedAt) return false;
  return now - new Date(ticket.closedAt).getTime() <= 30 * 24 * 60 * 60 * 1000;
}

export function canDeleteTicket(user?: CurrentUser): boolean {
  return user?.role === 'ADMINISTRATOR';
}

export function editableFields(ticket: Ticket, user?: CurrentUser): ReadonlySet<string> {
  const fields = new Set<string>();
  if (!user) return fields;
  const elevated = isElevated(user);
  const assigned = isAssigned(ticket, user);
  const creatorOfNew = ticket.createdBy === user.id && ticket.status === 'NEW';
  if (elevated || assigned || creatorOfNew) fields.add('title').add('description');
  if (elevated || creatorOfNew) fields.add('categoryId');
  if (elevated) fields.add('priority').add('severity');
  if (elevated || assigned) fields.add('tags');
  return fields;
}
