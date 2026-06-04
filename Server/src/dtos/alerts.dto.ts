import { z } from 'zod';

export const updateAlertSchema = z.object({
  status: z.string().optional(),
  resolved_by: z.string().uuid().optional(),
  message: z.string().optional(),
});
