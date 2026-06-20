
/**
 * @file checkin.dto.ts
 * @description Định nghĩa các schema validation sử dụng Zod cho module Checkin.
 */

import { z } from 'zod';

/**
 * @const createCheckinSchema
 * @description Schema để xác thực dữ liệu body khi tạo một check-in mới.
 * Dữ liệu này được gửi dưới dạng multipart/form-data, nhưng Zod sẽ xác thực các trường text.
 * Lưu ý: 'image' sẽ được xử lý riêng bởi middleware upload.
 */
export const createCheckinSchema = z.object({
  body: z.object({
    // Biến đổi và ép kiểu latitude và longitude từ string (trong form-data) sang number.
    latitude: z.preprocess((val) => Number(val), z.number().min(-90).max(90)),
    longitude: z.preprocess((val) => Number(val), z.number().min(-180).max(180)),
    notes: z.string().optional(),
  })

});

/**
 * @const updateCheckinSchema
 * @description Schema để xác thực dữ liệu body khi cập nhật 'notes' cho một check-in.
 */
export const updateCheckinSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  })
  
});

// Export các kiểu TypeScript được suy ra từ Zod schemas để đảm bảo type-safety
export type CreateCheckinDto = z.infer<typeof createCheckinSchema>['body'];
export type UpdateCheckinDto = z.infer<typeof updateCheckinSchema>['body'];

