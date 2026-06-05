import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    PORT: z.coerce.number().default(3000),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),

    DATABASE_URL: z.url(),
    REDIS_URL: z.url().default("redis://localhost:6379"),

    EMAIL_HOST: z.string(),
    EMAIL_PORT: z.coerce.number(),
    EMAIL_USER: z.string(),
    EMAIL_PASS: z.string(),

    FRONTEND_URL: z.string(),
});

export const env = envSchema.parse(process.env);