import { z } from 'zod';
import { AccountStatus } from '../../generated/prisma';

export const UpdateAccountDto = z.object({
    status: z.nativeEnum(AccountStatus).optional(),
}).strict();

// Schema for the refresh token request body
export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string(),
    })
});

// Type derived from the schema
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>['body'];

// Schema for the login request body
export const loginSchema = z.object({
    body: z.object({
        username: z.string(),
        password: z.string(),
        device_id: z.string(), // device_id is required for login
    })
});

export type LoginDto = z.infer<typeof loginSchema>['body'];

// Schema for the register request body
export const registerSchema = z.object({
    body: z.object({
        username: z.string().min(3).trim(),
        password: z.string().min(8),
        full_name: z.string().min(1),
        email: z.string().email(),
    })
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];

// Schema for account activation
export const activateAccountSchema = z.object({
  token: z.string().uuid("Invalid token format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});


// Schema for the logout request body
export const logoutSchema = z.object({
    body: z.object({
        refreshToken: z.string(),
    })
});

export const ChangePasswordDto = z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 kí tự"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email(),
    })
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>['body'];

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 kí tự"),
    })
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>['body'];
