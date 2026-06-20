
/**
 * @file checkin.service.ts
 * @description Service chứa logic nghiệp vụ cho module Checkin.
 */

import { CheckinRepository } from '../repositories/checkin.repository';
import { ImageService } from '../services/image.service'; // Giả sử đã có ImageService
import { HttpException } from '../exceptions/http-exception';
import type { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';
import type { Checkin, Image } from '../../generated/prisma/client'; // Import Image type
import { prisma } from '../configs/prisma';

export class CheckinService {
  // Service khởi tạo các dependency của nó
  private checkinRepository = new CheckinRepository();
  private imageService = new ImageService();

  /**
   * @description Nghiệp vụ tạo mới một check-in.
   * Điều phối việc upload ảnh và tạo bản ghi check-in.
   */
  public async createCheckin(
    accountId: string,
    checkinData: CreateCheckinDto,
    imageFile: Express.Multer.File
  ): Promise<Checkin> {
    // 1. Xác định subject từ accountId
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) {
      throw new HttpException(403, 'Forbidden: User is not a subject');
    }

    // 2. Upload ảnh và lấy ID
    const image: Image = await this.imageService.uploadImage(imageFile, 'checkins');

    // 3. Tạo bản ghi checkin trong DB
    const newCheckin = await this.checkinRepository.create({
      ...checkinData,
      subject_id: subject.id,
      image_id: image.id, // image_id là string
    });

    return newCheckin;
  }

  /**
   * @description Lấy một checkin bằng ID.
   */
  public async getCheckinById(id: string): Promise<Checkin> {
    const checkin = await this.checkinRepository.findById(id);
    if (!checkin) {
      throw new HttpException(404, 'Check-in not found');
    }
    return checkin;
  }

  /**
   * @description Lấy tất cả checkin của một subject.
   */
  public async getCheckinsBySubjectId(subjectId: string): Promise<Checkin[]> {
    return this.checkinRepository.findBySubjectId(subjectId);
  }

  /**
   * @description Cập nhật ghi chú cho một checkin.
   * Chỉ chủ sở hữu của checkin mới có quyền cập nhật.
   */
  public async updateCheckinNotes(
    accountId: string,
    checkinId: string,
    updateData: UpdateCheckinDto
  ): Promise<Checkin> {
    // 1. Lấy thông tin checkin và subject của người dùng hiện tại
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');

    const checkin = await this.checkinRepository.findById(checkinId);
    if (!checkin) throw new HttpException(404, 'Check-in not found');

    // 2. Kiểm tra quyền sở hữu
    if (checkin.subject_id !== subject.id) {
      throw new HttpException(403, 'Forbidden: You do not own this check-in');
    }

    // 3. Cập nhật
    return this.checkinRepository.update(checkinId, updateData);
  }
}
