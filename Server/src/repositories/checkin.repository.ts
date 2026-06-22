/**
 * @file checkin.repository.ts
 */
import { prisma } from '../configs/prisma';
import type { Checkin } from '../../generated/prisma/client';
import type { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';

type CheckinCreationData = CreateCheckinDto & { 
  subject_id: string;
  image_id?: string;
  zone_id?: string | null;
  status?: string;
};

export class CheckinRepository {
  public async create(data: CheckinCreationData): Promise<Checkin> {
    return prisma.checkin.create({ data, include: { image: true } });
  }

  public async update(id: string, data: UpdateCheckinDto): Promise<Checkin>{
    return prisma.checkin.update({
      where: { id },
      data
    });
  }

  public async findById(id: string): Promise<Checkin | null> {
    return prisma.checkin.findUnique({ where: { id }, include: { image: true } });
  }

  public async findBySubjectIdPaginated(subjectId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.checkin.findMany({
        where: { subject_id: subjectId },
        include: { subject: { select: { full_name: true } } },
        orderBy: { checkin_time: 'desc' },
        skip,
        take: limit,
      }),
      prisma.checkin.count({ where: { subject_id: subjectId } }),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  public async findBySubjectIdsPaginated(subjectIds: string[], page: number, limit: number) {
    const skip = (page - 1) * limit;
    const whereClause = { subject_id: { in: subjectIds } };
    const [data, total] = await Promise.all([
      prisma.checkin.findMany({
        where: whereClause,
        include: { subject: { select: { full_name: true } } },
        orderBy: { checkin_time: 'desc' },
        skip,
        take: limit,
      }),
      prisma.checkin.count({ where: whereClause }),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  public async findBySubjectIdAndTimeRange(subjectId: string, start: Date, end: Date, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const whereClause = {
      subject_id: subjectId,
      checkin_time: { gte: start, lte: end }
    };
    
    const [data, total, allPoints] = await Promise.all([
      prisma.checkin.findMany({
        where: whereClause,
        include: { subject: { select: { full_name: true } } },
        orderBy: { checkin_time: 'desc' },
        skip,
        take: limit,
      }),
      prisma.checkin.count({ where: whereClause }),
      prisma.checkin.findMany({
        where: whereClause,
        include: { subject: { select: { full_name: true } } },
        orderBy: { checkin_time: 'asc' },
      })
    ]);
    return { data, allPoints, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * MỚI: Truy vấn lọc thời gian chi tiết (Ngày + Giờ) cho NHIỀU đối tượng được quản lý
   */
  public async findBySubjectIdsAndTimeRange(subjectIds: string[], start: Date, end: Date, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const whereClause = {
      subject_id: { in: subjectIds },
      checkin_time: { gte: start, lte: end }
    };
    
    const [data, total, allPoints] = await Promise.all([
      prisma.checkin.findMany({
        where: whereClause,
        include: { subject: { select: { full_name: true } } },
        orderBy: { checkin_time: 'desc' },
        skip,
        take: limit,
      }),
      prisma.checkin.count({ where: whereClause }),
      prisma.checkin.findMany({
        where: whereClause,
        include: { subject: { select: { full_name: true } } },
        orderBy: { checkin_time: 'asc' },
      })
    ]);
    return { data, allPoints, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}