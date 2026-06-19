
/**
 * @file face.service.ts
 * @description
 * Lớp Service chứa logic nghiệp vụ cốt lõi cho module Face.
 * Nó được gọi bởi FaceController và tương tác với FaceRepository để thực hiện các thao tác 
 * liên quan đến dữ liệu khuôn mặt như lưu trữ và truy xuất.
 */

import { FaceRepository } from '../repositories/face.repository';
import { HttpException } from '../exceptions/http-exception';
import { FaceData } from '@prisma/client';

export class FaceService {
  // Tiêm FaceRepository vào qua constructor
  constructor(private readonly faceRepository: FaceRepository) {}

  /**
   * @description Nghiệp vụ lưu một vector embedding mới cho một subject.
   * @param {string} subjectId - ID của subject.
   * @param {number[]} embedding - Vector embedding khuôn mặt.
   * @returns {Promise<FaceData>} - Bản ghi face_data vừa được tạo.
   */
  public async registerFace(
    subjectId: string,
    embedding: number[],
  ): Promise<FaceData> {
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new HttpException(400, 'Invalid or empty embedding vector provided.');
    }

    // Gọi repository để lưu vào CSDL
    const newFaceData = await this.faceRepository.create(subjectId, embedding);
    return newFaceData;
  }

  /**
   * @description Nghiệp vụ lấy tất cả dữ liệu khuôn mặt của một subject.
   * @param {string} subjectId - ID của subject.
   * @returns {Promise<FaceData[]>} - Một mảng các bản ghi face_data.
   */
  public async getFaceDataForSubject(subjectId: string): Promise<FaceData[]> {
    // Gọi repository để truy xuất từ CSDL
    const faceData = await this.faceRepository.findBySubjectId(subjectId);
    return faceData;
  }
}
