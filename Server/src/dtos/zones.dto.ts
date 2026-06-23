// src/dtos/zones.dto.ts
import { z } from 'zod';

export const createZoneSchema = z.object({
  subject_id: z.string().uuid({ message: 'Valid Subject ID is required' }),
  zone_name: z.string().min(1, { message: 'Zone name is required' }),
  type: z.enum(['SAFE', 'RESTRICTED'], { message: 'Invalid zone type (SAFE or RESTRICTED)' }),
  latitude: z.number().min(-90).max(90, { message: 'Latitude must be between -90 and 90' }),
  longitude: z.number().min(-180).max(180, { message: 'Longitude must be between -180 and 180' }),
  radius: z.number().positive({ message: 'Radius must be a positive number' }), // Đơn vị: mét
  interval_minutes: z.number().int().positive().optional().default(15),       // Chu kỳ nhắc nhở mặc định 15p
  grace_minutes: z.number().int().nonnegative().optional().default(5),       // Thời gian chờ gia hạn mặc định 5p
  active_start_time: z.string().optional(),
  active_end_time: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

export const updateZoneSchema = z.object({
  zone_name: z.string().min(1).optional(),
  type: z.enum(['SAFE', 'RESTRICTED']).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().positive().optional(),
  interval_minutes: z.number().int().positive().optional(),
  grace_minutes: z.number().int().nonnegative().optional(),
  active_start_time: z.string().optional(),
  active_end_time: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});