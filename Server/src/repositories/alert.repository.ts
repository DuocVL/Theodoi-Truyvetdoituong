import { prisma } from '../configs/prisma';

export const findAlerts = async (query: any, skip: number, take: number) => {
  return await prisma.alert.findMany({
    where: query,
    skip,
    take,
    orderBy: { created_at: 'desc' },
    include: { subject: true, zone: true }
  });
};

export const countAlerts = async (query: any) => {
  return await prisma.alert.count({ where: query });
};

export const createAlert = async (data: any) => {
  return await prisma.alert.create({ data });
};