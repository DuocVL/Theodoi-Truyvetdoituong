
import { z } from 'zod';
import { Gender } from '../../generated/prisma';

// Schema for creating a new subject
export const createSubjectSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(1, "Full name is required"),
  dob: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  monitoringStart: z.string().datetime().optional(),
  monitoringEnd: z.string().datetime().optional(),
});

// Schema for account activation
export const activateAccountSchema = z.object({
  token: z.string().uuid("Invalid token format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

// Schema for updating an existing subject
export const updateSubjectSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  dob: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  monitoringStart: z.string().datetime().optional(),
  monitoringEnd: z.string().datetime().optional(),
}).partial(); // .partial() makes all fields optional
