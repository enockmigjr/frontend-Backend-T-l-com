import { apiRequest } from '@/lib/api/client';
import { actionSchema, categorySchema, envelope } from '@/features/users/api/validation';

type Create = { readonly name: string; readonly description?: string; readonly targetRole?: string };

/**
 * Liste les catégories avec pagination
 * @param signal - Signal d'abandon
 * @returns Page de catégories
 */
export const listCategories = async (signal?: AbortSignal) =>
  envelope(categorySchema.array()).parse(await apiRequest('/api/v1/categories', { signal }));

export const getCategory = async (id: string, signal?: AbortSignal) =>
  envelope(categorySchema).parse(await apiRequest(`/api/v1/categories/${id}`, { signal }));

/**
 * Crée une nouvelle catégorie
 * @param body - Données de la catégorie à créer
 * @returns Catégorie créée
 */
export const createCategory = async (body: Create) =>
  envelope(categorySchema).parse(await apiRequest('/api/v1/categories', { method: 'POST', body }));

/**
 * Met à jour une catégorie existante
 * @param id - ID de la catégorie à mettre à jour
 * @param body - Données partielles à mettre à jour
 * @returns Catégorie mise à jour
 */
export const updateCategory = async (id: string, body: Partial<Create>) =>
  envelope(categorySchema).parse(await apiRequest(`/api/v1/categories/${id}`, { method: 'PATCH', body }));

/**
 * Supprime une catégorie
 * @param id - ID de la catégorie à supprimer
 * @returns Statut de l'opération
 */
export const deleteCategory = async (id: string) =>
  actionSchema.parse(await apiRequest(`/api/v1/categories/${id}`, { method: 'DELETE' }));
