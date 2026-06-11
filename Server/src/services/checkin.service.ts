
import { CheckinRepository } from '@/repositories/checkin.repository';
import { ImageService } from '@/services/image.service'; // Service mới
import { FaceService } from '@/services/face.service';   // Service mới
import { CreateCheckinDto } from '@/dtos/checkin.dto';
import { HttpException } from '@/exceptions/http-exception';
import { Checkin } from '@prisma/client';
import { UploadedFile } from 'express-fileupload'; // Giả định sử dụng express-fileupload

export class CheckinService {
  // 1. Service giờ đây phụ thuộc vào 3 thành phần
  constructor(
    private readonly checkinRepository: CheckinRepository,
    private readonly imageService: ImageService,
    private readonly faceService: FaceService,
  ) {}

  /**
   * Điều phối toàn bộ quy trình check-in phức tạp.
   *
   * @param checkinDto Dữ liệu check-in từ client (location, notes...)
   * @param checkinImage File ảnh được upload
   * @param embedding Dữ liệu embedding khuôn mặt để xác thực
   */
  public async createCheckin(
    checkinDto: CreateCheckinDto,
    checkinImage: UploadedFile, 
    embedding: number[],
  ): Promise<Checkin> {
    // BƯỚC 1: Xác thực khuôn mặt. Nếu thất bại, sẽ có exception ném ra.
    const isVerified = await this.faceService.verifySubjectByEmbedding(
      checkinDto.subject_id,
      embedding,
    );

    if (!isVerified) {
      throw new HttpException(403, 'Face verification failed. Check-in denied.');
    }

    // BƯỚC 2: Nếu xác thực thành công, tiến hành lưu ảnh.
    // Service ảnh sẽ xử lý việc lưu file và tạo bản ghi trong DB.
    const imageRecord = await this.imageService.uploadAndCreateImageRecord(
      checkinImage,
      'checkin_images', // Thư mục lưu ảnh check-in
    );

    // BƯỚC 3: Gán ID ảnh vừa tạo vào DTO.
    const fullCheckinData = {
      ...checkinDto,
      image_id: imageRecord.id, // Lấy ID từ bản ghi ảnh vừa tạo
    };

    // BƯỚC 4: Tạo bản ghi check-in với đầy đủ thông tin.
    const newCheckin = await this.checkinRepository.createCheckin(fullCheckinData);

    return newCheckin;
  }

  // --- CÁC PHƯƠNG THỨC KHÁC GIỮ NGUYÊN ---

  public async getCheckinById(id: string): Promise<Checkin> {
    const checkin = await this.checkinRepository.findCheckinById(id);
    if (!checkin) {
      throw new HttpException(404, 'Check-in not found');
    }
    return checkin;
  }

  public async getCheckinsBySubject(subjectId: string): Promise<Checkin[]> {
    const checkins = await this.checkinRepository.findCheckinsBySubject(subjectId);
    return checkins;
  }

  // ... update và delete giữ nguyên ...
}
