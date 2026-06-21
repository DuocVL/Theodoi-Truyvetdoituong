/**
 * @file checkin.service.ts
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

  // ... Các hàm createCheckin, getMyCheckins, getCheckinById, updateCheckinNotes giữ nguyên bản cũ ...

  public async createCheckin(accountId: string, checkinData: CreateCheckinDto, imageFile: Express.Multer.File): Promise<Checkin> {
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');
    const image: Image = await this.imageService.uploadImage(imageFile, 'checkins');
    return this.checkinRepository.create({ ...checkinData, subject_id: subject.id, image_id: image.id });
  }

  public async getMyCheckins(accountId: string, page: number, limit: number) {
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');
    return this.checkinRepository.findBySubjectIdPaginated(subject.id, page, limit);
  }

  public async getCheckinById(id: string): Promise<Checkin> {
    const checkin = await this.checkinRepository.findById(id);
    if (!checkin) throw new HttpException(404, 'Check-in not found');
    return checkin;
  }

  public async updateCheckinNotes(accountId: string, checkinId: string, updateData: UpdateCheckinDto): Promise<Checkin> {
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');
    const checkin = await this.checkinRepository.findById(checkinId);
    if (!checkin) throw new HttpException(404, 'Check-in not found');
    if (checkin.subject_id !== subject.id) throw new HttpException(403, 'Forbidden: You do not own this check-in');
    return this.checkinRepository.update(checkinId, updateData);
  }

  public async getCheckinsBySubject(subjectId: string, page: number, limit: number, userId: string, role: string) {
    if (role !== 'ADMIN') {
      const subject = await prisma.subject.findFirst({ where: { id: subjectId, created_by: userId } });
      if (!subject) throw new HttpException(403, 'Forbidden: You do not manage this subject');
    }
    return this.checkinRepository.findBySubjectIdPaginated(subjectId, page, limit);
  }

  public async getUserManagedCheckins(userId: string, page: number, limit: number) {
    const managedSubjects = await prisma.subject.findMany({ where: { created_by: userId }, select: { id: true } });
    if (!managedSubjects || managedSubjects.length === 0) {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    const subjectIds = managedSubjects.map((s) => s.id);
    return this.checkinRepository.findBySubjectIdsPaginated(subjectIds, page, limit);
  }

  public async getCheckinsBySubjectAndTime(
    subjectId: string, 
    startDateStr: string, 
    endDateStr: string, 
    startTimeStr: string | undefined, 
    endTimeStr: string | undefined, 
    page: number, 
    limit: number, 
    userId: string, 
    role: string
  ) {
    if (role !== 'ADMIN') {
      const subject = await prisma.subject.findFirst({ where: { id: subjectId, created_by: userId } });
      if (!subject) throw new HttpException(403, 'Forbidden: You do not manage this subject');
    }
    
    const start = new Date(startDateStr);
    if (startTimeStr) {
      const [h, m] = startTimeStr.split(':').map(Number);
      start.setHours(h, m, 0, 0);
    } else {
      start.setHours(0, 0, 0, 0);
    }

    const end = new Date(endDateStr);
    if (endTimeStr) {
      const [h, m] = endTimeStr.split(':').map(Number);
      end.setHours(h, m, 59, 999);
    } else {
      end.setHours(23, 59, 59, 999);
    }

    return this.checkinRepository.findBySubjectIdAndTimeRange(subjectId, start, end, page, limit);
  }

  /**
   * MỚI: Xử lý nghiệp vụ lọc thời gian kèm giờ của toàn bộ đối tượng thuộc quyền quản lý của User
   */
  public async getUserManagedCheckinsAndTime(
    userId: string, 
    startDateStr: string, 
    endDateStr: string, 
    startTimeStr: string | undefined, 
    endTimeStr: string | undefined, 
    page: number, 
    limit: number
  ) {
    const managedSubjects = await prisma.subject.findMany({ where: { created_by: userId }, select: { id: true } });
    if (!managedSubjects || managedSubjects.length === 0) {
      return { data: [], allPoints: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    const subjectIds = managedSubjects.map((s) => s.id);

    const start = new Date(startDateStr);
    if (startTimeStr) {
      const [h, m] = startTimeStr.split(':').map(Number);
      start.setHours(h, m, 0, 0);
    } else {
      start.setHours(0, 0, 0, 0);
    }

    const end = new Date(endDateStr);
    if (endTimeStr) {
      const [h, m] = endTimeStr.split(':').map(Number);
      end.setHours(h, m, 59, 999);
    } else {
      end.setHours(23, 59, 59, 999);
    }

    return this.checkinRepository.findBySubjectIdsAndTimeRange(subjectIds, start, end, page, limit);
  }
}