
/**
 * @file face.repository.ts
 * @description
 * Lớp Repository chịu trách nhiệm giao tiếp trực tiếp với cơ sở dữ liệu cho bảng `face_data`.
 * Nó đóng gói tất cả các truy vấn SQL (bao gồm cả các truy vấn raw cho kiểu `vector`),
 * cung cấp các phương thức CRUD rõ ràng để lớp Service có thể sử dụng mà không cần biết chi tiết về CSDL.
 */

import { prisma } from '../configs/prisma';
import { FaceData } from '../../generated/prisma/client';

// Type cho dữ liệu thô trả về từ CSDL, vì Prisma không tự map kiểu `vector` sang number[].
type RawFaceDataResult = Omit<FaceData, 'embedding'> & { embedding: string };

/**
 * @description Hàm tiện ích để chuyển đổi dữ liệu thô từ CSDL (embedding dạng string) 
 * sang dạng FaceData chuẩn (embedding dạng number[]).
 */
const toFaceData = (raw: RawFaceDataResult): FaceData => {
  return {
    ...raw,
    embedding: JSON.parse(raw.embedding), // Chuyển đổi chuỗi vector thành mảng số
  };
};

export class FaceRepository {
  /**
   * @description Tạo một bản ghi face_data mới bằng raw query để hỗ trợ kiểu `vector`.
   * @param {string} subject_id - ID của subject liên quan.
   * @param {number[]} embedding - Vector embedding khuôn mặt.
   * @returns {Promise<FaceData>} - Bản ghi FaceData vừa được tạo.
   */
  public async create(subject_id: string, embedding: number[]): Promise<FaceData> {
    // Chuyển mảng embedding thành chuỗi định dạng vector của pgvector: '[1,2,3]'
    const embeddingString = `[${embedding.join(',')}]`;

    // Sử dụng $queryRaw để thực thi câu lệnh SQL gốc
    const result = await prisma.$queryRaw<RawFaceDataResult[]>`
      INSERT INTO "face_data" (subject_id, embedding, status)
      VALUES (${subject_id}, ${embeddingString}::vector, 'ACTIVE')
      RETURNING *;
    `;

    return toFaceData(result[0]);
  }

  /**
   * @description Lấy tất cả các bản ghi face_data của một subject.
   * @param {string} subject_id - ID của subject.
   * @returns {Promise<FaceData[]>} - Mảng các bản ghi FaceData, sắp xếp theo ngày tạo mới nhất.
   */
  public async findBySubjectId(subject_id: string): Promise<FaceData[]> {
    const results = await prisma.$queryRaw<RawFaceDataResult[]>`
      SELECT *
      FROM "face_data" WHERE subject_id = ${subject_id}
      ORDER BY created_at DESC;
    `;

    return results.map(toFaceData);
  }

  /**
   * @description Lấy bản ghi face_data active gần nhất của một subject.
   * Thường được dùng cho các tác vụ so sánh, nhận dạng.
   * @param {string} subject_id - ID của subject.
   * @returns {Promise<FaceData | null>} - Bản ghi FaceData hoặc null nếu không tìm thấy.
   */
  public async findLatestActiveBySubjectId(subject_id: string): Promise<FaceData | null> {
    const result = await prisma.$queryRaw<RawFaceDataResult[]>`
      SELECT *
      FROM "face_data" 
      WHERE subject_id = ${subject_id} AND status = 'ACTIVE'
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    if (result.length === 0) {
      return null;
    }

    return toFaceData(result[0]);
  }
}
