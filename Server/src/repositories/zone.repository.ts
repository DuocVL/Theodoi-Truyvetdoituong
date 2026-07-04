
import { prisma } from '../configs/prisma';

//reposity phục vụ việc xử lý zone trong csdl

//Định nghĩa zonedata phục vụ việc tạo , cập nhật
interface ZoneData {
  subject_id: string;
  zone_name: string;
  type: 'SAFE' | 'RESTRICTED';
  latitude: number;
  longitude: number;
  radius: number;
  interval_minutes?: number;//thời gian lặp lại checkin
  grace_minutes?: number;//thời gian chờ trước khi tạo cảnh báo
  description?: string;
  is_active?: boolean;
  created_by: string;
}

//Tạo vùng giám sát 
export const createZone = async (data: ZoneData) => {
  return await prisma.zone.create({
    data: {
      ...data,
      description: data.description || null,
      is_active: data.is_active !== false,
    },
  });
};

//Lấy zone theo id
export const getZoneById = async (id: string) => {
  return await prisma.zone.findUnique({
    where: { id },
    include: { 
      subject: true // Lấy kèm thông tin đối tượng giám sát
    },
  });
};

//lấy danh sách zone theo subjectId
export const getZonesBySubjectId = async (subjectId: string) => {
  return await prisma.zone.findMany({
    where: { subject_id: subjectId },
    orderBy: { created_at: 'desc' },
  });
};

//cập nhật zone
export const updateZone = async (id: string, data: Partial<ZoneData>) => {
  return await prisma.zone.update({
    where: { id },
    data,
  });
};

//xóa zone
export const deleteZone = async (id: string) => {
  return await prisma.zone.delete({
    where: { id },
  });
};