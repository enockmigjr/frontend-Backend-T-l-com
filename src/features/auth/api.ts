import { z } from 'zod';
import { apiRequest } from './api-client';
import { currentUserSchema, type ChangePasswordInput, type LoginInput } from './schemas';
import { publishSessionSignal } from '@/lib/auth/session-channel';

const loginResultSchema = z
  .union([currentUserSchema, z.object({ user: currentUserSchema })])
  .transform((value) => ('user' in value ? value.user : value));

/**
 * Enregistre une nouvelle session utilisateur
 * @param input - Données d'identification (email, mot de passe)
 * @returns Utilisateur connecté
 */
export async function login(input: LoginInput) {
  const user = await apiRequest('/api/auth/login', loginResultSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  publishSessionSignal('session-updated');
  return user;
}

/**
 * Récupère l'utilisateur connecté
 * @returns Utilisateur connecté
 */
export function getCurrentUser() {
  return apiRequest('/api/v1/auth/me', currentUserSchema);
}

/**
 * Change le mot de passe de l'utilisateur connecté
 * @param values - Ancien mot de passe et nouveau mot de passe
 * @returns Statut de l'opération
 */
export async function changePassword(values: ChangePasswordInput) {
  const input = { currentPassword: values.currentPassword, newPassword: values.newPassword };
  const result = await apiRequest('/api/auth/change-password', z.undefined(), {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  publishSessionSignal('session-updated');
  return result;
}

/**
 * Termine la session utilisateur actuelle
 * @returns Statut de l'opération
 */
export async function logout() {
  const result = await apiRequest('/api/auth/logout', z.undefined(), { method: 'POST' });
  publishSessionSignal('logout');
  return result;
}
