
import { FaceRepository } from '@/repositories/face.repository';
import { HttpException } from '@/exceptions/http-exception';
import axios from 'axios';
import FormData from 'form-data';
import { FaceData } from '@prisma/client';

// Địa chỉ của service Python xử lý AI
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://face-service:5000';

export class FaceService {
  constructor(private readonly faceRepository: FaceRepository) {}

  /**
   * Gọi service Python để tạo embedding từ nhiều ảnh, sau đó lưu vào CSDL.
   * @param subjectId ID của subject đang đăng ký.
   * @param files Mảng các file ảnh upload.
   * @returns Bản ghi FaceData mới được tạo.
   */
  public async registerFace(
    subjectId: string,
    files: Express.Multer.File[],
  ): Promise<FaceData> {
    if (!files || files.length < 3) {
      throw new HttpException(400, 'At least 3 images are required for registration.');
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file.buffer, file.originalname);
    });

    try {
      // Gọi đến service Python để lấy embedding trung bình
      const response = await axios.post(
        `${FACE_SERVICE_URL}/register`,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      const embedding: number[] = response.data.embedding;

      if (!embedding) {
        throw new HttpException(500, 'Failed to generate embedding from face service.');
      }

      // Lưu embedding vào CSDL thông qua repository
      const newFaceData = await this.faceRepository.create(subjectId, embedding);
      return newFaceData;

    } catch (error) {
      console.error('Error calling face service:', error);
      throw new HttpException(502, 'Bad Gateway: Could not connect to face processing service.');
    }
  }

  /**
   * Lấy tất cả dữ liệu khuôn mặt đã đăng ký của một subject.
   * @param subjectId ID của subject.
   * @returns Mảng các bản ghi FaceData.
   */
  public async getFaceDataForSubject(subjectId: string): Promise<FaceData[]> {
    const faceData = await this.faceRepository.findBySubjectId(subjectId);
    if (!faceData || faceData.length === 0) {
      throw new HttpException(404, `No face data found for subject with ID ${subjectId}`);
    }
    return faceData;
  }
}
