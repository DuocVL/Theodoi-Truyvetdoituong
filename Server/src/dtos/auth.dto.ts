import { z } from 'zod';

export const UpdateAccountDto = z.object({
    status: z.string().optional(),
}).strict();

export const LoginDto = z.object({
    username: z.string(),
    password: z.string(),
});

export const RegisterDto = z.object({
    username: z.string().min(3).trim(),
    pasword: z.string().min(8),
    full_name: z.string().min(1),
    email: z.email(),
});

export const ChangePasswordDto = z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 kí tự"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
});

export type UpdateAccountDto = z.infer< typeof UpdateAccountDto>;
export type LoginDto = z.infer<typeof LoginDto>;
export type ChangePasswordDto = z.infer< typeof ChangePasswordDto>;
export type RegisterDto = z.infer< typeof RegisterDto>;