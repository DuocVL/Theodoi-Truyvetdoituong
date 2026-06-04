
import { prisma } from '../configs/prisma';
import { Zone, Prisma } from '@prisma/client';

export const createZone = async (
  data: Prisma.ZoneCreateInput
): Promise<Zone> => {
  return await prisma.zone.create({ data });
};

export const getZoneById = async (
  id: string
): Promise<Zone | null> => {
  return await prisma.zone.findUnique({ where: { id } });
};

export const getAllZones = async (): Promise<Zone[]> => {
  return await prisma.zone.findMany();
};

export const updateZone = async (
  id: string,
  data: Prisma.ZoneUpdateInput
): Promise<Zone> => {
  return await prisma.zone.update({
    where: { id },
    data,
  });
};

export const deleteZone = async (id: string): Promise<Zone> => {
  return await prisma.zone.delete({ where: { id } });
};
