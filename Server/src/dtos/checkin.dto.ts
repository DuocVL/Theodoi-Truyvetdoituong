/**
 * @file checkin.dto.ts
 */
import { z } from 'zod';

export const createCheckinSchema = z.object({
  body: z.object({
    latitude: z.preprocess((val) => Number(val), z.number().min(-90).max(90)),
    longitude: z.preprocess((val) => Number(val), z.number().min(-180).max(180)),
    face_verified: z.preprocess(
      (val) => (val === 'true' ? true : val === 'false' ? false : val),
      z.boolean()
    ),
    notes: z.string().optional(),
  })
});

export const updateCheckinSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  })
});

export const checkinTimeFilterSchema = z.object({
  query: z.object({
    page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional().default(1)),
    limit: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional().default(10)), // MỚI: Mặc định là 10 bản ghi
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'startDate bắt buộc phải đúng định dạng ngày tháng (YYYY-MM-DD)',
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'endDate bắt buộc phải đúng định dạng ngày tháng (YYYY-MM-DD)',
    }),
    startTime: z.string().optional(), // MỚI: Định dạng HH:mm
    endTime: z.string().optional(),   // MỚI: Định dạng HH:mm
  })
});

export type CheckinTimeFilterDto = {
  page: number;
  limit: number;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
};

export type CreateCheckinDto = z.infer<typeof createCheckinSchema>['body'];
export type UpdateCheckinDto = z.infer<typeof updateCheckinSchema>['body'];