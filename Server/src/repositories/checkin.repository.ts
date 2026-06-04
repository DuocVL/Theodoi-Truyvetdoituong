import { prisma } from '../configs/prisma';
import type { Checkin, Prisma } from '@prisma/client';

export const createCheckin = async (
  data: Prisma.CheckinCreateInput
): Promise<Checkin> => {
  return await prisma.checkin.create({ data });
};

export const getCheckinById = async (id: string): Promise<Checkin | null> => {
  return await prisma.checkin.findUnique({ where: { id } });
};

export const findLastCheckin = async (subjectId: string): Promise<Checkin | null> => {
  return prisma.checkin.findFirst({
    where: {
      subject_id: subjectId,
    },
    orderBy: {
      checkin_time: 'desc',
    },
  });
};
