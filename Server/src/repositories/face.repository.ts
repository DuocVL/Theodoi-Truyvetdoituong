
import { prisma } from '@/configs/prisma';
import type { FaceData } from '@prisma/client';

// Type cho dữ liệu thô trả về từ CSDL, vì Prisma không hiểu `vector`.
type RawFaceDataResult = Omit<FaceData, 'embedding'> & { embedding: string };

/**
 * Chuyển đổi dữ liệu thô từ CSDL (với embedding dạng string)
 * sang dạng FaceData chuẩn (với embedding dạng number[]).
 */
const toFaceData = (raw: RawFaceDataResult): FaceData => {
  return {
    ...raw,
    embedding: JSON.parse(raw.embedding),
  };
};

export class FaceRepository {
  /**
   * Tạo một bản ghi face_data mới.
   * @param subject_id ID của subject
   * @param embedding Vector embedding khuôn mặt
   * @returns Bản ghi FaceData vừa được tạo.
   */
  public async create(subject_id: string, embedding: number[]): Promise<FaceData> {
    const embeddingString = `[${embedding.join(',')}]`;

    const result = await prisma.$queryRaw<RawFaceDataResult[]>`
      INSERT INTO "face_data" (subject_id, embedding, status)
      VALUES (${subject_id}, ${embeddingString}::vector, 'ACTIVE')
      RETURNING *;
    `;

    return toFaceData(result[0]);
  }

  /**
   * Lấy tất cả các bản ghi face_data của một subject.
   * @param subject_id ID của subject.
   * @returns Mảng các bản ghi FaceData.
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
   * Lấy bản ghi face_data active gần nhất của một subject.
   * Được sử dụng bởi worker để so sánh khuôn mặt.
   * @param subject_id ID của subject.
   * @returns Bản ghi FaceData hoặc null nếu không tìm thấy.
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
