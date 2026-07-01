// src/repositories/alert.repository.ts
import { prisma } from '../configs/prisma';

//Định nghĩa cấu trúc dữ liệu đầu vào khi muốn tạo 1 cảnh báo
interface CreateAlertData {
  subject_id: string;
  zone_id?: string | null;
  checkin_id?: string | null;
  type: 'RESTRICTED_ENTRY' | 'MISSED_CHECKIN';
  message?: string;
}

//Lấy danh sách 
export const getAlerts = async (
  page: number,
  limit: number,
  whereClause: any
) => {

  const skip = (page - 1) * limit;//Tính số lượng bản ghi cần bỏ qua dựa trên số trang
  const [alerts, total] = await prisma.$transaction([//Sử dụng $transaction để chạy đồng thời 2 câu lệnh prisma
    prisma.alert.findMany({
      where: whereClause,
      include:{//Liên kết thêm bảng Subject lấy fullname đối tượng
        subject:{
          select:{
            full_name: true,
          }
        }
      },
      orderBy: { created_at: 'desc' },//Sắp xếp mới nhất lên đầu
      skip,
      take: limit,
    }),
    prisma.alert.count({ where: whereClause }),//Lấy tổng số phục vụ phân trang
  ]);
  return { alerts, total };
};

//Tạo cảnh báo mới
export const createAlert = async (data: CreateAlertData) => {
  return await prisma.alert.create({ data });
};

//Lấy chi tiết 1 cảnh báo theo ID
export const getById = async (id: string) => {
  return await prisma.alert.findUnique({
      where: { id },
      include: {
        subject: { select: { full_name: true, id_number: true } },
        zone: { select: { zone_name: true, type: true } },
        checkin: { select: { checkin_time: true, status: true } }
      }
    });
}
