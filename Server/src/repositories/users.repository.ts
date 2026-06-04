
import { Prisma } from '@prisma/client';
import { prisma } from '../configs/prisma'

export async function create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
        data
    });
}

export async function update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
        where: { id },
        data
    });
}

export async function findById(id: string) {
    return prisma.user.findUnique({
        where: { id }
    });
}

export async function findByFullName(full_name: string) {
    return prisma.user.findMany({
        where: { full_name }
    });
}