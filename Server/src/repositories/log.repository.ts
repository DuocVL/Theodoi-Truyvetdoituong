import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../configs/prisma";

export async function createSystemLog(data: Prisma.SystemLogCreateInput) {
    return await prisma.systemLog.create({ data });
}

export async function getSystemLogs(options: any) {
    const { page, limit, userId, subjectId, category, startDate, endDate } = options;

    // Loại bỏ các key undefined để Prisma không query nhầm
    const where: Prisma.SystemLogWhereInput = {
        ...(userId && { user_id: userId }),
        ...(subjectId && { subject_id: subjectId }),
        ...(category && { category }),
        ...( (startDate || endDate) && {
            created_at: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
            }
        })
    };

    const [logs, total] = await Promise.all([
        prisma.systemLog.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                created_at: true,
                category: true,
                action: true,
                ip_address: true,
                status_code: true,
                duration_ms: true,
                user: { select: { full_name: true } },
                subject: { select: { full_name: true } }
                // KHÔNG chọn old_data/new_data ở đây để tránh tràn RAM
            }
        }),
        prisma.systemLog.count({ where })
    ]);
    return { logs, total, page, limit };
}

// Thêm hàm lấy chi tiết (dùng cho Drawer)
export async function getLogDetail(id: string) {
    return await prisma.systemLog.findUnique({ where: { id } });
}