import { prisma } from '../configs/prisma';
import type { FaceData, Prisma } from '../../generated/prisma/client';

export const createFaceData = async (data: Prisma.FaceDataCreateInput): Promise<FaceData> => {
  return await prisma.faceData.create({ data });
};

export const getFaceDataById = async (id: string): Promise<FaceData | null> => {
  return await prisma.faceData.findUnique({ where: { id } });
};

export const getFaceDataBySubjectId = async (subject_id: string): Promise<FaceData[]> => {
    return await prisma.faceData.findMany({ where: { subject_id } });
};

export const getAllFaceData = async (): Promise<FaceData[]> => {
  return await prisma.faceData.findMany();
};

export const deleteFaceData = async (id: string): Promise<FaceData> => {
  return await prisma.faceData.delete({ where: { id } });
};
