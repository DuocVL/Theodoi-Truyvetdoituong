
/**
 * @file face.dto.ts
 * @description
 * File này định nghĩa các schema validation sử dụng Zod cho module Face.
 * Các schema này được sử dụng trong một middleware để xác thực dữ liệu đến (inbound data)
 * từ body, params, hoặc query của HTTP request, đảm bảo rằng dữ liệu tuân thủ đúng định dạng
 * trước khi được xử lý bởi Controller và Service.
 */

import { z } from 'zod';

/**
 * @const registerFaceSchema
 * @description Schema Zod để xác thực body của request đăng ký khuôn mặt (`/face/register`).
 * Nó đảm bảo rằng thuộc tính `embedding` được cung cấp, là một mảng,
 * không được rỗng, và tất cả phần tử bên trong đều là số.
 */
export const registerFaceSchema = z.object({
  body: z.object({
    embedding: z.array(z.number())
  })
});

// Export một kiểu TypeScript từ schema để sử dụng trong các lớp Controller và Service.
// Điều này giúp đảm bảo sự nhất quán về kiểu dữ liệu trên toàn bộ ứng dụng.
export type RegisterFaceDto = z.infer<typeof registerFaceSchema>['body'];

