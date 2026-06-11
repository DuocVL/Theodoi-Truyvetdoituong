import { z } from 'zod';

/**
 * Zod schema for creating a new check-in.
 * Structured to work with the validate middleware (expects { body, query, params }).
 */
export const createCheckinSchema = z.object({
  body: z.object({
    subject_id: z.string().uuid('Subject ID must be a valid UUID.'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    notes: z.string().optional(),
    image_id: z.string().uuid().optional(),
    device_id: z.string().optional(),
    checkin_time: z.string().datetime().optional().or(z.date().optional()),
  }),
});

export type CreateCheckinDto = z.infer<typeof createCheckinSchema>['body'];

/**
 * Zod schema for updating an existing check-in.
 */
export const updateCheckinSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }),
});

export type UpdateCheckinDto = z.infer<typeof updateCheckinSchema>['body'];
