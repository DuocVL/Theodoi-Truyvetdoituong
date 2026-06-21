
/**
 * @file checkin.service.ts
 * @description Service chứa logic nghiệp vụ cho module Checkin.
 */

import { CheckinRepository } from '../repositories/checkin.repository';
import { ImageService } from '../services/image.service';
import { HttpException } from '../exceptions/http-exception';
import type { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';
import type { Checkin, Image } from '../../generated/prisma/client';
import { prisma } from '../configs/prisma';

export class CheckinService {
  private checkinRepository = new CheckinRepository();
  private imageService = new ImageService();

  public async createCheckin(
    accountId: string,
    checkinData: CreateCheckinDto,
    imageFile: Express.Multer.File,
  ): Promise<Checkin> {
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) {
      throw new HttpException(403, 'Forbidden: User is not a subject');
    }
    const image: Image = await this.imageService.uploadImage(imageFile, 'checkins');
    return this.checkinRepository.create({
      ...checkinData,
      subject_id: subject.id,
      image_id: image.id,
    });
  }

  public async getMyCheckins(accountId: string, page: number, limit: number) {
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) {
      throw new HttpException(403, 'Forbidden: User is not a subject');
    }
    return this.checkinRepository.findBySubjectIdPaginated(subject.id, page, limit);
  }

  public async getCheckinById(id: string): Promise<Checkin> {
    const checkin = await this.checkinRepository.findById(id);
    if (!checkin) {
      throw new HttpException(404, 'Check-in not found');
    }
    return checkin;
  }

  public async getCheckinsBySubject(subjectId: string, page: number, limit: number, requestingUser: { id: string; role: string }) {
    if (requestingUser.role !== 'ADMIN') {
      // FIX: Lỗi xảy ra do 'managed_subjects' không tồn tại trên model User.
      // Thay đổi logic: truy vấn từ model Subject để kiểm tra xem nó có được quản lý bởi User hiện tại không.
      // Giả định rằng model Subject có một relation (quan hệ) đến User tên là `managed_by`.
      const subjectIsManagedByUser = await prisma.subject.findFirst({
        where: {
          id: subjectId,
          managed_by: {
            some: {
              account_id: requestingUser.id,
            },
          },
        },
      });

      if (!subjectIsManagedByUser) {
        throw new HttpException(403, 'Forbidden: You do not manage this subject');
      }
    }
    // Nếu là ADMIN hoặc USER được quyền, lấy dữ liệu
    return this.checkinRepository.findBySubjectIdPaginated(subjectId, page, limit);
  }

  public async getUserManagedCheckins(userId: string, page: number, limit: number) {
    // 1. Tìm tất cả subject ID mà user này quản lý
    // FIX: Lỗi xảy ra do 'managed_subjects' không tồn tại trên model User.
    // Thay đổi logic: Tìm tất cả các Subject được quản lý bởi User có account_id này.
    // Giả định rằng model Subject có một relation (quan hệ) đến User tên là `managed_by`.

    
    const managedSubjects = await prisma.subject.findMany({
      where: {
        created_by: userId
      },
      select: { id: true },
    });

    if (!managedSubjects || managedSubjects.length === 0) {
      // Nếu user không quản lý subject nào, trả về mảng rỗng
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    // FIX: Thêm kiểu cho 's' để giải quyết lỗi "implicitly has an 'any' type".
    const subjectIds = managedSubjects.map((s: { id: string }) => s.id);

    // 2. Lấy check-in từ các subject ID đó
    return this.checkinRepository.findBySubjectIdsPaginated(subjectIds, page, limit);
  }

  public async updateCheckinNotes(accountId: string, checkinId: string, updateData: UpdateCheckinDto): Promise<Checkin> {
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');

    const checkin = await this.checkinRepository.findById(checkinId);
    if (!checkin) throw new HttpException(404, 'Check-in not found');

    if (checkin.subject_id !== subject.id) {
      throw new HttpException(403, 'Forbidden: You do not own this check-in');
    }

    return this.checkinRepository.update(checkinId, updateData);
  }
}
