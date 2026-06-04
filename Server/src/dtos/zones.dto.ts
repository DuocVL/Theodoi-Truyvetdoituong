
import { z } from 'zod';

// A basic GeoJSON Geometry schema for validation
const geoJsonSchema = z.object({
  type: z.enum(['Polygon', 'MultiPolygon', 'Point', 'LineString']), // Extend with other types if needed
  coordinates: z.any(), // For simplicity, we use any. A stricter validation would be better in production.
}).passthrough(); // Allows other properties like 'crs'

export const createZoneSchema = z.object({
  zone_name: z.string().min(1, { message: 'Zone name is required' }),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  geom: geoJsonSchema, // Validate the geometry
});

export const updateZoneSchema = z.object({
    zone_name: z.string().min(1).optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
    geom: geoJsonSchema.optional(),
});
