
/**
 * @file checkin.repository.ts
 * @description Lớp Repository chịu trách nhiệm giao tiếp trực tiếp với DB cho model `Checkin`.
 */

import { prisma } from '@/configs/prisma';
import type { Checkin } from '@prisma/client';
import type { CreateCheckinDto, UpdateCheckinDto } from '@/dtos/checkin.dto';

// Tạo một kiểu dữ liệu mở rộng để bao gồm cả image_id, vì nó là tùy chọn trong DTO
type CheckinCreationData = CreateCheckinDto & { subject_id: string; image_id?: string };

export class CheckinRepository {
  /**
   * @description Tạo một bản ghi check-in mới.
   */
  public async create(data: CheckinCreationData): Promise<Checkin> {
    return prisma.checkin.create({ data });
  }

  /**
   * @description Tìm một check-in bằng ID, bao gồm cả thông tin ảnh liên quan.
   */
  public async findById(id: string): Promise<Checkin | null> {
    return prisma.checkin.findUnique({
      where: { id },
      include: { image: true }, // Kèm thông tin ảnh
    });
  }

  /**
   * @description Tìm tất cả check-in của một subject, sắp xếp theo thời gian mới nhất.
   */
  public async findBySubjectId(subjectId: string): Promise<Checkin[]> {
    return prisma.checkin.findMany({
      where: { subject_id: subjectId },
      orderBy: { checkin_time: 'desc' },
      include: { image: true },
    });
  }

  /**
   * @description Cập nhật một check-in.
   */
  public async update(id: string, data: UpdateCheckinDto): Promise<Checkin> {
    return prisma.checkin.update({
      where: { id },
      data,
    });
  }
}
