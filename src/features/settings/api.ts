import { apiRequest } from '@/lib/api/client';
import { z } from 'zod';
import { envelope, settingSchema } from '@/features/users/api/validation';
export const listSettings = async (signal?: AbortSignal) =>
  envelope(settingSchema.array()).parse(await apiRequest('/api/v1/settings', { signal }));
export const updateSetting = async (key: string, value: string, description?: string) =>
  z.object({ success: z.literal(true), message: z.string() }).parse(
    await apiRequest(`/api/v1/settings/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: { value, description },
    }),
  );
