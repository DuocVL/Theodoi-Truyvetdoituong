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
      include:{
        subject:{
          select:{
            full_name: true,
          }
        }
      },
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

export const findRecentMissedAlert = async (subjectId: string, sinceDate: Date) => {
  return prisma.alert.findFirst({
    where: { subject_id: subjectId, type: 'MISSED_CHECKIN', created_at: { gte: sinceDate } },
  });
};