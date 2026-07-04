import { z } from 'zod';

//Schema tạo checkin
export const createCheckinSchema = z.object({
  body: z.object({
    latitude: z.preprocess((val) => Number(val), z.number().min(-90).max(90)),//vĩ độ
    longitude: z.preprocess((val) => Number(val), z.number().min(-180).max(180)),//kinh độ
    face_verified: z.preprocess(
      (val) => (val === 'true' ? true : val === 'false' ? false : val),
      z.boolean()
    ),//chuyển đổi string -> boolean
    notes: z.string().optional(),//ghi chú
  })
});

//cập nhật được note của 1 checkin(có thể bỏ)
export const updateCheckinSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  })
});

//bộ lọc điểm danh page,limit , thười gian
export const checkinTimeFilterSchema = z.object({
  query: z.object({
    page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional().default(1)),//mặc định trả về mới nhất
    limit: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional().default(10)),//mặc định 10/page
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'startDate bắt buộc phải đúng định dạng ngày tháng (YYYY-MM-DD)',
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'endDate bắt buộc phải đúng định dạng ngày tháng (YYYY-MM-DD)',
    }),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  })
});


//tạo kiểu dữ liệu bộ lọc để chuẩn hóa đầu vào
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