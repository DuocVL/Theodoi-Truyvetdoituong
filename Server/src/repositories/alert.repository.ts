import { prisma } from '../configs/prisma';
import { Alert, Prisma } from '../../generated/prisma/client';

export const createAlert = async (
  data: Prisma.AlertCreateInput
): Promise<Alert> => {
  return await prisma.alert.create({ data });
};

export const getAlertById = async (
  id: string
): Promise<Alert | null> => {
  return await prisma.alert.findUnique({ where: { id } });
};

export const getAllAlerts = async (): Promise<Alert[]> => {
  return await prisma.alert.findMany();
};
