import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../configs/prisma.js';

export async function createAccount(data: Prisma.AccountCreateInput) {
    return prisma.account.create({
        data,
    });
}

export async function findByUsername(username: string) {
    return prisma.account.findUnique({
        where: { username },
    });
}

export async function findById(id: string) {
    return prisma.account.findUnique({
        where: { id },

    });
}

export async function updatePassword(id: string, hashPassword: string) {
    return prisma.account.update({
        where: { id },
        data: {
            password: hashPassword
        }
    });
}

export async function update(id: string, data: Prisma.AccountUpdateInput) {
    return prisma.account.update({
        where: { id },
        data
    });
}