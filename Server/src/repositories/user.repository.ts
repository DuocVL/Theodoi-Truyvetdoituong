import { prisma } from '../configs/prisma';
import type { User, Prisma } from '../../generated/prisma/client';

export const createUser = async (data: Prisma.UserCreateInput): Promise<User> => {
  return await prisma.user.create({ data });
};

export const getUserById = async (id: string): Promise<User | null> => {
  return await prisma.user.findUnique({ where: { id } });
};

export const getUserByAccountId = async (account_id: string): Promise<User | null> => {
  return await prisma.user.findUnique({ where: { account_id } });
};

export const getAllUsers = async (fullName?: string, role?: string): Promise<User[]> => {
  const whereClause: any = {};

  if (fullName) {
    whereClause.full_name = { contains: fullName, mode: 'insensitive' };
  }

  if (role) {
    whereClause.role = role; // Đảm bảo role khớp với enum/kiểu dữ liệu
  }

  return await prisma.user.findMany({
    where: whereClause,
    orderBy: { created_at: 'desc' }
  });
};

export const updateUser = async (
  id: string,
  data: Prisma.UserUpdateInput
): Promise<User> => {
  return await prisma.user.update({
    where: { id },
    data,
  });
};

export const deleteUser = async (id: string): Promise<User> => {
  return await prisma.user.update({
    where: {id},
    data:{
      status: false
    }
  })
};
