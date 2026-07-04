import { prisma } from '../configs/prisma';
import type { User, Prisma } from '../../generated/prisma/client';

//repository phục vụ giao tiếp với bảng user trong csdl

//khởi tạo user mới 
export const createUser = async (data: Prisma.UserCreateInput): Promise<User> => {
  return await prisma.user.create({ data });
};

//lấy user dựa váo userId
export const getUserById = async (id: string): Promise<User | null> => {
  return await prisma.user.findUnique({ where: { id } });
};

//lấy user dựa vào accountId
export const getUserByAccountId = async (account_id: string): Promise<User | null> => {
  return await prisma.user.findUnique({ where: { account_id } });
};

//lấy tất cả users
export const getAllUsers = async (fullName?: string, role?: string): Promise<User[]> => {
  //tạo bộ lọc
  const whereClause: any = {};
  if (fullName) whereClause.full_name = { contains: fullName, mode: 'insensitive' };//tên có đoạn tên trong tham số
  if (role) whereClause.role = role;//lọc theo role

  return await prisma.user.findMany({
    where: whereClause,
    orderBy: { created_at: 'desc' }
  });
};

//cập nhật user
export const updateUser = async (id: string, data: Prisma.UserUpdateInput): Promise<User> => {
  return await prisma.user.update({
    where: { id },
    data,
  });
};

//xóa mềm user khỏi hệ thống
export const deleteUser = async (id: string): Promise<User> => {
  return await prisma.user.update({
    where: {id},
    data:{
      status: false
    }
  })
};
