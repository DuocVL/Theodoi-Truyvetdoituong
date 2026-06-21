
/**
 * @file checkin.repository.ts
 * @description Lớp Repository chịu trách nhiệm giao tiếp trực tiếp với DB cho model `Checkin`.
 */

import { prisma } from '../configs/prisma';
import type { Checkin } from '../../generated/prisma/client';
import type { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';

type CheckinCreationData = CreateCheckinDto & { subject_id: string; image_id?: string };

export class CheckinRepository {
  public async create(data: CheckinCreationData): Promise<Checkin> {
    return prisma.checkin.create({
      data,
      include: { image: true }, // Luôn kèm ảnh
    });
  }

  public async findById(id: string): Promise<Checkin | null> {
    return prisma.checkin.findUnique({
      where: { id },
      include: { image: true },
    });
  }

  public async findBySubjectIdPaginated(subjectId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.checkin.findMany({
        where: { subject_id: subjectId },
        orderBy: { checkin_time: 'desc' },
        skip,
        take: limit,
        include: { image: true }, // Luôn kèm ảnh
      }),
      prisma.checkin.count({
        where: { subject_id: subjectId },
      }),
    ]);
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Mới: Lấy checkin từ nhiều subjectId
  public async findBySubjectIdsPaginated(subjectIds: string[], page: number, limit: number) {
    const skip = (page - 1) * limit;
    const whereClause = { subject_id: { in: subjectIds } };

    const [data, total] = await Promise.all([
      prisma.checkin.findMany({
        where: whereClause,
        orderBy: { checkin_time: 'desc' },
        skip,
        take: limit,
        include: { image: true }, // Luôn kèm ảnh
      }),
      prisma.checkin.count({ where: whereClause }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  public async update(id: string, data: UpdateCheckinDto): Promise<Checkin> {
    return prisma.checkin.update({
      where: { id },
      data,
      include: { image: true }, // Luôn kèm ảnh
    });
  }
}
