import { prisma } from '../configs/prisma';
import { FaceData as PrismaFaceData } from '../../generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';

export type CustomFaceData = Omit<PrismaFaceData, 'embedding'> & {
  embedding: number[];
};

type RawFaceDataResult = Omit<PrismaFaceData, 'embedding'> & {
  embedding: string; 
};

const toFaceData = (raw: RawFaceDataResult): CustomFaceData => {
  return {
    id: raw.id,
    subject_id: raw.subject_id,
    created_at: raw.created_at,
    update_at: raw.update_at,
    embedding: JSON.parse(raw.embedding), 
  };
};

export class FaceRepository {

  /**
   * Kiểm tra xem subject đã có dữ liệu khuôn mặt trong DB chưa
   */
  public async existsBySubjectId(subject_id: string): Promise<boolean> {
    const result = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count 
      FROM "face_data" 
      WHERE subject_id = ${subject_id};
    `;
    return result[0].count > 0;
  }

  /**
   * Tạo hoặc Ghi đè (Xóa cũ tạo mới) bản ghi khuôn mặt để đảm bảo tối đa 1 bản ghi
   */
  public async create(subject_id: string, embedding: number[]): Promise<CustomFaceData> {
    const newId = uuidv4();
    const embeddingString = `[${embedding.join(',')}]`;
    const now = new Date();

    // Thực hiện trong một Transaction: Xóa bản ghi cũ (nếu có) trước khi tạo mới
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM "face_data" WHERE subject_id = ${subject_id};
      `;

      const result = await tx.$queryRaw<RawFaceDataResult[]>`
        INSERT INTO "face_data" (id, subject_id, embedding, created_at, update_at)
        VALUES (${newId}, ${subject_id}, ${embeddingString}::vector, ${now}, ${now})
        RETURNING id, subject_id, created_at, update_at, embedding::text as embedding;
      `;

      return toFaceData(result[0]);
    });
  }

  /**
   * Lấy bản ghi face_data duy nhất của một subject. Trả về null nếu chưa có.
   */
  public async findBySubjectId(subject_id: string): Promise<CustomFaceData | null> {
    const result = await prisma.$queryRaw<RawFaceDataResult[]>`
      SELECT id, subject_id, created_at, update_at, embedding::text as embedding
      FROM "face_data" 
      WHERE subject_id = ${subject_id}
      LIMIT 1;
    `;

    // Nếu mảng rỗng (chưa đăng ký), trả về null
    if (result.length === 0) return null;

    return toFaceData(result[0]);
  }
}