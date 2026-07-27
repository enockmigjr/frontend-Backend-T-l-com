export const ticketKeys = {
  all: ['tickets'] as const,
  list: (query: string) => ['tickets', 'list', query] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
  comments: (id: string) => ['tickets', id, 'comments'] as const,
  notes: (id: string) => ['tickets', id, 'notes'] as const,
  attachments: (id: string) => ['tickets', id, 'attachments'] as const,
  history: (id: string) => ['tickets', id, 'history'] as const,
};
