
import { z } from 'zod';

export const createSubjectSchema = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(4, 'Username must be at least 4 characters'),
  dob: z.string().optional(), // Assuming date comes as string from client
  gender: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  monitoringStart: z.string().optional(),
  monitoringEnd: z.string().optional(),
});

export const activateAccountSchema = z.object({
  token: z.string().uuid('Invalid activation token'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
