
import { prisma } from '../configs/prisma';
import { Role } from '@prisma/client';

// TODO: Implement proper logic for these functions

export async function createRole(name: string): Promise<Role> {
    return await prisma.role.create({ data: { name } });
}

export async function updateRole(id: string, name: string): Promise<Role> {
    return await prisma.role.update({
        where: { id },
        data: { name },
    });
}

export async function findRoleByName(name: string): Promise<Role | null> {
    return await prisma.role.findUnique({ where: { name } });
}

export async function findRoleById(id: string): Promise<Role | null> {
    return await prisma.role.findUnique({ where: { id } });
}

export async function deleteRole(id: string): Promise<void> {
    await prisma.role.delete({ where: { id } });
}

export async function getAllRule(): Promise<Role[]>{
    return await prisma.role.findMany();
}

export async function existsByName(name: string): Promise<boolean> {
    const role = await prisma.role.findUnique({ where: { name } });
    return !!role;
}
