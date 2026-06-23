// src/repositories/alert.repository.ts
import { prisma } from '../configs/prisma';

interface CreateAlertData {
  subject_id: string;
  zone_id?: string | null;
  checkin_id?: string | null;
  type: 'RESTRICTED_ENTRY' | 'MISSED_CHECKIN';
  message?: string;
}

export const getAlerts = async (
  page: number,
  limit: number,
  whereClause: any
) => {
  const skip = (page - 1) * limit;
  const [alerts, total] = await prisma.$transaction([
    prisma.alert.findMany({
      where: whereClause,
      include: { subject: true, zone: true },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.alert.count({ where: whereClause }),
  ]);
  return { alerts, total };
};

export const createAlert = async (data: CreateAlertData) => {
  return await prisma.alert.create({ data });
};

// MỚI - hàm bị thiếu, dùng để chống tạo trùng MISSED_CHECKIN trong cùng 1 lần trễ
export const findRecentMissedAlert = async (subjectId: string, sinceDate: Date) => {
  return prisma.alert.findFirst({
    where: { subject_id: subjectId, type: 'MISSED_CHECKIN', created_at: { gte: sinceDate } },
  });
};