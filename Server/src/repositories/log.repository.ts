import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../configs/prisma";

//Thêm bản ghi nhật ký hệ thống vào CSDL
export async function createSystemLog(data: Prisma.SystemLogCreateInput) {
    return await prisma.systemLog.create({ data });
}

//Truy vấn danh sách nhật ký hệ thống kèm phân trang, bộ lọc nâng cao
export async function getSystemLogs(options: any) {
    const { page, limit, userId, subjectId, category, startDate, endDate } = options;

    //Xây dựng bộ lọc dữ liệu sử dụng cú pháp spread để loại bỏ các trường undefined 
    const where: Prisma.SystemLogWhereInput = {
        ...(userId && { user_id: userId }),
        ...(subjectId && { subject_id: subjectId }),
        ...(category && { category }),
        ...( (startDate || endDate) && {//nếu tồn tại ít nhất ngày bắt đầu và ngày kết thúc khởi tạo lọc thời gian
            created_at: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
            }
        })
    };

    //thực thi truy vấn song song
    const [logs, total] = await Promise.all([
        prisma.systemLog.findMany({//lấy danh sách bản ghi log thỏa mãn điều kiện
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {//chọn các trường cơ bản tránh tràn RAM server
                id: true,
                created_at: true,
                category: true,
                action: true,
                ip_address: true,
                status_code: true,
                duration_ms: true,
                user: { select: { full_name: true } },
                subject: { select: { full_name: true } }
            }
        }),
        prisma.systemLog.count({ where })//lấy tổng phục vụ phân trang
    ]);
    return { logs, total, page, limit };
}

//Hàm lấy chi tiết thông tin 1 log 
export async function getLogDetail(id: string) {
    return await prisma.systemLog.findUnique({ where: { id } });
}