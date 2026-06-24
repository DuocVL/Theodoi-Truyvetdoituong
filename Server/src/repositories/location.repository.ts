import { prisma } from "../configs/prisma";

export class LocationRepository {
  async create(data: any) {
    return prisma.locationHistory.create({ data });
  }

  async getHistory({ subject_id, from, to, skip, take }: { 
    subject_id: string; from: Date; to: Date; skip: number; take: number 
  }) {
    const where = { subject_id, recorded_at: { gte: from, lte: to } };

    const [data, total] = await Promise.all([
      prisma.locationHistory.findMany({ where, orderBy: { recorded_at: "asc" }, skip, take }),
      prisma.locationHistory.count({ where })
    ]);

    return {
      data,
      pagination: {
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }
}