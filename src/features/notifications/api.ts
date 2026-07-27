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
  list: (page: number) => apiPage(`/api/v1/notifications?page=${page}&limit=30&order=desc`, notificationSchema),
  unread: () => apiRequest('/api/v1/notifications/unread', z.array(notificationSchema)),
  markRead: (id: string) => apiRequest(`/api/v1/notifications/${id}/read`, z.undefined(), { method: 'PATCH' }),
  markAllRead: () => apiRequest('/api/v1/notifications/read-all', z.undefined(), { method: 'PATCH' }),
};

export type NotificationItem = z.infer<typeof notificationSchema>;
