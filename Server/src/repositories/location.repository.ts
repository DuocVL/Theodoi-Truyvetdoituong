import { prisma } from "../configs/prisma";

//reposity phục vụ việc làm việc với csdl location

export class LocationRepository {

  //tạo bản ghi location mới
  async create(data: any) {
    return prisma.locationHistory.create({ data });
  }

  //lấy danh sách location có phân trang take bản ghi/page , skip số bản ghi bỏ qua 
  async getHistory({ subject_id, from, to, skip, take }: { subject_id: string; from: Date; to: Date; skip: number; take: number }) 
  {
    //xác định điều kiện lọc , theo subjectId và khoản thười gian
    const where = { subject_id, recorded_at: { gte: from, lte: to } };

    //lấy danh sách locaticon và tính tổng phục vụ phân trang
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