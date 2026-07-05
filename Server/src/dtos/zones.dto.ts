// src/dtos/zones.dto.ts
import { z } from 'zod';

//schema tạo zone
export const createZoneSchema = z.object({
  subject_id: z.string().uuid(),
  zone_name: z.string().min(1),
  type: z.enum(['SAFE', 'RESTRICTED']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().positive(), // Đơn vị: mét
  interval_minutes: z.number().int().positive().optional().default(15),       // Chu kỳ nhắc nhở mặc định 15p
  grace_minutes: z.number().int().nonnegative().optional().default(5),       // Thời gian chờ gia hạn mặc định 5p
  active_start_time: z.string().optional(),
  active_end_time: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

//schema cập nhật
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