import { z } from 'zod';

const geoJsonPointSchema = z.object({
    type: z.literal('Point'),
    coordinates: z.array(z.number()).length(2),
});

export const createCheckinSchema = z.object({
  subject_id: z.string().uuid(),
  location: geoJsonPointSchema,
  image_url: z.string().url().optional(),
});
