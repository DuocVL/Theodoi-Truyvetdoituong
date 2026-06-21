
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

  // Cập nhật: Service cho /subject/:subjectId
  public async getCheckinsBySubject(subjectId: string, page: number, limit: number, requestingUser: { id: string; role: string }) {
    if (requestingUser.role !== 'ADMIN') {
      // Nếu không phải ADMIN, kiểm tra xem USER có quản lý subject này không
      const userManagesSubject = await prisma.user.findFirst({
        where: {
          account_id: requestingUser.id,
          managed_subjects: {
            some: { id: subjectId },
          },
        },
      });
      if (!userManagesSubject) {
        throw new HttpException(403, 'Forbidden: You do not manage this subject');
      }
    }
    // Nếu là ADMIN hoặc USER được quyền, lấy dữ liệu
    return this.checkinRepository.findBySubjectIdPaginated(subjectId, page, limit);
  }

  // Mới: Service cho /user
  public async getUserManagedCheckins(userId: string, page: number, limit: number) {
    // 1. Tìm tất cả subject ID mà user này quản lý
    const userWithManagedSubjects = await prisma.user.findUnique({
      where: { account_id: userId },
      select: { managed_subjects: { select: { id: true } } },
    });

    if (!userWithManagedSubjects || userWithManagedSubjects.managed_subjects.length === 0) {
      // Nếu user không quản lý subject nào, trả về mảng rỗng
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    const subjectIds = userWithManagedSubjects.managed_subjects.map(s => s.id);

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
