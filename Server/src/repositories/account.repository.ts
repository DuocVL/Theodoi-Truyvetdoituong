import { prisma } from '../configs/prisma';
import { Account , Prisma, AccountStatus } from '../../generated/prisma/client';


export const create = async (data: Prisma.AccountCreateInput): Promise<Account> => {
    return await prisma.account.create({ data });
};

export const findById = async (id: string): Promise<Account | null> => {
    return await prisma.account.findUnique({ where: { id } });
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

export const updateStatus = async (id: string, status: AccountStatus): Promise<Account> => {
    return await prisma.account.update({
        where: { id },
        data: { status },
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
