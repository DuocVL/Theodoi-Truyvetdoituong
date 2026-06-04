import { prisma } from '../configs/prisma';
import type { Image, Prisma } from '../../generated/prisma/client';

export const createImage = async (data: Prisma.ImageCreateInput): Promise<Image> => {
  return await prisma.image.create({ data });
};

export const getImageById = async (id: string): Promise<Image | null> => {
  return await prisma.image.findUnique({ where: { id } });
};

export const updateImage = async (
  id: string,
  data: Prisma.ImageUpdateInput
): Promise<Image> => {
  return await prisma.image.update({
    where: { id },
    data,
  });
};
