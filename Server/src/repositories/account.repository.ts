import { prisma } from '../configs/prisma';
import { Account } from '@prisma/client';
import { CreateAccountInput } from '../types/data';

export const create = async (data: CreateAccountInput): Promise<Account> => {
    return await prisma.account.create({ data });
};

export const findByUsername = async (username: string): Promise<Account | null> => {
    return await prisma.account.findUnique({ where: { username } });
};

export const findByEmail = async (email: string): Promise<Account | null> => {
    return await prisma.account.findUnique({ where: { email } });
};

export const updatePassword = async (id: string, password: string): Promise<Account> => {
    return await prisma.account.update({
        where: { id },
        data: { password },
    });
};
