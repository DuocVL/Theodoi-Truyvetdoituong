import { prisma } from '../configs/prisma';
import type { Checkin, CheckinStatus } from '../../generated/prisma/client';
import type { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';

//định nghĩa cấu trúc dùng để tạo mới 1 bản ghi checkin
type CheckinCreationData = CreateCheckinDto & { 
  subject_id: string;
  image_id?: string;
  zone_id?: string;
  status?: CheckinStatus;
};

//Quản lý việc truy cập csdl liên quan đến checkin
export class CheckinRepository {

  //Tạo mới bản ghi checkin kèm liên kết bản ghi ảnh xác thực bảng 'image'
  public async create(data: CheckinCreationData): Promise<Checkin> {
    return prisma.checkin.create({ data, include: { image: true } });
  }

  //cập nhật checkin(không dùng)
  public async update(id: string, data: UpdateCheckinDto): Promise<Checkin>{
    return prisma.checkin.update({
      where: { id },
      data
    });
  }

  //truy cấn thông tin chi tiết 1 bản ghi checkin theo id
  public async findById(id: string): Promise<Checkin | null> {
    return prisma.checkin.findUnique({ where: { id }, include: { image: true } });
  }

  //lấy danh sách lịch sử checckin
  public async findBySubjectIdPaginated(subjectId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;//số dòng cần bỏ qua
    const [data, total] = await Promise.all([
      prisma.checkin.findMany({
        where: { subject_id: subjectId },
        include: { subject: { select: { full_name: true } } },//lấy họ tên đối tượng
        orderBy: { checkin_time: 'desc' },//sắp xếp check-in mới nhất lên đầu
        skip,
        take: limit,
      }),
      prisma.checkin.count({ where: { subject_id: subjectId } }),//lấy tổng bản ghi phục vụ phân trang
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  //Lấy danh sách checkin phân trang của 1 nhóm đối tượng
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

  //Lọc điểm danh theo khoảng thời gian của 1 đối tượng
  public async findBySubjectIdAndTimeRange(subjectId: string, start: Date, end: Date, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const whereClause = {
      subject_id: subjectId,
      checkin_time: { gte: start, lte: end }
    };
    
    const [data, total,] = await Promise.all([
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

  //Lọc điểm danh theo khoảng thời gian của 1 nhóm đối tượng
  public async findBySubjectIdsAndTimeRange(subjectIds: string[], start: Date, end: Date, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const whereClause = {
      subject_id: { in: subjectIds },
      checkin_time: { gte: start, lte: end }
    };
    
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
}