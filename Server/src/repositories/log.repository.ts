import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../configs/prisma";

// Create operations
export async function createRequestLog(data: Prisma.RequestLogCreateInput) {
    return await prisma.requestLog.create({
        data
    });
}

export async function createAuthLog(data: Prisma.AuthLogCreateInput) {
    return await prisma.authLog.create({
        data
    });
}

export async function createSystemLog(data: Prisma.SystemLogCreateInput) {
    return await prisma.systemLog.create({
        data
    });
}

// Get operations
export async function getRequestLogs(options: { page: number, limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        prisma.requestLog.findMany({
            skip,
            take: limit,
            orderBy: {
                created_at: 'desc'
            }
        }),
        prisma.requestLog.count()
    ]);
    return { logs, total, page, limit };
}

export async function getAuthLogs(options: { page: number, limit: number, accountId?: string }) {
    const { page, limit, accountId } = options;
    const skip = (page - 1) * limit;
    const where: Prisma.AuthLogWhereInput = {};
    if (accountId) {
        where.account_id = accountId;
    }

    const [logs, total] = await Promise.all([
        prisma.authLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                created_at: 'desc'
            }
        }),
        prisma.authLog.count({ where })
    ]);
    return { logs, total, page, limit };
}

export async function getSystemLogs(options: { page: number, limit: number, userId?: string, entity?: string }) {
    const { page, limit, userId, entity } = options;
    const skip = (page - 1) * limit;
    const where: Prisma.SystemLogWhereInput = {};
    if (userId) {
        where.user_id = userId;
    }
    if (entity) {
        where.entity = entity;
    }

    const [logs, total] = await Promise.all([
        prisma.systemLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                created_at: 'desc'
            },
            include: {
                user: {
                    select: {
                        full_name: true
                    }
                }
            }
        }),
        prisma.systemLog.count({ where })
    ]);
    return { logs, total, page, limit };
}
