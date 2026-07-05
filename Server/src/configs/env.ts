import { z } from "zod";
import "dotenv/config"

//định nghĩa validate biến môi trường
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    PORT: z.coerce.number().default(3000),
    JWT_SECRET: z.string().min(32),

    //đường dẫn đến csdl
    DATABASE_URL: z.url(),

    //cấu hình máy chủ email
    EMAIL_HOST: z.string(),
    EMAIL_PORT: z.coerce.number(),
    EMAIL_USER: z.string(),
    EMAIL_PASS: z.string(),

    //địa chỉ FRONTEND_URL để cấu hình CORS
    FRONTEND_URL: z.string(),
});

//phân tích file .env theo cấu hình để sử dụng
export const env = envSchema.parse(process.env);