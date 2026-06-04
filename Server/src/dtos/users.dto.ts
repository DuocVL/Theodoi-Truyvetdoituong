
import { z } from 'zod';
import { Role, AccountStatus } from '../../generated/prisma';

// Schema for updating an existing user (by an Admin)
export const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(), // Can update role
  status: z.nativeEnum(AccountStatus).optional(), // Can update status (e.g., ACTIVE, INACTIVE)
}).partial();
