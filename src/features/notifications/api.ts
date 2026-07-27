import { z } from 'zod';
import { apiPage, apiRequest } from '@/features/auth/api-client';

export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  readAt: z.string().nullable().optional(),
  referenceId: z.string().uuid().nullable().optional(),
  referenceType: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const notificationsApi = {
  list: (page: number, limit = 20) =>
    apiPage(`/api/v1/notifications?page=${page}&limit=${limit}&order=desc`, notificationSchema),
  unread: () => apiRequest('/api/v1/notifications/unread', z.array(notificationSchema)),
  markRead: (id: string) => apiRequest(`/api/v1/notifications/${id}/read`, z.undefined(), { method: 'PATCH' }),
  markAllRead: () => apiRequest('/api/v1/notifications/read-all', z.undefined(), { method: 'PATCH' }),
};

export function notificationDestination(item: NotificationItem): string {
  const type = item.referenceType?.toLowerCase();
  if (type === 'ticket' && item.referenceId) return `/tickets/${item.referenceId}`;
  if (type === 'report' && item.referenceId) return `/reports?rapport=${item.referenceId}`;
  if (type === 'user' && item.referenceId) return `/admin/users?utilisateur=${item.referenceId}`;
  return '/notifications';
}

export type NotificationItem = z.infer<typeof notificationSchema>;
