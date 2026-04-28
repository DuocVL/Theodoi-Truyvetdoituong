import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../configs/prisma'

export async function create(data: Prisma.RefreshTokenCreateInput) {
    return prisma.refreshToken.create({
        data
    });
}

export async function findByToken(token_hash: string) {
    return prisma.refreshToken.findUnique({
        where: { token_hash }
    });
}

export async function validateRefreshToken(token_hash: string) {
    const rt = await prisma.refreshToken.findUnique({
        where: { token_hash },
    })

    if (!rt) return null

    if (rt.revoked) return null

    if (rt.expires_at < new Date()) return null

    return rt
}

export async function revokeToken(token_hash: string) {
    return prisma.refreshToken.update({
        where: { token_hash },
        data: {
            revoked: true
        }
    });
}

export async function revokeAllByAccount(accountId: string) {
    return prisma.refreshToken.updateMany({
        where: {
            account_id: accountId,
            revoked: false,
        },
        data: {
            revoked: true,
        },
    })
}

export async function deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({
        where: {
            expires_at: {
                lt: new Date(),
            },
        },
    })
}

export async function findByAccount(accountId: string) {
    return prisma.refreshToken.findMany({
        where: {
            account_id: accountId,
        },
        orderBy: {
            created_at: 'desc',
        },
    })
}