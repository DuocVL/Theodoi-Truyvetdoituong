
import { FaceRepository } from '@/repositories/face.repository';
import { HttpException } from '@/exceptions/http-exception';
import { FaceData } from '@prisma/client';

export class FaceService {
  constructor(private readonly faceRepository: FaceRepository) {}

  /**
   * Lưu một vector embedding mới vào CSDL cho một subject.
   * @param subjectId ID của subject đang đăng ký.
   * @param embedding Mảng số thực (vector) đại diện cho khuôn mặt.
   * @returns Bản ghi FaceData mới được tạo.
   */
  public async registerFace(
    subjectId: string,
    embedding: number[],
  ): Promise<FaceData> {
    // Dữ liệu embedding bây giờ được truyền trực tiếp
    // Không cần gọi service ngoài nữa
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new HttpException(400, 'Invalid or empty embedding vector provided.');
    }

    // Lưu embedding vào CSDL thông qua repository
    const newFaceData = await this.faceRepository.create(subjectId, embedding);
    return newFaceData;
  }

  /**
   * Lấy tất cả dữ liệu khuôn mặt đã đăng ký của một subject.
   * @param subjectId ID của subject.
   * @returns Mảng các bản ghi FaceData.
   */
  public async getFaceDataForSubject(subjectId: string): Promise<FaceData[]> {
    const faceData = await this.faceRepository.findBySubjectId(subjectId);
    // Không ném lỗi 404 nếu không có dữ liệu, trả về mảng rỗng là hợp lý.
    return faceData;
  }
}
