import { prisma } from '../configs/prisma';
import type { Account, Prisma } from "@prisma/client";
import { CreateAccountInput } from '../types/data';

export const create = async (data: Prisma.AccountCreateInput): Promise<Account> => {
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

export const findByIdWithRelations = async (id: string): Promise<any> => {
    return await prisma.account.findUnique({
        where: { id },
        include: {
            subject: {
                include: {
                    checkin: {
                        orderBy: { checkin_time: 'desc' },
                        take: 10
                    }
                }
            },
            user: true
        }
    });
};
