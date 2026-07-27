import { apiRequest } from '@/lib/api/client';
import { auditSchema, envelope, pageEnvelope } from '@/features/users/api/validation';

/**
 * Liste les logs d'audit avec pagination
 * @param query - Paramètres de requête (page, limit, order, etc.)
 * @param signal - Signal d'abandon
 * @returns Page de logs d'audit
 */
export const listAudit = async (query: URLSearchParams, signal?: AbortSignal) =>
  pageEnvelope(auditSchema).parse(await apiRequest(`/api/v1/audit-logs?${query}`, { signal }));

/**
 * Récupère un log d'audit par son ID
 * @param id - ID du log d'audit
 * @param signal - Signal d'abandon
 * @returns Log d'audit
 */
export const getAudit = async (id: string, signal?: AbortSignal) =>
  envelope(auditSchema).parse(await apiRequest(`/api/v1/audit-logs/${id}`, { signal }));
