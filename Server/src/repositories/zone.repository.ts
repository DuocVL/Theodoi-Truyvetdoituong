// src/repositories/zone.repository.ts
import { prisma } from '../configs/prisma';

interface ZoneData {
  subject_id: string;
  zone_name: string;
  type: 'SAFE' | 'RESTRICTED';
  latitude: number;
  longitude: number;
  radius: number;
  interval_minutes?: number;
  grace_minutes?: number; // Trường mới thêm từ Schema
  description?: string;
  is_active?: boolean;
  created_by: string;
}

export const createZone = async (data: ZoneData) => {
  return await prisma.zone.create({
    data: {
      ...data,
      description: data.description || null,
      is_active: data.is_active !== false,
    },
  });
};

export const getZoneById = async (id: string) => {
  return await prisma.zone.findUnique({
    where: { id },
    include: { 
      subject: true // Lấy kèm thông tin đối tượng giám sát để phục vụ logic phân quyền
    },
  });
};

export const getZonesBySubjectId = async (subjectId: string) => {
  return await prisma.zone.findMany({
    where: { subject_id: subjectId },
    orderBy: { created_at: 'desc' },
  });
};

export const updateZone = async (id: string, data: Partial<ZoneData>) => {
  return await prisma.zone.update({
    where: { id },
    data,
  });
};

export const deleteZone = async (id: string) => {
  return await prisma.zone.delete({
    where: { id },
  });
};