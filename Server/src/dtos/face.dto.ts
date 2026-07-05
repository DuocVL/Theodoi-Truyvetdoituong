import { z } from 'zod';

//schema dùng cho đăng ký khuôn mặt
export const registerFaceSchema = z.object({
  body: z.object({
    embedding: z.array(z.number())
  })
});

export type RegisterFaceDto = z.infer<typeof registerFaceSchema>['body'];

