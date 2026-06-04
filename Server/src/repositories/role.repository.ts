import { prisma } from '../configs/prisma';
import { Role, Prisma } from '../../generated/prisma/client';

export const createRole = async (data: Prisma.RoleCreateInput): Promise<Role> => {
  return await prisma.role.create({ data });
};

export const getRoleById = async (id: string): Promise<Role | null> => {
  return await prisma.role.findUnique({ where: { id } });
};

export const getRoleByName = async (name: string): Promise<Role | null> => {
  return await prisma.role.findUnique({ where: { name } });
};

export const getAllRoles = async (): Promise<Role[]> => {
  return await prisma.role.findMany();
};

export const updateRole = async (
  id: string,
  data: Prisma.RoleUpdateInput
): Promise<Role> => {
  return await prisma.role.update({
    where: { id },
    data,
  });
};

export const deleteRole = async (id: string): Promise<Role> => {
  return await prisma.role.delete({ where: { id } });
};
