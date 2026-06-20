import { prisma } from '../configs/prisma';
import { FaceData as PrismaFaceData } from '../../generated/prisma/client';

// 1. Định nghĩa Type chuẩn mong muốn ở Application Layer (Service/Controller)
export type CustomFaceData = Omit<PrismaFaceData, 'embedding'> & {
  embedding: number[];
};

// 2. Định nghĩa Type thô trả về từ câu lệnh SQL raw query
type RawFaceDataResult = Omit<PrismaFaceData, 'embedding'> & {
  embedding: string; // pgvector trả về chuỗi "[1,2,3...]" khi cast sang text
};

/**
 * Hàm tiện ích chuyển đổi dữ liệu thô từ CSDL sang kiểu dữ liệu ứng dụng nhận diện được
 */
const toFaceData = (raw: RawFaceDataResult): CustomFaceData => {
  return {
    id: raw.id,
    subject_id: raw.subject_id,
    created_at: raw.created_at,
    update_at: raw.update_at,
    embedding: JSON.parse(raw.embedding), // Chuyển chuỗi "[1,2...]" thành number[]
  };
};

export class FaceRepository {
  /**
   * Tạo một bản ghi face_data mới bằng câu lệnh SQL Raw
   */
  public async create(subject_id: string, embedding: number[]): Promise<CustomFaceData> {
    const embeddingString = `[${embedding.join(',')}]`;

    // Ép kiểu embedding thành ::text ở mệnh đề RETURNING để Node.js nhận dạng được chuỗi
    const result = await prisma.$queryRaw<RawFaceDataResult[]>`
      INSERT INTO "face_data" (subject_id, embedding)
      VALUES (${subject_id}, ${embeddingString}::vector)
      RETURNING id, subject_id, created_at, update_at, embedding::text as embedding;
    `;

    return toFaceData(result[0]);
  }

  /**
   * Lấy toàn bộ bản ghi face_data của một subject
   */
  public async findBySubjectId(subject_id: string): Promise<CustomFaceData[]> {
    const results = await prisma.$queryRaw<RawFaceDataResult[]>`
      SELECT id, subject_id, created_at, update_at, embedding::text as embedding
      FROM "face_data" 
      WHERE subject_id = ${subject_id}
      ORDER BY created_at DESC;
    `;

    return results.map(toFaceData);
  }

  /**
   * Lấy bản ghi face_data mới nhất của một subject
   */
  public async findLatestActiveBySubjectId(subject_id: string): Promise<CustomFaceData | null> {
    const result = await prisma.$queryRaw<RawFaceDataResult[]>`
      SELECT id, subject_id, created_at, update_at, embedding::text as embedding
      FROM "face_data" 
      WHERE subject_id = ${subject_id}
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    if (result.length === 0) return null;
    return toFaceData(result[0]);
  }
}