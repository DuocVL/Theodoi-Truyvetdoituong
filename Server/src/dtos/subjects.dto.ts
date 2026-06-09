
import { z } from 'zod';

// Schema for creating a new subject
export const createSubjectSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
  fullName: z.string().min(1, "Full name is required"),
  dob: z.string().optional(),
  gender: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  monitoringStart: z.string().datetime().optional(),
  monitoringEnd: z.string().datetime().optional(),
});

export const activateAccountSchema = z.object({
  token: z.string().uuid("Định dạng mã kích hoạt không hợp lệ"),
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
});

// Schema for updating an existing subject
export const updateSubjectSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  dob: z.string().datetime().optional().or(z.string().optional()),
  gender: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  monitoringStart: z.string().datetime().optional(),
  monitoringEnd: z.string().datetime().optional(),
}).partial(); // .partial() makes all fields optional
