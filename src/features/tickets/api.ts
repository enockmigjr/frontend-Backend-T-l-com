import { z } from 'zod';
import { apiPage, apiRequest } from '@/features/auth/api-client';
import {
  attachmentSchema,
  categorySchema,
  commentSchema,
  departmentSchema,
  historySchema,
  noteSchema,
  ticketSchema,
  userReferenceSchema,
  type CreateTicketInput,
} from './schemas';

export type TicketFilters = Readonly<Record<string, string | number | undefined>>;

function queryString(filters: TicketFilters): string {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.toString();
}

export const ticketsApi = {
  list: (filters: TicketFilters) =>
    apiPage(
      `/api/v1/tickets?${queryString(filters)}`,
      ticketSchema.pick({
        id: true,
        ticketNumber: true,
        title: true,
        priority: true,
        severity: true,
        status: true,
        categoryId: true,
        categoryName: true,
        assignedTo: true,
        assignedTeamId: true,
        departmentId: true,
        assigneeName: true,
        departmentName: true,
        assignedTeamName: true,
        customerName: true,
        resolutionDueAt: true,
        slaBreached: true,
        createdAt: true,
        updatedAt: true,
      }),
    ),
  get: (id: string) =>
    apiRequest(`/api/v1/tickets/${id}?detail=full&assignmentPage=1&assignmentLimit=20`, ticketSchema),
  create: (input: CreateTicketInput, key: string) =>
    apiRequest('/api/v1/tickets', ticketSchema, {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify(input),
    }),
  update: (id: string, input: Readonly<Record<string, string>>) =>
    apiRequest(`/api/v1/tickets/${id}`, ticketSchema, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => apiRequest(`/api/v1/tickets/${id}`, z.undefined(), { method: 'DELETE' }),
  transition: (id: string, action: string, body?: object) =>
    apiRequest(`/api/v1/tickets/${id}/${action}`, ticketSchema, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  assign: (id: string, action: 'assign' | 'reassign', userId: string, reason?: string) =>
    apiRequest(`/api/v1/tickets/${id}/${action}`, ticketSchema, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ userId, reason }),
    }),
  escalate: (id: string, userId: string, departmentId: string, reason?: string) =>
    apiRequest(`/api/v1/tickets/${id}/escalate`, ticketSchema, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ userId, departmentId, reason }),
    }),
  comments: (id: string) => apiPage(`/api/v1/tickets/${id}/comments?page=1&limit=100&order=asc`, commentSchema),
  addComment: (id: string, content: string) =>
    apiRequest(`/api/v1/tickets/${id}/comments`, commentSchema, { method: 'POST', body: JSON.stringify({ content }) }),
  publicReply: (id: string, content: string) =>
    apiRequest(`/api/v1/tickets/${id}/public-reply`, commentSchema, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  updateComment: (id: string, content: string) =>
    apiRequest(`/api/v1/comments/${id}`, commentSchema, { method: 'PATCH', body: JSON.stringify({ content }) }),
  removeComment: (id: string) => apiRequest(`/api/v1/comments/${id}`, z.undefined(), { method: 'DELETE' }),
  notes: (id: string) => apiPage(`/api/v1/tickets/${id}/internal-notes?page=1&limit=100&order=asc`, noteSchema),
  addNote: (id: string, content: string) =>
    apiRequest(`/api/v1/tickets/${id}/internal-notes`, noteSchema, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  updateNote: (id: string, content: string) =>
    apiRequest(`/api/v1/internal-notes/${id}`, noteSchema, { method: 'PATCH', body: JSON.stringify({ content }) }),
  removeNote: (id: string) => apiRequest(`/api/v1/internal-notes/${id}`, z.undefined(), { method: 'DELETE' }),
  attachments: (id: string) => apiPage(`/api/v1/tickets/${id}/attachments?page=1&limit=100`, attachmentSchema),
  history: (id: string) => apiRequest(`/api/v1/tickets/${id}/history`, z.array(historySchema)),
  upload: (association: Readonly<{ ticketId?: string; commentId?: string; internalNoteId?: string }>, file: File) => {
    const body = new FormData();
    Object.entries(association).forEach(([key, value]) => {
      if (value) body.set(key, value);
    });
    body.set('file', file);
    return apiRequest('/api/v1/attachments', attachmentSchema, { method: 'POST', body });
  },
  removeAttachment: (id: string) => apiRequest(`/api/v1/attachments/${id}`, z.undefined(), { method: 'DELETE' }),
  categories: () => apiRequest('/api/v1/categories', z.array(categorySchema)),
  departments: () => apiRequest('/api/v1/departments', z.array(departmentSchema)),
  users: () => apiPage('/api/v1/users?page=1&limit=100', userReferenceSchema),
};
