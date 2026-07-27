import type { TicketStatus } from './schemas';

export const statusLabels: Record<TicketStatus, string> = {
  NEW: 'Nouveau',
  ASSIGNED: 'Assigné',
  IN_PROGRESS: 'En cours',
  PENDING_CUSTOMER: 'Attente client',
  PENDING_THIRD_PARTY: 'Attente tiers',
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
  REOPENED: 'Réouvert',
  CANCELLED: 'Annulé',
};

export const priorityLabels = { LOW: 'Basse', MEDIUM: 'Moyenne', HIGH: 'Haute', CRITICAL: 'Critique' } as const;

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} o`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} Ko`;
  return `${(value / 1024 / 1024).toFixed(1)} Mo`;
}
